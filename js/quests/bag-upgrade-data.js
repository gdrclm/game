(() => {
    const bagUpgradeData = window.Game.systems.bagUpgradeData = window.Game.systems.bagUpgradeData || {};

    const artisanDefinitions = {
        bagNovice: {
            npcKind: 'bagNovice',
            label: 'Сумочник-новичок',
            summary: 'Учится расширять походные сумки и просит самый базовый комплект полезных вещей.',
            islandIndex: 4,
            dialogueId: 'artisanGreeting'
        },
        roadLeatherworker: {
            npcKind: 'roadLeatherworker',
            label: 'Дорожный кожевник',
            summary: 'Сшивает крепкие походные ремни и требует почти полный рабочий набор.',
            islandIndex: 8,
            dialogueId: 'artisanGreeting'
        },
        quartermaster: {
            npcKind: 'quartermaster',
            label: 'Интендант экспедиции',
            summary: 'Собирает правильную экспедиционную выкладку и ценит дисциплину рюкзака.',
            islandIndex: 12,
            dialogueId: 'artisanGreeting'
        },
        smuggler: {
            npcKind: 'smuggler',
            label: 'Контрабандист',
            summary: 'Любит неудобные и конфликтные сборки. За лишний слот придётся пожертвовать комфортом.',
            islandIndex: 17,
            dialogueId: 'artisanGreeting'
        },
        collector: {
            npcKind: 'collector',
            label: 'Коллекционер редкостей',
            summary: 'Смотрит только на дорогие и сильные вещи. Слабый набор его не впечатлит.',
            islandIndex: 22,
            dialogueId: 'artisanGreeting'
        },
        legendaryBagmaster: {
            npcKind: 'legendaryBagmaster',
            label: 'Легендарный мастер тары',
            summary: 'Делает финальное расширение сумки только тем, кто готов почти сломать весь текущий билд.',
            islandIndex: 26,
            dialogueId: 'artisanGreeting'
        }
    };
    const craftedLoadoutProfiles = {
        survivorKit: {
            profileId: 'survivorKit',
            label: 'Комплект выжившего',
            description: 'Подойдёт любой собранный рецепт выживания: лечение, еда, вода или стабилизация.',
            matchAny: [
                { sourceRecipeTags: ['survival', 'healing', 'food', 'water'] }
            ]
        },
        bridgeKit: {
            profileId: 'bridgeKit',
            label: 'Мостовой набор',
            description: 'Подойдёт любая собранная мостовая, ремонтная или строительная заготовка под переправу.',
            matchAny: [
                { sourceRecipeTags: ['bridge', 'construction', 'repair', 'movement'] }
            ]
        },
        longRouteKit: {
            profileId: 'longRouteKit',
            label: 'Комплект дальнего маршрута',
            description: 'Подойдёт собранный предмет под длинный путь: навигация, свет, темп или маршрутная утилита.',
            matchAny: [
                { sourceRecipeTags: ['route', 'movement', 'info', 'light'] }
            ]
        }
    };

    const bagUpgradeStages = [
        {
            stageId: 'bagUpgrade_4_5',
            npcKind: 'bagNovice',
            islandIndex: 4,
            appearanceWindow: [3, 5],
            deadlineIslandIndex: 7,
            sourceSlots: 4,
            targetSlots: 5,
            occupancyGoal: '3 из 4 слотов должны быть заняты полезным набором.',
            requirements: [
                {
                    requirementId: 'food',
                    label: 'Еда',
                    description: 'Нужен хотя бы один предмет еды.',
                    matchAny: [
                        { questCategories: ['food'] }
                    ]
                },
                {
                    requirementId: 'tool',
                    label: 'Инструмент',
                    description: 'Нужен хотя бы один инструмент.',
                    matchAny: [
                        { questCategories: ['tool'] }
                    ]
                },
                {
                    requirementId: 'survivorLoadout',
                    craftedLoadoutProfileId: 'survivorKit',
                    matchAny: [
                        { itemIds: ['healing_base', 'fuel_bundle'] }
                    ]
                }
            ]
        },
        {
            stageId: 'bagUpgrade_5_6',
            npcKind: 'roadLeatherworker',
            islandIndex: 8,
            appearanceWindow: [7, 9],
            deadlineIslandIndex: 12,
            sourceSlots: 5,
            targetSlots: 6,
            occupancyGoal: '4 из 5 слотов должны быть заняты почти рабочим походным комплектом.',
            requirements: [
                {
                    requirementId: 'movement',
                    label: 'Предмет движения',
                    description: 'Нужен хотя бы один предмет движения.',
                    matchAny: [
                        { questCategories: ['movement'] }
                    ]
                },
                {
                    requirementId: 'survival',
                    label: 'Предмет выживания',
                    description: 'Нужен хотя бы один предмет выживания.',
                    matchAny: [
                        { questCategories: ['survival'] }
                    ]
                },
                {
                    requirementId: 'value',
                    label: 'Ценность',
                    description: 'Нужна хотя бы одна ценность.',
                    matchAny: [
                        { questCategories: ['value'] }
                    ]
                },
                {
                    requirementId: 'bridgeLoadout',
                    craftedLoadoutProfileId: 'bridgeKit',
                    matchAny: [
                        { questCategories: ['consumable'], minTier: 2 },
                        { itemIds: ['fiber_rope', 'wood_plank_basic', 'bridge_kit', 'repair_kit_bridge'] }
                    ]
                }
            ]
        },
        {
            stageId: 'bagUpgrade_6_7',
            npcKind: 'quartermaster',
            islandIndex: 12,
            appearanceWindow: [11, 14],
            deadlineIslandIndex: 17,
            sourceSlots: 6,
            targetSlots: 7,
            occupancyGoal: 'Нужна почти полноценная походная выкладка 4–5 предметов из 6.',
            requirements: [
                {
                    requirementId: 'movement',
                    label: 'Предмет движения',
                    description: 'Нужен хотя бы один предмет движения.',
                    matchAny: [
                        { questCategories: ['movement'] }
                    ]
                },
                {
                    requirementId: 'survival',
                    label: 'Предмет выживания',
                    description: 'Нужен хотя бы один предмет выживания.',
                    matchAny: [
                        { questCategories: ['survival'] }
                    ]
                },
                {
                    requirementId: 'tool',
                    label: 'Инструмент',
                    description: 'Нужен хотя бы один инструмент.',
                    matchAny: [
                        { questCategories: ['tool'] }
                    ]
                },
                {
                    requirementId: 'rareValue',
                    craftedLoadoutProfileId: 'longRouteKit',
                    label: 'Редкая ценность или комплект дальнего маршрута',
                    description: 'Нужна редкая ценность не ниже T3 или собранный набор под длинный путь.',
                    matchAny: [
                        { questCategories: ['value'], minTier: 3 },
                        { itemIds: ['fish_oil', 'wood_frame_basic', 'boatFrame', 'flask_water_full', 'repair_kit_boat'] }
                    ]
                },
                {
                    requirementId: 'unusedConsumable',
                    label: 'Неиспользованный расходник',
                    description: 'Подойдёт любой неиспользованный расходник.',
                    optional: true,
                    matchAny: [
                        { questCategories: ['consumable'], unusedOnly: true }
                    ]
                }
            ]
        },
        {
            stageId: 'bagUpgrade_7_8',
            npcKind: 'smuggler',
            islandIndex: 17,
            appearanceWindow: [16, 19],
            deadlineIslandIndex: 22,
            sourceSlots: 7,
            targetSlots: 8,
            occupancyGoal: 'Нужно 5 из 7 занятых слотов, включая сильный рискованный предмет.',
            requirements: [
                {
                    requirementId: 'topMovement',
                    label: 'Топовый предмет движения',
                    description: 'Подойдёт предмет движения не ниже T4.',
                    matchAny: [
                        { questCategories: ['movement'], minTier: 4 }
                    ]
                },
                {
                    requirementId: 'strongSurvival',
                    label: 'Сильный предмет выживания',
                    description: 'Подойдёт предмет выживания не ниже T4.',
                    matchAny: [
                        { questCategories: ['survival'], minTier: 4 }
                    ]
                },
                {
                    requirementId: 'value',
                    label: 'Ценность',
                    description: 'Нужна ценность.',
                    matchAny: [
                        { questCategories: ['value'] }
                    ]
                },
                {
                    requirementId: 'risk',
                    label: 'Рискованный или проклятый предмет',
                    description: 'Подойдёт любой рискованный или проклятый предмет.',
                    matchAny: [
                        { questCategories: ['risk'] }
                    ]
                },
                {
                    requirementId: 'tool',
                    label: 'Собранный маршрутный узел',
                    description: 'Нужен готовый мостовой, лодочный или ремонтный комплект.',
                    matchAny: [
                        { itemIds: ['bridge_kit', 'repair_kit_bridge', 'repair_kit_boat', 'boat_ready', 'reinforcedBridge', 'fieldBridge'] }
                    ]
                }
            ]
        },
        {
            stageId: 'bagUpgrade_8_9',
            npcKind: 'collector',
            islandIndex: 22,
            appearanceWindow: [21, 24],
            deadlineIslandIndex: 27,
            sourceSlots: 8,
            targetSlots: 9,
            occupancyGoal: 'Это уже почти разрыв билда: 6 из 8 слотов должны быть заняты серьёзными вещами.',
            requirements: [
                {
                    requirementId: 'topMovement',
                    label: 'Топовое движение',
                    description: 'Подойдёт предмет движения не ниже T5.',
                    matchAny: [
                        { questCategories: ['movement'], minTier: 5 }
                    ]
                },
                {
                    requirementId: 'topSurvival',
                    label: 'Топовое выживание',
                    description: 'Подойдёт предмет выживания не ниже T5.',
                    matchAny: [
                        { questCategories: ['survival'], minTier: 5 }
                    ]
                },
                {
                    requirementId: 'topUtility',
                    label: 'Топовый утилитарный предмет',
                    description: 'Подойдёт утилитарный предмет не ниже T5.',
                    matchAny: [
                        { questCategories: ['utility'], minTier: 5 }
                    ]
                },
                {
                    requirementId: 'rareValue',
                    label: 'Редкая ценность',
                    description: 'Нужна ценность не ниже T4.',
                    matchAny: [
                        { questCategories: ['value'], minTier: 4 }
                    ]
                },
                {
                    requirementId: 'extraValueOrConsumable',
                    label: 'Дополнительная ценность или сильный расходник',
                    description: 'Подойдёт ценность или сильный расходник.',
                    matchAny: [
                        { questCategories: ['value'] },
                        { questCategories: ['consumable'], minTier: 4 }
                    ]
                },
                {
                    requirementId: 'unusedHeldItem',
                    label: 'Неиспользованный предмет',
                    description: 'Нужен предмет, который нельзя использовать до сдачи.',
                    matchAny: [
                        { unusedOnly: true }
                    ]
                }
            ]
        },
        {
            stageId: 'bagUpgrade_9_10',
            npcKind: 'legendaryBagmaster',
            islandIndex: 26,
            appearanceWindow: [25, 28],
            deadlineIslandIndex: 29,
            sourceSlots: 9,
            targetSlots: 10,
            occupancyGoal: 'Финальный слот требует почти безумного набора 6–7 предметов из 9.',
            requirements: [
                {
                    requirementId: 'topMovement',
                    label: 'Топовое движение',
                    description: 'Подойдёт предмет движения не ниже T5.',
                    matchAny: [
                        { questCategories: ['movement'], minTier: 5 }
                    ]
                },
                {
                    requirementId: 'topSurvival',
                    label: 'Топовое выживание',
                    description: 'Подойдёт предмет выживания не ниже T5.',
                    matchAny: [
                        { questCategories: ['survival'], minTier: 5 }
                    ]
                },
                {
                    requirementId: 'topUtility',
                    label: 'Топовая утилита',
                    description: 'Подойдёт утилитарный предмет не ниже T5.',
                    matchAny: [
                        { questCategories: ['utility'], minTier: 5 }
                    ]
                },
                {
                    requirementId: 'topRisk',
                    label: 'Топовый рискованный предмет',
                    description: 'Подойдёт рискованный или проклятый предмет не ниже T5.',
                    matchAny: [
                        { questCategories: ['risk'], minTier: 5 }
                    ]
                },
                {
                    requirementId: 'uniqueValue',
                    label: 'Уникальная ценность',
                    description: 'Нужна уникальная ценность.',
                    matchAny: [
                        { questCategories: ['value'], minTier: 5, uniqueOnly: true }
                    ]
                },
                {
                    requirementId: 'carriedRelic',
                    label: 'Предмет, пронесённый несколько островов',
                    description: 'Нужен предмет, который ты носил минимум 2 острова.',
                    matchAny: [
                        { minCarriedIslands: 2 }
                    ]
                },
                {
                    requirementId: 'unusedStrongConsumable',
                    label: 'Неиспользованный сильный расходник',
                    description: 'Нужен сильный расходник не ниже T4, который ещё не использовался.',
                    optional: true,
                    matchAny: [
                        { questCategories: ['consumable'], minTier: 4, unusedOnly: true }
                    ]
                }
            ]
        }
    ];

    function getArtisanDefinition(npcKind) {
        return artisanDefinitions[npcKind] || null;
    }

    function getCraftedLoadoutProfile(profileId) {
        return craftedLoadoutProfiles[profileId] || null;
    }

    function getBagUpgradeStage(stageId) {
        return bagUpgradeStages.find((stage) => stage.stageId === stageId) || null;
    }

    function getBagUpgradeStageForIsland(islandIndex) {
        return bagUpgradeStages.find((stage) => stage.islandIndex === islandIndex) || null;
    }

    Object.assign(bagUpgradeData, {
        artisanDefinitions,
        craftedLoadoutProfiles,
        bagUpgradeStages,
        getArtisanDefinition,
        getCraftedLoadoutProfile,
        getBagUpgradeStage,
        getBagUpgradeStageForIsland
    });
})();
