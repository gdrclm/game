(() => {
    const game = window.Game;
    const expedition = game.systems.expedition = game.systems.expedition || {};
    const islandLayout = game.systems.islandLayout = game.systems.islandLayout || {};
    const shared = game.systems.expeditionShared || {};
    const shapes = game.systems.expeditionShapeBuilders || {};
    const houseProfiles = game.systems.expeditionHouseProfiles || {};
    const finalIslandIndex = shared.finalIslandIndex || 30;
    const DIRECTIONS = shared.DIRECTIONS || [];
    const directionByName = shared.directionByName || {};
    const chunkKey = shared.chunkKey || ((x, y) => `${x},${y}`);
    const createIslandRandom = shared.createIslandRandom || (() => Math.random);
    const clamp = shared.clamp || ((value) => value);
    let worldLayoutPlan = null;

    const archetypeDefinitions = {
        normal: {
            label: 'Обычный остров',
            summary: 'Сбалансированный остров с несколькими маршрутными решениями.'
        },
        greedy: {
            label: 'Жадный остров',
            summary: 'Больше рискованных наград и неудобных развилок.'
        },
        emptyGiant: {
            label: 'Пустой гигант',
            summary: 'Большая территория, где ошибка в маршруте особенно дорогая.'
        },
        golden: {
            label: 'Золотой остров',
            summary: 'Редкая дорогая зона с насыщенными домами.'
        },
        finalVault: {
            label: 'Остров финального сундука',
            summary: 'Последний остров архипелага.'
        }
    };

    const scenarioDefinitions = {
        normal: {
            label: 'Обычный сценарий',
            summary: 'Стандартный остров без особых перекосов.'
        },
        crossingIsland: {
            label: 'Остров переправ',
            summary: 'Маршрут держится на узких водных переходах, и на вход лучше идти уже с мост-комплектом.'
        },
        depletedIsland: {
            label: 'Истощённый остров',
            summary: 'Лёгкая еда здесь почти не держится, и выживание снова приходится собирать через воду, улов и полевой крафт.'
        },
        trapIsland: {
            label: 'Остров-ловушка',
            summary: 'Больше рискованных домов, проклятых сундуков и неприятных находок.'
        },
        tradeIsland: {
            label: 'Торговый остров',
            summary: 'Здесь чаще встречаются торговцы, богатые дома и полезные покупки.'
        },
        noHouseIsland: {
            label: 'Остров без домов',
            summary: 'Пустой островной сценарий без зданий и внутренних точек интереса.'
        },
        jackpotIsland: {
            label: 'Остров-джекпот',
            summary: 'Редкий остров с элитными и джекпотными наградами.'
        }
    };

    const settlementDefinitions = {
        fishing: {
            label: 'Рыбацкое поселение',
            summary: 'Водные кромки заняты рыбаками, запасами еды и домами у берега.'
        },
        trade: {
            label: 'Торговый перевал',
            summary: 'Больше обмена, складов и домов, где каждая остановка превращается в сделку.'
        },
        craft: {
            label: 'Ремесленная слобода',
            summary: 'Мастерские и рабочие дома формируют остров, где путь часто ведёт через полезные, но дорогие решения.'
        },
        rich: {
            label: 'Богатое поселение',
            summary: 'Глубокие кварталы заняты богатыми домами, редкостями и дорогими шансами.'
        },
        ruined: {
            label: 'Полузаброшенное поселение',
            summary: 'Остров живой лишь частично: пустые дома, странные жители и ценные остатки прошлого стоят дорого.'
        }
    };

    function getWorldLayoutPlan() {
        if (worldLayoutPlan) {
            return worldLayoutPlan;
        }

        const directions = ['east', 'south', 'west', 'north'];
        const random = game.systems.utils.createSeededRandom(9017, -417);
        const primaryIndex = Math.floor(random() * directions.length);
        const primaryDirection = directions[primaryIndex];
        const turnClockwise = random() < 0.5 ? 1 : -1;
        const sideA = directions[(primaryIndex + turnClockwise + directions.length) % directions.length];
        const sideB = directions[(primaryIndex - turnClockwise + directions.length) % directions.length];
        const oppositeDirection = directions[(primaryIndex + 2) % directions.length];

        worldLayoutPlan = {
            primaryDirection,
            sideA,
            sideB,
            oppositeDirection,
            directionPriority: [primaryDirection, sideA, sideB]
        };

        return worldLayoutPlan;
    }

    function resetLayoutState() {
        worldLayoutPlan = null;
    }

    function getArchetypeDefinition(archetype) {
        return archetypeDefinitions[archetype] || archetypeDefinitions.normal;
    }

    function getScenarioDefinition(scenario) {
        return scenarioDefinitions[scenario] || scenarioDefinitions.normal;
    }

    function getSettlementDefinition(settlementType) {
        return settlementDefinitions[settlementType] || null;
    }

    function getIslandNeedProfileSystem() {
        return game.systems.islandNeedProfile || null;
    }

    function createCraftNeedSnapshot(islandIndex) {
        const islandNeedProfile = getIslandNeedProfileSystem();
        const needWindow = islandNeedProfile && typeof islandNeedProfile.getIslandNeedWindow === 'function'
            ? islandNeedProfile.getIslandNeedWindow(islandIndex)
            : null;
        const mandatory = needWindow && needWindow.mandatory ? needWindow.mandatory : { resources: [], branches: [] };
        const recommended = needWindow && needWindow.recommended ? needWindow.recommended : { resources: [], branches: [] };
        const optional = needWindow && needWindow.optional ? needWindow.optional : { resources: [], branches: [] };

        return {
            craftNeedWindowId: needWindow && typeof needWindow.windowId === 'string' ? needWindow.windowId : '',
            craftNeedFocus: needWindow && typeof needWindow.focus === 'string' ? needWindow.focus : '',
            craftNeedRule: needWindow && typeof needWindow.rule === 'string' ? needWindow.rule : '',
            craftNeedAvoid: needWindow && typeof needWindow.avoid === 'string' ? needWindow.avoid : '',
            craftNeedMandatoryResources: Array.isArray(mandatory.resources) ? mandatory.resources.slice() : [],
            craftNeedMandatoryBranches: Array.isArray(mandatory.branches) ? mandatory.branches.slice() : [],
            craftNeedRecommendedResources: Array.isArray(recommended.resources) ? recommended.resources.slice() : [],
            craftNeedRecommendedBranches: Array.isArray(recommended.branches) ? recommended.branches.slice() : [],
            craftNeedOptionalResources: Array.isArray(optional.resources) ? optional.resources.slice() : [],
            craftNeedOptionalBranches: Array.isArray(optional.branches) ? optional.branches.slice() : []
        };
    }

    function appendUniqueStringList(list = [], additions = []) {
        const target = Array.isArray(list) ? list : [];
        const seen = new Set(
            target
                .filter((entry) => typeof entry === 'string' && entry.trim())
                .map((entry) => entry.trim())
        );

        additions.forEach((entry) => {
            if (typeof entry !== 'string' || !entry.trim()) {
                return;
            }

            const normalizedEntry = entry.trim();
            if (seen.has(normalizedEntry)) {
                return;
            }

            seen.add(normalizedEntry);
            target.push(normalizedEntry);
        });

        return target;
    }

    function getCrossingPressureLevel(islandIndex) {
        if (islandIndex >= 25) {
            return 3;
        }

        if (islandIndex >= 13) {
            return 2;
        }

        return 1;
    }

    function getDepletedSurvivalPressureLevel(islandIndex) {
        if (islandIndex >= 28) {
            return 3;
        }

        if (islandIndex >= 19) {
            return 2;
        }

        return 1;
    }

    function getTradeEconomyPressureLevel(islandIndex) {
        if (islandIndex >= 25) {
            return 3;
        }

        if (islandIndex >= 19) {
            return 2;
        }

        if (islandIndex >= 10) {
            return 1;
        }

        return 0;
    }

    function applyCrossingIslandCraftPressure(craftNeedSnapshot, islandIndex) {
        if (!craftNeedSnapshot || typeof craftNeedSnapshot !== 'object') {
            return {
                crossingPressureLevel: 0,
                requiresBridgeKit: false,
                mandatoryBridgeKitCount: 0
            };
        }

        const crossingPressureLevel = getCrossingPressureLevel(islandIndex);
        appendUniqueStringList(craftNeedSnapshot.craftNeedMandatoryResources, ['raw_wood']);
        appendUniqueStringList(craftNeedSnapshot.craftNeedMandatoryBranches, ['first_bridge']);

        if (crossingPressureLevel >= 2) {
            appendUniqueStringList(craftNeedSnapshot.craftNeedMandatoryResources, ['raw_rubble']);
            appendUniqueStringList(craftNeedSnapshot.craftNeedMandatoryBranches, ['bridge_repair']);
            appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedBranches, ['repair_support']);
        } else {
            appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedResources, ['raw_stone']);
            appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedBranches, ['bridge_repair']);
        }

        if (crossingPressureLevel >= 3) {
            appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedResources, ['water', 'raw_fish']);
            appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedBranches, ['endgame_route']);
        }

        craftNeedSnapshot.craftNeedFocus = craftNeedSnapshot.craftNeedFocus
            ? `${craftNeedSnapshot.craftNeedFocus}, но с заранее собранной переправой`
            : 'Переправы и готовый мост-комплект';
        craftNeedSnapshot.craftNeedRule = craftNeedSnapshot.craftNeedRule
            ? `${craftNeedSnapshot.craftNeedRule} На этот остров лучше входить уже с мост-комплектом.`
            : 'На этот остров лучше входить уже с мост-комплектом.';
        craftNeedSnapshot.craftNeedAvoid = craftNeedSnapshot.craftNeedAvoid
            ? `${craftNeedSnapshot.craftNeedAvoid} Не рассчитывай, что пролом можно обойти без мостового предмета.`
            : 'Не рассчитывай, что пролом можно обойти без мостового предмета.';

        return {
            crossingPressureLevel,
            requiresBridgeKit: true,
            mandatoryBridgeKitCount: 1
        };
    }

    function applyDepletedIslandCraftPressure(craftNeedSnapshot, islandIndex) {
        if (!craftNeedSnapshot || typeof craftNeedSnapshot !== 'object') {
            return {
                depletedSurvivalPressureLevel: 0,
                requiresCraftedSurvival: false,
                foodLootScarcity: false
            };
        }

        const depletedSurvivalPressureLevel = getDepletedSurvivalPressureLevel(islandIndex);
        appendUniqueStringList(craftNeedSnapshot.craftNeedMandatoryResources, ['water', 'raw_grass']);
        appendUniqueStringList(craftNeedSnapshot.craftNeedMandatoryBranches, ['cheap_healing', 'survival_food']);
        appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedResources, ['raw_wood']);
        appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedBranches, ['water_cycle', 'fuel_prep']);

        if (islandIndex >= 6) {
            appendUniqueStringList(craftNeedSnapshot.craftNeedMandatoryResources, ['raw_fish']);
            appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedBranches, ['fish_processing']);
        }

        if (depletedSurvivalPressureLevel >= 2) {
            appendUniqueStringList(craftNeedSnapshot.craftNeedMandatoryBranches, ['strong_survival']);
            appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedBranches, ['repair_support']);
        }

        if (depletedSurvivalPressureLevel >= 3) {
            appendUniqueStringList(craftNeedSnapshot.craftNeedMandatoryBranches, ['final_survival']);
            appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedBranches, ['water_escape']);
        }

        craftNeedSnapshot.craftNeedFocus = craftNeedSnapshot.craftNeedFocus
            ? `${craftNeedSnapshot.craftNeedFocus}, но без лёгкой обычной еды`
            : 'Выживание через сбор и полевой крафт';
        craftNeedSnapshot.craftNeedRule = craftNeedSnapshot.craftNeedRule
            ? `${craftNeedSnapshot.craftNeedRule} Здесь лучше рассчитывать на воду, улов и собственные survival-рецепты.`
            : 'Здесь лучше рассчитывать на воду, улов и собственные survival-рецепты.';
        craftNeedSnapshot.craftNeedAvoid = craftNeedSnapshot.craftNeedAvoid
            ? `${craftNeedSnapshot.craftNeedAvoid} Не строй маршрут на паёке из случайного сундука.`
            : 'Не строй маршрут на паёке из случайного сундука.';

        return {
            depletedSurvivalPressureLevel,
            requiresCraftedSurvival: true,
            foodLootScarcity: true
        };
    }

    function applyTradeIslandCraftPressure(craftNeedSnapshot, islandIndex) {
        if (!craftNeedSnapshot || typeof craftNeedSnapshot !== 'object') {
            return {
                tradeEconomyPressureLevel: 0,
                prefersCraftedValuables: false,
                tradeCraftBias: false
            };
        }

        const tradeEconomyPressureLevel = getTradeEconomyPressureLevel(islandIndex);
        if (tradeEconomyPressureLevel <= 0) {
            return {
                tradeEconomyPressureLevel: 0,
                prefersCraftedValuables: false,
                tradeCraftBias: false
            };
        }

        appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedResources, ['raw_wood', 'paper']);
        appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedBranches, ['route_info', 'trade_values']);
        appendUniqueStringList(craftNeedSnapshot.craftNeedOptionalResources, ['valuables']);

        if (tradeEconomyPressureLevel >= 2) {
            appendUniqueStringList(craftNeedSnapshot.craftNeedMandatoryBranches, ['trade_values']);
            appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedResources, ['raw_stone', 'valuables']);
            appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedBranches, ['collector_loadout']);
        }

        if (tradeEconomyPressureLevel >= 3) {
            appendUniqueStringList(craftNeedSnapshot.craftNeedRecommendedBranches, ['endgame_route']);
            appendUniqueStringList(craftNeedSnapshot.craftNeedOptionalBranches, ['collector_loadout']);
        }

        craftNeedSnapshot.craftNeedFocus = craftNeedSnapshot.craftNeedFocus
            ? `${craftNeedSnapshot.craftNeedFocus}, но с упором на крафтовую ценность`
            : 'Ремесленная экономика и крафтовые ценности';
        craftNeedSnapshot.craftNeedRule = craftNeedSnapshot.craftNeedRule
            ? `${craftNeedSnapshot.craftNeedRule} Здесь выгоднее переводить заготовки в бумаги, печати и маршрутные вещи, чем просто тащить случайный дорогой лут.`
            : 'Здесь выгоднее переводить заготовки в бумаги, печати и маршрутные вещи, чем просто тащить случайный дорогой лут.';
        craftNeedSnapshot.craftNeedAvoid = craftNeedSnapshot.craftNeedAvoid
            ? `${craftNeedSnapshot.craftNeedAvoid} Не забивай сумку прямым блестящим лутом, если его можно заменить более выгодной сборкой у станка.`
            : 'Не забивай сумку прямым блестящим лутом, если его можно заменить более выгодной сборкой у станка.';

        return {
            tradeEconomyPressureLevel,
            prefersCraftedValuables: true,
            tradeCraftBias: true
        };
    }

    function createBaseResourceNodeDensityProfile(islandIndex, archetype, scenario) {
        return {
            islandIndex,
            archetype,
            scenario,
            profileId: 'baseline',
            label: 'Базовая ресурсная плотность',
            sources: [],
            supplyTagBonuses: {
                supplyWater: 0,
                supplyFishing: 0,
                supplyWood: 0,
                supplyRubble: 0
            },
            resourceNodeSpawnBonuses: {
                grassBush: 0,
                waterSource: 0,
                reedPatch: 0,
                stonePile: 0,
                rubbleScree: 0,
                woodTree: 0,
                fishingSpot: 0,
                fishingReedsSpot: 0,
                fishingCalmSpot: 0,
                fishingRareSpot: 0
            },
            fishingSpotCapBonus: 0
        };
    }

    function mergeResourceNodeDensityAdjustment(profile, sourceId, label, adjustment = {}) {
        if (!profile || !adjustment || typeof adjustment !== 'object') {
            return profile;
        }

        if (typeof sourceId === 'string' && sourceId.trim()) {
            profile.sources.push(sourceId.trim());
        }

        if (typeof label === 'string' && label.trim()) {
            profile.label = profile.profileId === 'baseline'
                ? label.trim()
                : `${profile.label} + ${label.trim()}`;
        }

        const supplyTagBonuses = adjustment.supplyTagBonuses && typeof adjustment.supplyTagBonuses === 'object'
            ? adjustment.supplyTagBonuses
            : {};
        Object.keys(profile.supplyTagBonuses).forEach((key) => {
            if (Number.isFinite(supplyTagBonuses[key])) {
                profile.supplyTagBonuses[key] += Math.floor(supplyTagBonuses[key]);
            }
        });

        const resourceNodeSpawnBonuses = adjustment.resourceNodeSpawnBonuses && typeof adjustment.resourceNodeSpawnBonuses === 'object'
            ? adjustment.resourceNodeSpawnBonuses
            : {};
        Object.keys(profile.resourceNodeSpawnBonuses).forEach((key) => {
            if (Number.isFinite(resourceNodeSpawnBonuses[key])) {
                profile.resourceNodeSpawnBonuses[key] += Math.floor(resourceNodeSpawnBonuses[key]);
            }
        });

        if (Number.isFinite(adjustment.fishingSpotCapBonus)) {
            profile.fishingSpotCapBonus += Math.floor(adjustment.fishingSpotCapBonus);
        }

        return profile;
    }

    function buildResourceNodeDensityProfile(progressionRecordOrOptions = {}) {
        const islandIndex = Number.isFinite(progressionRecordOrOptions && progressionRecordOrOptions.islandIndex)
            ? Math.max(1, Math.floor(progressionRecordOrOptions.islandIndex))
            : 1;
        const archetype = typeof progressionRecordOrOptions.archetype === 'string' && progressionRecordOrOptions.archetype.trim()
            ? progressionRecordOrOptions.archetype.trim()
            : 'normal';
        const scenario = typeof progressionRecordOrOptions.scenario === 'string' && progressionRecordOrOptions.scenario.trim()
            ? progressionRecordOrOptions.scenario.trim()
            : 'normal';
        const profile = createBaseResourceNodeDensityProfile(islandIndex, archetype, scenario);

        if (scenario === 'tradeIsland') {
            mergeResourceNodeDensityAdjustment(profile, 'tradeIsland', 'Торговое снабжение', {
                supplyTagBonuses: {
                    supplyWater: 1,
                    supplyWood: islandIndex >= 10 ? 1 : 0
                },
                resourceNodeSpawnBonuses: {
                    waterSource: 1,
                    reedPatch: 1,
                    woodTree: islandIndex >= 10 ? 1 : 0,
                    stonePile: islandIndex >= 19 ? 1 : 0
                }
            });
        } else if (scenario === 'trapIsland') {
            mergeResourceNodeDensityAdjustment(profile, 'trapIsland', 'Ловушки и осыпи', {
                supplyTagBonuses: {
                    supplyRubble: 1
                },
                resourceNodeSpawnBonuses: {
                    stonePile: 1,
                    rubbleScree: 1
                }
            });
        } else if (scenario === 'jackpotIsland') {
            mergeResourceNodeDensityAdjustment(profile, 'jackpotIsland', 'Редкие водные шансы', {
                supplyTagBonuses: {
                    supplyFishing: islandIndex >= 6 ? 1 : 0
                },
                resourceNodeSpawnBonuses: {
                    fishingCalmSpot: 1,
                    fishingRareSpot: 1
                },
                fishingSpotCapBonus: 1
            });
        } else if (scenario === 'noHouseIsland') {
            mergeResourceNodeDensityAdjustment(profile, 'noHouseIsland', 'Натуральные точки снабжения', {
                supplyTagBonuses: {
                    supplyWater: 1,
                    supplyWood: 1,
                    supplyFishing: islandIndex >= 6 ? 1 : 0
                },
                resourceNodeSpawnBonuses: {
                    waterSource: 1,
                    woodTree: 1,
                    fishingSpot: islandIndex >= 6 ? 1 : 0,
                    fishingReedsSpot: islandIndex >= 6 ? 1 : 0,
                    fishingCalmSpot: islandIndex >= 6 ? 1 : 0
                },
                fishingSpotCapBonus: islandIndex >= 6 ? 1 : 0
            });
        } else if (scenario === 'crossingIsland') {
            mergeResourceNodeDensityAdjustment(profile, 'crossingIsland', 'Переправы и стройматериалы', {
                supplyTagBonuses: {
                    supplyWood: 1,
                    supplyRubble: islandIndex >= 7 ? 1 : 0
                },
                resourceNodeSpawnBonuses: {
                    woodTree: 1,
                    stonePile: islandIndex <= 6 ? 1 : 0,
                    rubbleScree: islandIndex >= 7 ? 1 : 0
                }
            });
        } else if (scenario === 'depletedIsland') {
            mergeResourceNodeDensityAdjustment(profile, 'depletedIsland', 'Выживание через сбор', {
                supplyTagBonuses: {
                    supplyWater: 1,
                    supplyWood: 1,
                    supplyFishing: islandIndex >= 6 ? 1 : 0
                },
                resourceNodeSpawnBonuses: {
                    grassBush: 2,
                    reedPatch: 1,
                    waterSource: 1,
                    woodTree: 1,
                    fishingSpot: islandIndex >= 6 ? 1 : 0,
                    fishingReedsSpot: islandIndex >= 6 ? 1 : 0
                },
                fishingSpotCapBonus: islandIndex >= 6 ? 1 : 0
            });
        }

        if (archetype === 'greedy') {
            mergeResourceNodeDensityAdjustment(profile, 'greedy', 'Жадный минеральный перекос', {
                supplyTagBonuses: {
                    supplyRubble: 1
                },
                resourceNodeSpawnBonuses: {
                    stonePile: 1,
                    rubbleScree: 1
                }
            });
        } else if (archetype === 'emptyGiant') {
            mergeResourceNodeDensityAdjustment(profile, 'emptyGiant', 'Большой остров снабжения', {
                supplyTagBonuses: {
                    supplyWater: 1,
                    supplyWood: 1
                },
                resourceNodeSpawnBonuses: {
                    waterSource: 1,
                    woodTree: 1
                }
            });
        } else if (archetype === 'golden') {
            mergeResourceNodeDensityAdjustment(profile, 'golden', 'Богатые прибрежные узлы', {
                supplyTagBonuses: {
                    supplyFishing: islandIndex >= 6 ? 1 : 0
                },
                resourceNodeSpawnBonuses: {
                    waterSource: 1,
                    fishingRareSpot: islandIndex >= 10 ? 1 : 0
                },
                fishingSpotCapBonus: islandIndex >= 10 ? 1 : 0
            });
        } else if (archetype === 'finalVault') {
            mergeResourceNodeDensityAdjustment(profile, 'finalVault', 'Финальное снабжение', {
                supplyTagBonuses: {
                    supplyWater: 1,
                    supplyWood: 1,
                    supplyFishing: islandIndex >= 6 ? 1 : 0,
                    supplyRubble: islandIndex >= 7 ? 1 : 0
                },
                resourceNodeSpawnBonuses: {
                    waterSource: 1,
                    woodTree: 1,
                    rubbleScree: islandIndex >= 7 ? 1 : 0,
                    fishingCalmSpot: islandIndex >= 6 ? 1 : 0,
                    fishingRareSpot: islandIndex >= 10 ? 1 : 0
                },
                fishingSpotCapBonus: islandIndex >= 10 ? 1 : 0
            });
        }

        profile.profileId = profile.sources.length > 0
            ? profile.sources.join('+')
            : profile.profileId;
        return profile;
    }

    function pickWeightedKey(weightMap, random, fallbackKey = 'fishing') {
        const entries = Object.entries(weightMap)
            .filter(([, weight]) => Number.isFinite(weight) && weight > 0);
        const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);

        if (entries.length === 0 || totalWeight <= 0) {
            return fallbackKey;
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

    function getSettlementStage(islandIndex, isFinalIsland = false) {
        if (isFinalIsland || islandIndex >= finalIslandIndex) {
            return 'final';
        }

        if (islandIndex >= 21) {
            return 'village';
        }

        if (islandIndex >= 18) {
            return 'protoVillage';
        }

        if (islandIndex >= 13) {
            return 'hamlet';
        }

        if (islandIndex >= 8) {
            return 'outpost';
        }

        return 'wild';
    }

    function chooseSettlementType(islandIndex, random, archetype, scenario) {
        if (islandIndex < 18 || islandIndex >= finalIslandIndex) {
            return null;
        }

        const weights = {
            fishing: 2.6,
            trade: 2.2,
            craft: 2.1,
            rich: islandIndex >= 21 ? 1.9 : 1.35,
            ruined: islandIndex >= 21 ? 1.7 : 1.2
        };

        if (scenario === 'tradeIsland') {
            weights.trade += 3.6;
            weights.rich += 1.4;
        } else if (scenario === 'crossingIsland') {
            weights.craft += 2.8;
            weights.ruined += 1.6;
            weights.fishing += 0.4;
        } else if (scenario === 'depletedIsland') {
            weights.fishing += 2.5;
            weights.ruined += 2.1;
            weights.trade = Math.max(0.4, weights.trade - 0.9);
            weights.rich = Math.max(0.25, weights.rich - 0.85);
        } else if (scenario === 'trapIsland') {
            weights.ruined += 3.2;
        } else if (scenario === 'jackpotIsland') {
            weights.rich += 3;
            weights.trade += 1.2;
        } else if (scenario === 'noHouseIsland') {
            weights.ruined += 4.5;
        }

        if (archetype === 'golden') {
            weights.rich += 3.5;
        } else if (archetype === 'greedy') {
            weights.trade += 1.8;
            weights.ruined += 1.2;
        } else if (archetype === 'emptyGiant') {
            weights.fishing += 0.8;
            weights.ruined += 2.4;
        }

        if (islandIndex >= 23) {
            weights.rich += 0.8;
            weights.trade += 0.7;
            weights.craft += 0.5;
            weights.ruined += 0.7;
        }

        return pickWeightedKey(weights, random, 'fishing');
    }

    function chooseArchetype(islandIndex, random) {
        if (islandIndex >= finalIslandIndex) {
            return 'finalVault';
        }

        const roll = random();

        if (islandIndex >= 14 && roll < 0.06) {
            return 'golden';
        }

        if (islandIndex >= 9 && roll < 0.18) {
            return 'greedy';
        }

        if (islandIndex >= 8 && roll < 0.28) {
            return 'emptyGiant';
        }

        return 'normal';
    }

    function chooseScenario(islandIndex, random, archetype) {
        if (islandIndex >= finalIslandIndex || archetype === 'finalVault') {
            return 'normal';
        }

        if (islandIndex === 3 || islandIndex === 19 || islandIndex === 28) {
            return 'depletedIsland';
        }

        if (islandIndex === 5 || islandIndex === 14 || islandIndex === 26) {
            return 'crossingIsland';
        }

        if (islandIndex >= 10 && islandIndex % 10 === 0) {
            return 'jackpotIsland';
        }

        if (islandIndex >= 8 && islandIndex % 8 === 0) {
            return 'noHouseIsland';
        }

        if (islandIndex >= 6 && islandIndex % 6 === 0) {
            return 'trapIsland';
        }

        if (islandIndex >= 5 && islandIndex % 5 === 0) {
            return 'tradeIsland';
        }

        const roll = random();

        if (islandIndex >= 12 && roll < 0.05) {
            return 'jackpotIsland';
        }

        if (islandIndex >= 8 && roll < 0.11) {
            return 'noHouseIsland';
        }

        if (islandIndex >= 6 && roll < 0.2) {
            return 'trapIsland';
        }

        if (islandIndex >= 4 && roll < 0.28) {
            return 'tradeIsland';
        }

        return 'normal';
    }

    function chooseContourKind(islandIndex, random) {
        const kinds = islandIndex < 3
            ? ['elongated', 'lShaped']
            : (islandIndex < 6
                ? ['elongated', 'lShaped', 'neck']
                : ['elongated', 'lShaped', 'neck', 'peninsula', 'forked']);

        return kinds[Math.floor(random() * kinds.length)];
    }

    function chooseRouteStyle(islandIndex, contourKind, random) {
        const styles = ['center', 'arc'];

        if (islandIndex >= 3) {
            styles.push('bottleneck');
        }

        if (islandIndex >= 5) {
            styles.push('outerRing');
        }

        if (contourKind === 'forked' || contourKind === 'peninsula' || islandIndex >= 4) {
            styles.push('branching');
        }

        return styles[Math.floor(random() * styles.length)];
    }

    function getAdjacencyPlacementMetrics(previousIsland, adjacencyPairs) {
        const distinctPreviousKeys = new Set();
        let entryTouchCount = 0;
        let deepTouchCount = 0;
        let maxDepth = 0;
        let depthSum = 0;

        adjacencyPairs.forEach((pair) => {
            if (distinctPreviousKeys.has(pair.previousChunkKey)) {
                return;
            }

            distinctPreviousKeys.add(pair.previousChunkKey);
            const previousChunk = previousIsland.chunkMap.get(pair.previousChunkKey);
            const depth = previousChunk ? previousChunk.distanceFromEntry : 0;

            maxDepth = Math.max(maxDepth, depth);
            depthSum += depth;

            if (previousChunk && previousChunk.tags.has('entry')) {
                entryTouchCount++;
            }

            if (depth > 0) {
                deepTouchCount++;
            }
        });

        const distinctCount = distinctPreviousKeys.size;

        return {
            distinctCount,
            entryTouchCount,
            deepTouchCount,
            maxDepth,
            averageDepth: distinctCount > 0 ? depthSum / distinctCount : 0
        };
    }

    function getPlacementCandidates(previousIsland, relativeChunks, occupiedKeys, random) {
        const layoutPlan = getWorldLayoutPlan();
        const directionPriority = layoutPlan.directionPriority;
        const candidates = [];

        directionPriority.forEach((preferredDirection, directionIndex) => {
            const previousBoundary = shapes.getAbsoluteBoundaryChunks(previousIsland, preferredDirection);
            const nextBoundary = shapes.getRelativeBoundaryChunks(
                relativeChunks,
                directionByName[preferredDirection].opposite
            );

            previousBoundary.forEach((previousChunk) => {
                nextBoundary.forEach((nextChunk) => {
                    const offsetX = previousChunk.chunkX + directionByName[preferredDirection].dx - nextChunk.relX;
                    const offsetY = previousChunk.chunkY + directionByName[preferredDirection].dy - nextChunk.relY;
                    const translated = shapes.buildTranslatedChunks(relativeChunks, offsetX, offsetY);
                    const overlaps = translated.some((chunk) => occupiedKeys.has(chunkKey(chunk.chunkX, chunk.chunkY)));

                    if (overlaps) {
                        return;
                    }

                    const adjacencyPairs = shapes.collectAdjacencyPairs(previousIsland, translated);

                    if (adjacencyPairs.length === 0) {
                        return;
                    }

                    const placementMetrics = getAdjacencyPlacementMetrics(previousIsland, adjacencyPairs);
                    const forwardProgress = shapes.getForwardProgress(translated, layoutPlan.primaryDirection);
                    const lateralSpread = shapes.getLateralSpread(translated, layoutPlan.primaryDirection);
                    const translatedCenterAxis = translated.reduce((sum, chunk) => {
                        return sum + shapes.getChunkAxisValue(chunk, preferredDirection);
                    }, 0) / translated.length;
                    const directionAxisValue = shapes.getChunkAxisValue(previousChunk, preferredDirection);
                    const alignmentPenalty = Math.abs(translatedCenterAxis - directionAxisValue) * 0.08;
                    const directionBonus = preferredDirection === layoutPlan.primaryDirection
                        ? 1.35
                        : (preferredDirection === layoutPlan.sideA ? 0.75 : 0.62 - directionIndex * 0.05);
                    const depthBonus = placementMetrics.maxDepth * 8 + placementMetrics.averageDepth * 4.5;
                    const deepTouchBonus = placementMetrics.deepTouchCount * 6;
                    const entryPenalty = placementMetrics.entryTouchCount * 5;
                    const score = (
                        adjacencyPairs.length * 12
                        + forwardProgress * 0.4
                        + lateralSpread * 0.42
                        + depthBonus
                        + deepTouchBonus
                        - entryPenalty
                        - alignmentPenalty
                        + directionBonus
                        + random() * 0.35
                    );

                    candidates.push({
                        translated,
                        adjacencyPairs,
                        preferredDirection,
                        score
                    });
                });
            });
        });

        if (candidates.length === 0) {
            return [];
        }

        const desiredAdjacency = relativeChunks.length >= 8 ? 3 : (relativeChunks.length >= 3 ? 2 : 1);
        const preferredCandidates = candidates.filter((candidate) => candidate.adjacencyPairs.length >= desiredAdjacency);
        const pool = preferredCandidates.length > 0 ? preferredCandidates : candidates;

        pool.sort((left, right) => {
            if (right.adjacencyPairs.length !== left.adjacencyPairs.length) {
                return right.adjacencyPairs.length - left.adjacencyPairs.length;
            }

            return right.score - left.score;
        });

        return pool;
    }

    function buildIslandProgression(islandIndex, contourKind, random, chunkCount) {
        const archetype = chooseArchetype(islandIndex, random);
        const archetypeDefinition = getArchetypeDefinition(archetype);
        const scenario = chooseScenario(islandIndex, random, archetype);
        const scenarioDefinition = getScenarioDefinition(scenario);
        const resourceNodeDensityProfile = buildResourceNodeDensityProfile({
            islandIndex,
            archetype,
            scenario
        });
        const isFinalIsland = islandIndex >= finalIslandIndex;
        const settlementStage = getSettlementStage(islandIndex, isFinalIsland);
        const settlementType = chooseSettlementType(islandIndex, random, archetype, scenario);
        const settlementDefinition = getSettlementDefinition(settlementType);
        const routeStyle = scenario === 'crossingIsland'
            ? 'bottleneck'
            : chooseRouteStyle(islandIndex, contourKind, random);
        const craftNeedSnapshot = createCraftNeedSnapshot(islandIndex);
        const crossingBridgePressure = scenario === 'crossingIsland'
            ? applyCrossingIslandCraftPressure(craftNeedSnapshot, islandIndex)
            : {
                crossingPressureLevel: 0,
                requiresBridgeKit: false,
                mandatoryBridgeKitCount: 0
            };
        const tradeEconomyPressure = scenario === 'tradeIsland'
            ? applyTradeIslandCraftPressure(craftNeedSnapshot, islandIndex)
            : {
                tradeEconomyPressureLevel: 0,
                prefersCraftedValuables: false,
                tradeCraftBias: false
            };
        const depletedSurvivalPressure = scenario === 'depletedIsland'
            ? applyDepletedIslandCraftPressure(craftNeedSnapshot, islandIndex)
            : {
                depletedSurvivalPressureLevel: 0,
                requiresCraftedSurvival: false,
                foodLootScarcity: false
            };
        const distanceFactor = Math.max(0, islandIndex - 1);
        let drainMultiplier = clamp(1 + distanceFactor * 0.1, 1, 3.9);
        const recoveryMultiplier = clamp(1 - (islandIndex - 1) * 0.012, 0.55, 1);
        let baseHouses = islandIndex <= 1 ? 0 : (islandIndex <= 3 ? 1 : (islandIndex <= 10 ? 2 : 3));
        let islandHouseBudget = islandIndex <= 1 ? 0 : (islandIndex === 2 ? 1 : 3);

        if (settlementStage === 'outpost') {
            baseHouses += 1;
            islandHouseBudget += 1;
        } else if (settlementStage === 'hamlet') {
            baseHouses += 1;
            islandHouseBudget += 2 + Math.floor(chunkCount / 5);
        } else if (settlementStage === 'protoVillage') {
            baseHouses += 2;
            islandHouseBudget += 4 + Math.floor(chunkCount / 4);
        } else if (settlementStage === 'village') {
            baseHouses += 2;
            islandHouseBudget += 5 + Math.floor(chunkCount / 3);
        }

        if (scenario === 'tradeIsland') {
            baseHouses += 1;
            islandHouseBudget += 2;
            if (tradeEconomyPressure.tradeEconomyPressureLevel >= 2) {
                drainMultiplier = clamp(drainMultiplier + 0.04, 1, 4.05);
            }
        } else if (scenario === 'crossingIsland') {
            drainMultiplier = clamp(drainMultiplier + 0.1 + crossingBridgePressure.crossingPressureLevel * 0.03, 1, 4.1);
        } else if (scenario === 'depletedIsland') {
            drainMultiplier = clamp(drainMultiplier + 0.08 + depletedSurvivalPressure.depletedSurvivalPressureLevel * 0.03, 1, 4.15);
            islandHouseBudget = Math.max(1, islandHouseBudget - 1);
        } else if (scenario === 'jackpotIsland') {
            baseHouses += 1;
            islandHouseBudget += 1;
        } else if (scenario === 'trapIsland') {
            drainMultiplier = clamp(drainMultiplier + 0.12, 1, 4.1);
        } else if (scenario === 'noHouseIsland') {
            baseHouses = 0;
            islandHouseBudget = 0;
        }

        if (settlementType === 'trade') {
            islandHouseBudget += 2;
        } else if (settlementType === 'craft') {
            islandHouseBudget += 1;
        } else if (settlementType === 'rich') {
            islandHouseBudget += 1;
            drainMultiplier = clamp(drainMultiplier + 0.08, 1, 4.15);
        } else if (settlementType === 'ruined') {
            islandHouseBudget = Math.max(1, islandHouseBudget - 1);
            drainMultiplier = clamp(drainMultiplier + 0.1, 1, 4.2);
        }

        const baseLabel = scenario === 'normal'
            ? archetypeDefinition.label
            : scenarioDefinition.label;
        const baseSummary = scenario === 'normal'
            ? archetypeDefinition.summary
            : `${scenarioDefinition.summary} Базовый архетип: ${archetypeDefinition.label.toLowerCase()}.`;
        const label = settlementDefinition ? settlementDefinition.label : baseLabel;
        const summary = settlementDefinition
            ? `${settlementDefinition.summary} ${baseSummary}`
            : baseSummary;

        return {
            islandIndex,
            contourKind,
            routeStyle,
            chunkCount,
            archetype,
            scenario,
            scenarioLabel: scenarioDefinition.label,
            scenarioSummary: scenarioDefinition.summary,
            settlementStage,
            settlementType,
            settlementLabel: settlementDefinition ? settlementDefinition.label : '',
            settlementSummary: settlementDefinition ? settlementDefinition.summary : '',
            label,
            summary,
            movementCostMultiplier: drainMultiplier,
            outsideDrainMultiplier: drainMultiplier,
            recoveryMultiplier,
            rockCountMin: islandIndex <= 1 ? 0 : clamp(1 + Math.floor(islandIndex / 3), 1, 9),
            rockCountMax: islandIndex <= 1 ? 0 : clamp(3 + Math.floor(islandIndex / 2), 3, 14),
            housesPerChunkMin: baseHouses === 0 ? 0 : (baseHouses - 1),
            housesPerChunkMax: clamp(
                baseHouses
                    + (islandIndex >= 12 ? 1 : 0)
                    + (settlementStage === 'protoVillage' ? 1 : 0)
                    + (settlementStage === 'village' ? 1 : 0),
                0,
                6
            ),
            islandHouseBudget,
            grassTone: clamp(0.06 + islandIndex * 0.011, 0.06, 0.28),
            isFinalIsland,
            resourceNodeDensityProfile,
            crossingPressureLevel: crossingBridgePressure.crossingPressureLevel,
            requiresBridgeKit: crossingBridgePressure.requiresBridgeKit,
            mandatoryBridgeKitCount: crossingBridgePressure.mandatoryBridgeKitCount,
            tradeEconomyPressureLevel: tradeEconomyPressure.tradeEconomyPressureLevel,
            prefersCraftedValuables: tradeEconomyPressure.prefersCraftedValuables,
            tradeCraftBias: tradeEconomyPressure.tradeCraftBias,
            depletedSurvivalPressureLevel: depletedSurvivalPressure.depletedSurvivalPressureLevel,
            requiresCraftedSurvival: depletedSurvivalPressure.requiresCraftedSurvival,
            foodLootScarcity: depletedSurvivalPressure.foodLootScarcity,
            ...craftNeedSnapshot
        };
    }

    function createAbsoluteIslandRecord(islandIndex, progression, contourKind, translatedChunks) {
        const island = {
            islandIndex,
            contourKind,
            progression,
            chunks: [],
            chunkMap: new Map(),
            entryChunkKeys: new Set(),
            exitChunkKeys: new Set()
        };

        translatedChunks.forEach((translated) => {
            const record = {
                islandIndex,
                chunkX: translated.chunkX,
                chunkY: translated.chunkY,
                tags: new Set(translated.tags),
                internalDirections: new Set(),
                bridgeDirections: new Set(),
                distanceFromEntry: 0,
                houseQuota: 0,
                houseProfiles: []
            };
            const key = chunkKey(record.chunkX, record.chunkY);

            island.chunks.push(record);
            island.chunkMap.set(key, record);
        });

        island.chunks.forEach((chunk) => {
            DIRECTIONS.forEach((direction) => {
                if (island.chunkMap.has(chunkKey(chunk.chunkX + direction.dx, chunk.chunkY + direction.dy))) {
                    chunk.internalDirections.add(direction.name);
                }
            });
        });

        return island;
    }

    function chooseBridgePairs(islandIndex, adjacencyPairs, random, previousIsland = null, progression = null) {
        const uniquePairs = [];
        const seen = new Set();

        adjacencyPairs.forEach((pair) => {
            const key = `${pair.previousChunkKey}|${pair.nextChunkKey}|${pair.directionFromPrevious}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniquePairs.push(pair);
            }
        });

        if (uniquePairs.length === 0) {
            return [];
        }

        const annotatedPairs = uniquePairs.map((pair) => {
            const previousChunk = previousIsland ? previousIsland.chunkMap.get(pair.previousChunkKey) : null;
            const depth = previousChunk ? previousChunk.distanceFromEntry : 0;
            const isEntryChunk = previousChunk ? previousChunk.tags.has('entry') : false;
            const isRemote = previousChunk ? previousChunk.tags.has('remote') : false;
            const isTip = previousChunk ? previousChunk.tags.has('tip') : false;
            const isJunction = previousChunk ? previousChunk.tags.has('junction') : false;
            const isLeaf = previousChunk ? previousChunk.tags.has('leaf') : false;
            const score = (
                depth * 18
                + (isRemote ? 8 : 0)
                + (isTip ? 5 : 0)
                + (isJunction ? 4 : 0)
                + (isLeaf && depth > 0 ? 2 : 0)
                - (isEntryChunk && depth === 0 ? 16 : 0)
                + random() * 0.3
            );

            return {
                ...pair,
                previousChunk,
                depth,
                isEntryChunk,
                score
            };
        });

        const forwardPairs = annotatedPairs.filter((pair) => pair.depth > 0);
        const forwardChunkKeys = new Set(forwardPairs.map((pair) => pair.previousChunkKey));
        let targetCount = 1;

        if (islandIndex >= 6 && forwardChunkKeys.size > 1 && annotatedPairs.length > 1) {
            targetCount = 2;
        }

        if (islandIndex >= 10 && forwardChunkKeys.size > 2 && annotatedPairs.length > 2 && random() < 0.55) {
            targetCount = 3;
        }

        if (progression && progression.scenario === 'crossingIsland') {
            if (islandIndex >= 13 && annotatedPairs.length > 1) {
                targetCount = Math.max(targetCount, 2);
            }

            if (islandIndex >= 25 && annotatedPairs.length > 2) {
                targetCount = Math.max(targetCount, 3);
            }
        }

        const primaryPool = forwardPairs.length > 0 ? forwardPairs : annotatedPairs;
        const sorted = [...primaryPool].sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score;
            }

            const [leftX, leftY] = left.previousChunkKey.split(',').map(Number);
            const [rightX, rightY] = right.previousChunkKey.split(',').map(Number);
            return leftY - rightY || leftX - rightX;
        });

        const picks = [sorted[0]];
        const usedPreviousKeys = new Set([sorted[0].previousChunkKey]);

        while (picks.length < targetCount) {
            let bestCandidate = null;
            let bestDistance = -1;

            annotatedPairs.forEach((candidate) => {
                if (picks.includes(candidate)) {
                    return;
                }

                if (forwardPairs.length > 0 && candidate.depth === 0) {
                    return;
                }

                const [candidateX, candidateY] = candidate.previousChunkKey.split(',').map(Number);
                const distance = picks.reduce((minimum, pick) => {
                    const [pickX, pickY] = pick.previousChunkKey.split(',').map(Number);
                    const currentDistance = Math.abs(candidateX - pickX) + Math.abs(candidateY - pickY);
                    return minimum === null ? currentDistance : Math.min(minimum, currentDistance);
                }, null);
                const diversityBonus = usedPreviousKeys.has(candidate.previousChunkKey) ? -6 : 4;
                const weightedDistance = distance + candidate.score * 0.2 + diversityBonus;

                if (weightedDistance > bestDistance) {
                    bestDistance = weightedDistance;
                    bestCandidate = candidate;
                }
            });

            if (!bestCandidate) {
                break;
            }

            picks.push(bestCandidate);
            usedPreviousKeys.add(bestCandidate.previousChunkKey);
        }

        return picks.map((pair) => ({
            previousChunkKey: pair.previousChunkKey,
            nextChunkKey: pair.nextChunkKey,
            directionFromPrevious: pair.directionFromPrevious
        }));
    }

    function applyBridgePairs(previousIsland, nextIsland, bridgePairs) {
        bridgePairs.forEach((pair) => {
            const previousChunk = previousIsland.chunkMap.get(pair.previousChunkKey);
            const nextChunk = nextIsland.chunkMap.get(pair.nextChunkKey);
            const oppositeDirection = directionByName[pair.directionFromPrevious].opposite;

            if (!previousChunk || !nextChunk) {
                return;
            }

            previousChunk.bridgeDirections.add(pair.directionFromPrevious);
            nextChunk.bridgeDirections.add(oppositeDirection);
            previousChunk.tags.add('exit');
            nextChunk.tags.add('entry');
            previousIsland.exitChunkKeys.add(pair.previousChunkKey);
            nextIsland.entryChunkKeys.add(pair.nextChunkKey);
        });
    }

    function applyDynamicChunkTags(island) {
        island.chunks.forEach((chunk) => {
            const degree = chunk.internalDirections.size;

            if (degree <= 1) {
                chunk.tags.add('leaf');
            }

            if (degree >= 3) {
                chunk.tags.add('junction');
            }

            if (
                (chunk.internalDirections.has('east') && chunk.internalDirections.has('north'))
                || (chunk.internalDirections.has('east') && chunk.internalDirections.has('south'))
                || (chunk.internalDirections.has('west') && chunk.internalDirections.has('north'))
                || (chunk.internalDirections.has('west') && chunk.internalDirections.has('south'))
            ) {
                chunk.tags.add('corner');
            }
        });
    }

    function computeChunkDistances(island) {
        const queue = [];
        const visited = new Set();

        if (island.entryChunkKeys.size === 0 && island.chunks.length > 0) {
            island.entryChunkKeys.add(chunkKey(island.chunks[0].chunkX, island.chunks[0].chunkY));
            island.chunks[0].tags.add('entry');
        }

        island.entryChunkKeys.forEach((entryKey) => {
            const entryChunk = island.chunkMap.get(entryKey);
            if (entryChunk) {
                entryChunk.distanceFromEntry = 0;
                queue.push(entryChunk);
                visited.add(entryKey);
            }
        });

        while (queue.length > 0) {
            const current = queue.shift();
            current.internalDirections.forEach((directionName) => {
                const direction = directionByName[directionName];
                const neighborKey = chunkKey(current.chunkX + direction.dx, current.chunkY + direction.dy);
                const neighbor = island.chunkMap.get(neighborKey);

                if (!neighbor || visited.has(neighborKey)) {
                    return;
                }

                neighbor.distanceFromEntry = current.distanceFromEntry + 1;
                visited.add(neighborKey);
                queue.push(neighbor);
            });
        }

        const maxDistance = Math.max(...island.chunks.map((chunk) => chunk.distanceFromEntry));

        island.chunks.forEach((chunk) => {
            if (chunk.distanceFromEntry >= Math.max(2, Math.floor(maxDistance * 0.6))) {
                chunk.tags.add('remote');
            }

            if (chunk.tags.has('leaf') && chunk.distanceFromEntry >= Math.max(2, maxDistance - 1)) {
                chunk.tags.add('tip');
            }
        });
    }

    function scoreSupplyChunk(chunk, supplyKind) {
        if (!chunk) {
            return -Infinity;
        }

        const isEntry = chunk.tags.has('entry');
        const isRemote = chunk.tags.has('remote');
        const isTip = chunk.tags.has('tip');
        const isVault = chunk.tags.has('vault');
        const isCorner = chunk.tags.has('corner');
        const isJunction = chunk.tags.has('junction');
        const isLeaf = chunk.tags.has('leaf');
        const distance = Number.isFinite(chunk.distanceFromEntry) ? chunk.distanceFromEntry : 0;
        let score = distance * 1.4;

        switch (supplyKind) {
        case 'supplyWater':
            score += isEntry ? 8 : 0;
            score += isJunction ? 4 : 0;
            score += isCorner ? 1.5 : 0;
            score -= isRemote ? 3.5 : 0;
            score -= isVault ? 4 : 0;
            break;
        case 'supplyFishing':
            score += isTip ? 6 : 0;
            score += isRemote ? 5 : 0;
            score += isLeaf ? 2 : 0;
            score += isCorner ? 1 : 0;
            score -= isEntry ? 3 : 0;
            break;
        case 'supplyWood':
            score += isLeaf ? 3 : 0;
            score += isCorner ? 2 : 0;
            score += isRemote ? 1.5 : 0;
            score += isEntry ? 1 : 0;
            score -= isVault ? 2.5 : 0;
            break;
        case 'supplyRubble':
            score += isRemote ? 5 : 0;
            score += isTip ? 4 : 0;
            score += isLeaf ? 2 : 0;
            score += isVault ? 1.5 : 0;
            score -= isEntry ? 4 : 0;
            break;
        default:
            break;
        }

        return score;
    }

    function pickSupplyChunks(island, supplyKind, count) {
        const normalizedCount = Math.max(0, Math.floor(count || 0));
        if (!island || normalizedCount <= 0) {
            return [];
        }

        return island.chunks
            .filter((chunk) => chunk && !chunk.tags.has('vault'))
            .sort((left, right) => scoreSupplyChunk(right, supplyKind) - scoreSupplyChunk(left, supplyKind))
            .slice(0, normalizedCount);
    }

    function assignSupplyChunkTags(island) {
        if (!island || !island.progression) {
            return;
        }

        const densityProfile = island.progression.resourceNodeDensityProfile && typeof island.progression.resourceNodeDensityProfile === 'object'
            ? island.progression.resourceNodeDensityProfile
            : buildResourceNodeDensityProfile(island.progression);
        const supplyTagBonuses = densityProfile && densityProfile.supplyTagBonuses && typeof densityProfile.supplyTagBonuses === 'object'
            ? densityProfile.supplyTagBonuses
            : {};
        const mandatoryResources = new Set(Array.isArray(island.progression.craftNeedMandatoryResources)
            ? island.progression.craftNeedMandatoryResources
            : []);
        const recommendedResources = new Set(Array.isArray(island.progression.craftNeedRecommendedResources)
            ? island.progression.craftNeedRecommendedResources
            : []);
        const phaseId = island.progression.craftRequirementPhaseId || '';
        const waterCount = mandatoryResources.has('water')
            ? 1
            : (recommendedResources.has('water') ? 1 : 0);
        const fishingCount = mandatoryResources.has('raw_fish')
            ? (phaseId === 'advanced' ? 2 : 1)
            : (recommendedResources.has('raw_fish') ? 1 : 0);
        const woodCount = mandatoryResources.has('raw_wood')
            ? (phaseId === 'bridge' || phaseId === 'advanced' ? 2 : 1)
            : (recommendedResources.has('raw_wood') ? 1 : 0);
        const rubbleCount = mandatoryResources.has('raw_rubble')
            ? 1
            : (recommendedResources.has('raw_rubble') ? 1 : 0);
        const capSupplyCount = (count, maxCount) => {
            return Math.max(0, Math.min(island.chunks.length, maxCount, Math.floor(count || 0)));
        };
        const supplyCounts = {
            supplyWater: capSupplyCount(waterCount + (Number.isFinite(supplyTagBonuses.supplyWater) ? supplyTagBonuses.supplyWater : 0), 3),
            supplyFishing: capSupplyCount(fishingCount + (Number.isFinite(supplyTagBonuses.supplyFishing) ? supplyTagBonuses.supplyFishing : 0), 3),
            supplyWood: capSupplyCount(woodCount + (Number.isFinite(supplyTagBonuses.supplyWood) ? supplyTagBonuses.supplyWood : 0), 4),
            supplyRubble: capSupplyCount(rubbleCount + (Number.isFinite(supplyTagBonuses.supplyRubble) ? supplyTagBonuses.supplyRubble : 0), 3)
        };

        Object.keys(supplyCounts).forEach((supplyKind) => {
            pickSupplyChunks(island, supplyKind, supplyCounts[supplyKind]).forEach((chunk) => {
                chunk.tags.add(supplyKind);
            });
        });
    }

    function markVaultChunk(island) {
        const candidates = island.chunks.filter((chunk) => chunk.tags.has('tip') || chunk.tags.has('remote'));
        const pool = candidates.length > 0 ? candidates : island.chunks;

        pool.sort((left, right) => {
            if (right.distanceFromEntry !== left.distanceFromEntry) {
                return right.distanceFromEntry - left.distanceFromEntry;
            }

            return (right.internalDirections.size + right.bridgeDirections.size)
                - (left.internalDirections.size + left.bridgeDirections.size);
        });

        if (pool[0]) {
            pool[0].tags.add('vault');
        }
    }

    function hasForwardBridge(previousIsland, bridgePairs) {
        return bridgePairs.some((pair) => {
            const previousChunk = previousIsland.chunkMap.get(pair.previousChunkKey);
            return previousChunk && previousChunk.distanceFromEntry > 0;
        });
    }

    function buildPlacedIsland(islandIndex, previousIsland, occupiedKeys) {
        if (!previousIsland) {
            const random = createIslandRandom(islandIndex, 1);
            const contourKind = chooseContourKind(islandIndex, random);
            const relativeChunks = shapes.buildRelativeIslandShape(islandIndex, contourKind, random);
            const progression = buildIslandProgression(islandIndex, contourKind, random, relativeChunks.length);
            const translated = relativeChunks.map((chunk) => ({
                chunkX: chunk.relX,
                chunkY: chunk.relY,
                tags: new Set(chunk.tags)
            }));
            const island = createAbsoluteIslandRecord(islandIndex, progression, contourKind, translated);
            island.chunks[0].tags.add('entry');
            island.entryChunkKeys.add(chunkKey(island.chunks[0].chunkX, island.chunks[0].chunkY));
        applyDynamicChunkTags(island);
        computeChunkDistances(island);
        assignSupplyChunkTags(island);
        houseProfiles.assignIslandHousePlan(island);
        return island;
    }

        const attemptCount = islandIndex <= 6 ? 6 : 3;
        let selectedBuild = null;

        for (let attempt = 1; attempt <= attemptCount; attempt++) {
            const random = createIslandRandom(islandIndex, attempt);
            const contourKind = chooseContourKind(islandIndex, random);
            const relativeChunks = shapes.buildRelativeIslandShape(islandIndex, contourKind, random);
            const progression = buildIslandProgression(islandIndex, contourKind, random, relativeChunks.length);
            const placementCandidates = getPlacementCandidates(previousIsland, relativeChunks, occupiedKeys, random);

            if (placementCandidates.length === 0) {
                continue;
            }

            const preferredPlacement = islandIndex <= 6
                ? placementCandidates.find((candidate) => candidate.adjacencyPairs.some((pair) => {
                    const previousChunk = previousIsland.chunkMap.get(pair.previousChunkKey);
                    return previousChunk && previousChunk.distanceFromEntry > 0;
                }))
                : null;
            const placement = preferredPlacement || placementCandidates[0];
            const bridgePairs = chooseBridgePairs(
                islandIndex,
                placement.adjacencyPairs,
                random,
                previousIsland,
                progression
            );
            const validForwardProgress = islandIndex > 6
                || previousIsland.chunks.length <= 1
                || hasForwardBridge(previousIsland, bridgePairs);

            if (!selectedBuild) {
                selectedBuild = {
                    progression,
                    contourKind,
                    translated: placement.translated,
                    bridgePairs
                };
            }

            if (!validForwardProgress) {
                continue;
            }

            selectedBuild = {
                progression,
                contourKind,
                translated: placement.translated,
                bridgePairs
            };
            break;
        }

        if (!selectedBuild) {
            return null;
        }

        const island = createAbsoluteIslandRecord(
            islandIndex,
            selectedBuild.progression,
            selectedBuild.contourKind,
            selectedBuild.translated
        );
        applyBridgePairs(previousIsland, island, selectedBuild.bridgePairs);
        applyDynamicChunkTags(island);
        computeChunkDistances(island);

        if (selectedBuild.progression.isFinalIsland) {
            markVaultChunk(island);
        }

        assignSupplyChunkTags(island);
        houseProfiles.assignIslandHousePlan(island);
        return island;
    }

    Object.assign(islandLayout, {
        finalIslandIndex,
        getWorldLayoutPlan,
        resetLayoutState,
        getArchetypeDefinition,
        getScenarioDefinition,
        buildResourceNodeDensityProfile,
        buildIslandProgression,
        buildPlacedIsland,
        assignHouseProfile: houseProfiles.assignHouseProfile
    });

    Object.assign(expedition, {
        islandLayout,
        finalIslandIndex,
        getArchetypeDefinition,
        getScenarioDefinition,
        buildResourceNodeDensityProfile,
        assignHouseProfile: houseProfiles.assignHouseProfile
    });
})();
