(() => {
    const game = window.Game;
    const islandNeedProfile = game.systems.islandNeedProfile = game.systems.islandNeedProfile || {};

    const NEED_LEVELS = Object.freeze({
        mandatory: 'mandatory',
        recommended: 'recommended',
        optional: 'optional'
    });

    function cloneValue(value) {
        if (Array.isArray(value)) {
            return value.map(cloneValue);
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
            );
        }

        return value;
    }

    function normalizeLookupValue(value) {
        return typeof value === 'string' ? value.trim().toLowerCase() : '';
    }

    const resourceNeedDefinitions = [
        {
            id: 'raw_grass',
            label: 'Трава',
            kind: 'raw',
            note: 'База раннего лечения и финальной стабилизации.'
        },
        {
            id: 'raw_wood',
            label: 'Дерево',
            kind: 'raw',
            note: 'Главный материал под мосты, топливо и лодку.'
        },
        {
            id: 'water',
            label: 'Вода',
            kind: 'survival',
            note: 'Фляга и лагерь остаются базой почти на всём пробеге.'
        },
        {
            id: 'raw_stone',
            label: 'Камень',
            kind: 'raw',
            note: 'Переходит в тяжёлые блоки, поздние инструменты и укрепления.'
        },
        {
            id: 'raw_rubble',
            label: 'Щебень',
            kind: 'raw',
            note: 'Критичен для ремонтного слоя и середины логистики.'
        },
        {
            id: 'raw_fish',
            label: 'Рыба',
            kind: 'raw',
            note: 'Даёт еду, жир и позднюю стабилизацию.'
        },
        {
            id: 'fish_oil',
            label: 'Рыбий жир',
            kind: 'processed',
            note: 'Катализатор лодки, фонарей и поздней логистики.'
        },
        {
            id: 'paper',
            label: 'Бумага и маршрутные листы',
            kind: 'trade',
            note: 'Нужна для информационных и экономических веток середины и поздних окон.'
        },
        {
            id: 'valuables',
            label: 'Ценности',
            kind: 'trade',
            note: 'Нужны только там, где игра уже позволяет перестраивать сумку под прибыль.'
        }
    ];

    const craftBranchDefinitions = [
        {
            id: 'water_cycle',
            label: 'Водный цикл',
            exampleRecipeIds: ['fill-water-flask', 'boil-water'],
            note: 'Фляга и кипячение воды.'
        },
        {
            id: 'cheap_healing',
            label: 'Дешёвое лечение',
            exampleRecipeIds: ['grass-to-healing-base', 'healing-brew'],
            note: 'Самый дешёвый слой стабилизации через траву.'
        },
        {
            id: 'survival_food',
            label: 'Выживательная еда',
            exampleRecipeIds: ['dried-ration', 'raw-fish-ration', 'hearty-ration'],
            note: 'Пайки и простая еда под темп.'
        },
        {
            id: 'fuel_prep',
            label: 'Топливо',
            exampleRecipeIds: ['wood-to-fuel-bundle'],
            note: 'Топливные связки для лагеря, воды и поздних рецептов.'
        },
        {
            id: 'fiber_rope',
            label: 'Верёвка',
            exampleRecipeIds: ['grass-to-rope'],
            note: 'Первый структурный пакет под мосты и лодку.'
        },
        {
            id: 'first_bridge',
            label: 'Первый мост',
            exampleRecipeIds: ['portable-bridge', 'portable-bridge-assembly'],
            note: 'Ранний маршрутный барьер и первое открытие обходов.'
        },
        {
            id: 'bridge_repair',
            label: 'Ремонт моста',
            exampleRecipeIds: ['bridge-repair-kit', 'stone-rubble-to-gravel-fill'],
            note: 'Сохранение уже открытого доступа.'
        },
        {
            id: 'fish_processing',
            label: 'Переработка рыбы',
            exampleRecipeIds: ['fish-to-fish-meat', 'fish-to-fish-oil'],
            note: 'Перевод сырой рыбы в мясо и рыбий жир.'
        },
        {
            id: 'route_info',
            label: 'Маршрутная информация',
            exampleRecipeIds: ['road-chalk', 'path-marker', 'merchant-beacon'],
            note: 'Снижение цены шага и работа с маршрутом.'
        },
        {
            id: 'tempo_boost',
            label: 'Темп и ускорение',
            exampleRecipeIds: ['second-wind'],
            note: 'Эффекты, которые окупаются шагами маршрута.'
        },
        {
            id: 'light_utility',
            label: 'Свет и туман',
            exampleRecipeIds: ['fog-lantern'],
            note: 'Слой обзора и уверенности в туманных окнах.'
        },
        {
            id: 'boat_frame',
            label: 'Лодочный каркас',
            exampleRecipeIds: ['boat-frame'],
            note: 'Подготовка водной ветки до полной лодки.'
        },
        {
            id: 'repair_support',
            label: 'Ремонтная поддержка',
            exampleRecipeIds: ['bridge-repair-kit', 'boat-repair-kit'],
            note: 'Универсальные ремкомплекты для мостов и лодки.'
        },
        {
            id: 'water_escape',
            label: 'Запас воды и спасение',
            exampleRecipeIds: ['boil-water'],
            note: 'Держать воду как страховку под длинные окна.'
        },
        {
            id: 'boat_ready',
            label: 'Готовая лодка',
            exampleRecipeIds: ['boat'],
            note: 'Полноценный допуск к водным маршрутам.'
        },
        {
            id: 'safehouse_protection',
            label: 'Защита укрытий',
            exampleRecipeIds: ['safe-house-seal'],
            note: 'Страховка на опасных домах и поздних окнах.'
        },
        {
            id: 'strong_survival',
            label: 'Сильное выживание',
            exampleRecipeIds: ['hearty-ration', 'healing-brew', 'second-wind'],
            note: 'Поздняя еда, отвары и стабилизация.'
        },
        {
            id: 'trade_values',
            label: 'Экономические ценности',
            exampleRecipeIds: ['wood-plank-to-trade-papers', 'stone-block-to-market-seal'],
            note: 'Крафтовые ценности на продажу и торговые ветки.'
        },
        {
            id: 'collector_loadout',
            label: 'Коллекционерский комплект',
            exampleRecipeIds: [],
            note: 'Сумка и loadout под перенос редкого лута и квестовых ценностей.'
        },
        {
            id: 'endgame_route',
            label: 'Эндгейм-маршрут',
            exampleRecipeIds: ['absolute-bridge-upgrade', 'merchant-beacon'],
            note: 'Убирать случайность из позднего маршрута.'
        },
        {
            id: 'heavy_utility',
            label: 'Тяжёлая утилита',
            exampleRecipeIds: ['island-drill'],
            note: 'Поздняя тяжёлая станционная ветка.'
        },
        {
            id: 'final_survival',
            label: 'Финальное выживание',
            exampleRecipeIds: ['hearty-ration', 'healing-brew'],
            note: 'Максимум доживания, минимум greed.'
        },
        {
            id: 'guaranteed_route',
            label: 'Гарантированный проход',
            exampleRecipeIds: ['absolute-bridge-upgrade', 'boat'],
            note: 'На финале важен только надёжный допуск к выходу.'
        }
    ];

    function createNeedBucket(resources, branches) {
        return {
            resources: Array.isArray(resources) ? resources.filter(Boolean) : [],
            branches: Array.isArray(branches) ? branches.filter(Boolean) : []
        };
    }

    const islandNeedWindows = [
        {
            windowId: '1-3-survival',
            islandFrom: 1,
            islandTo: 3,
            focus: 'Стартовое выживание',
            mandatory: createNeedBucket(
                ['raw_grass', 'raw_wood', 'water'],
                ['water_cycle', 'cheap_healing', 'survival_food']
            ),
            recommended: createNeedBucket(
                ['raw_fish'],
                ['fuel_prep']
            ),
            optional: createNeedBucket(
                ['raw_stone'],
                ['trade_values']
            ),
            avoid: 'Не жадничать и не носить ценности.',
            rule: 'Сначала стабилизация, потом всё остальное.'
        },
        {
            windowId: '4-6-first-bridge',
            islandFrom: 4,
            islandTo: 6,
            focus: 'Первый маршрутный барьер',
            mandatory: createNeedBucket(
                ['raw_wood', 'raw_grass', 'raw_stone'],
                ['fiber_rope', 'first_bridge', 'survival_food']
            ),
            recommended: createNeedBucket(
                ['water'],
                ['cheap_healing', 'fuel_prep']
            ),
            optional: createNeedBucket(
                ['raw_fish', 'raw_rubble'],
                ['bridge_repair']
            ),
            avoid: 'Не тратить дерево в пустую и не терять слот под стройматериал.',
            rule: 'Материалы под первый мост важнее красивого лута.'
        },
        {
            windowId: '7-9-repair-and-fish',
            islandFrom: 7,
            islandTo: 9,
            focus: 'Подготовка к воде и ремонту',
            mandatory: createNeedBucket(
                ['raw_rubble', 'raw_wood', 'raw_fish'],
                ['bridge_repair', 'survival_food', 'fish_processing']
            ),
            recommended: createNeedBucket(
                ['water', 'raw_grass'],
                ['boat_frame', 'route_info']
            ),
            optional: createNeedBucket(
                ['raw_stone'],
                ['cheap_healing']
            ),
            avoid: 'Не пережигать всё дерево в еду.',
            rule: 'Начать готовить лодочный цикл до того, как вода станет обязательной.'
        },
        {
            windowId: '10-12-fog-and-distance',
            islandFrom: 10,
            islandTo: 12,
            focus: 'Надёжность и туман',
            mandatory: createNeedBucket(
                ['raw_stone', 'water', 'raw_fish'],
                ['route_info', 'tempo_boost', 'light_utility']
            ),
            recommended: createNeedBucket(
                ['raw_wood', 'raw_grass'],
                ['fish_processing', 'bridge_repair']
            ),
            optional: createNeedBucket(
                ['raw_rubble'],
                ['trade_values']
            ),
            avoid: 'Не входить в туманные окна без инструмента сокращения шага.',
            rule: 'Цена движения становится главным врагом.'
        },
        {
            windowId: '13-15-mid-utility',
            islandFrom: 13,
            islandTo: 15,
            focus: 'Утилитарный пик середины',
            mandatory: createNeedBucket(
                ['raw_wood', 'raw_rubble', 'raw_fish'],
                ['boat_frame', 'repair_support']
            ),
            recommended: createNeedBucket(
                ['water', 'raw_stone'],
                ['route_info', 'fish_processing']
            ),
            optional: createNeedBucket(
                ['raw_grass'],
                ['safehouse_protection']
            ),
            avoid: 'Не выходить без аварийного инструмента.',
            rule: 'Провал ремонта ломает всю логистику.'
        },
        {
            windowId: '16-18-water-stage',
            islandFrom: 16,
            islandTo: 18,
            focus: 'Полноценная вода и обход',
            mandatory: createNeedBucket(
                ['raw_wood', 'fish_oil', 'raw_grass'],
                ['boat_ready', 'water_escape', 'safehouse_protection']
            ),
            recommended: createNeedBucket(
                ['water', 'raw_fish'],
                ['repair_support', 'strong_survival']
            ),
            optional: createNeedBucket(
                ['raw_rubble'],
                ['trade_values']
            ),
            avoid: 'Не идти в богатые ветки без лодки.',
            rule: 'Без воды и переправ теряются лучшие дома и ветки.'
        },
        {
            windowId: '19-21-stabilization',
            islandFrom: 19,
            islandTo: 21,
            focus: 'Стабильность перед жадностью',
            mandatory: createNeedBucket(
                ['raw_fish', 'raw_grass', 'water'],
                ['strong_survival', 'repair_support']
            ),
            recommended: createNeedBucket(
                ['raw_rubble', 'raw_wood'],
                ['boat_ready', 'safehouse_protection']
            ),
            optional: createNeedBucket(
                ['valuables'],
                ['trade_values']
            ),
            avoid: 'Не превращать сумку только в ценности.',
            rule: 'Сначала доживание, потом greed.'
        },
        {
            windowId: '22-24-collector',
            islandFrom: 22,
            islandTo: 24,
            focus: 'Коллекционерский отрезок',
            mandatory: createNeedBucket(
                ['raw_wood', 'paper', 'valuables'],
                ['trade_values', 'collector_loadout']
            ),
            recommended: createNeedBucket(
                ['raw_stone', 'raw_fish'],
                ['route_info', 'strong_survival']
            ),
            optional: createNeedBucket(
                ['raw_grass'],
                ['repair_support']
            ),
            avoid: 'Не тащить дорогой лут без подготовленной сумки.',
            rule: 'Ценность важна только если её можно донести.'
        },
        {
            windowId: '25-27-endgame-route',
            islandFrom: 25,
            islandTo: 27,
            focus: 'Эндгейм логистика',
            mandatory: createNeedBucket(
                ['raw_stone', 'raw_wood', 'fish_oil'],
                ['endgame_route', 'heavy_utility']
            ),
            recommended: createNeedBucket(
                ['water', 'raw_rubble'],
                ['repair_support', 'boat_ready']
            ),
            optional: createNeedBucket(
                ['valuables'],
                ['trade_values']
            ),
            avoid: 'Не крафтить то, что не снижает риск маршрута.',
            rule: 'Цена ошибки резко вырастает, случайность нужно вычищать.'
        },
        {
            windowId: '28-29-final-prep',
            islandFrom: 28,
            islandTo: 29,
            focus: 'Финальная подготовка',
            mandatory: createNeedBucket(
                ['raw_grass', 'raw_fish', 'water'],
                ['final_survival']
            ),
            recommended: createNeedBucket(
                ['raw_wood'],
                ['guaranteed_route', 'repair_support']
            ),
            optional: createNeedBucket(
                ['valuables'],
                ['trade_values']
            ),
            avoid: 'Никакого лишнего гринда и богатства ради богатства.',
            rule: 'Крафтить только то, что помогает пройти.'
        },
        {
            windowId: '30-finale',
            islandFrom: 30,
            islandTo: 30,
            focus: 'Финальный остров',
            mandatory: createNeedBucket(
                ['water'],
                ['guaranteed_route', 'final_survival']
            ),
            recommended: createNeedBucket(
                ['raw_fish', 'raw_grass'],
                ['strong_survival']
            ),
            optional: createNeedBucket([], []),
            avoid: 'Не тратить ресурсы на вторичный лут.',
            rule: 'На финале лут вторичен, важен только завершённый маршрут.'
        }
    ];

    function buildDefinitionMap(definitions) {
        return Object.fromEntries(
            definitions.map((definition) => [definition.id, cloneValue(definition)])
        );
    }

    const resourceNeedDefinitionById = buildDefinitionMap(resourceNeedDefinitions);
    const craftBranchDefinitionById = buildDefinitionMap(craftBranchDefinitions);

    function validateNeedBucket(bucket, fieldName) {
        const resources = Array.isArray(bucket && bucket.resources) ? bucket.resources : [];
        const branches = Array.isArray(bucket && bucket.branches) ? bucket.branches : [];

        resources.forEach((resourceId) => {
            if (!resourceNeedDefinitionById[resourceId]) {
                throw new Error(`[island-need-profile] Unknown resource need "${resourceId}" in ${fieldName}.`);
            }
        });

        branches.forEach((branchId) => {
            if (!craftBranchDefinitionById[branchId]) {
                throw new Error(`[island-need-profile] Unknown craft branch "${branchId}" in ${fieldName}.`);
            }
        });
    }

    function validateNeedWindows(windows) {
        let expectedIsland = 1;

        (Array.isArray(windows) ? windows : []).forEach((windowDefinition, index) => {
            const from = Number(windowDefinition && windowDefinition.islandFrom);
            const to = Number(windowDefinition && windowDefinition.islandTo);

            if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) {
                throw new Error(`[island-need-profile] Invalid island window at index ${index}.`);
            }

            if (from !== expectedIsland) {
                throw new Error(`[island-need-profile] Island window coverage is broken near island ${expectedIsland}.`);
            }

            validateNeedBucket(windowDefinition.mandatory, `${windowDefinition.windowId}.mandatory`);
            validateNeedBucket(windowDefinition.recommended, `${windowDefinition.windowId}.recommended`);
            validateNeedBucket(windowDefinition.optional, `${windowDefinition.windowId}.optional`);

            expectedIsland = to + 1;
        });

        if (expectedIsland !== 31) {
            throw new Error('[island-need-profile] Island windows must cover islands 1-30 without gaps.');
        }
    }

    validateNeedWindows(islandNeedWindows);

    function getNeedLevelBucket(windowDefinition, needLevel = NEED_LEVELS.mandatory) {
        const normalizedNeedLevel = NEED_LEVELS[normalizeLookupValue(needLevel)] || NEED_LEVELS.mandatory;
        return cloneValue(windowDefinition && windowDefinition[normalizedNeedLevel]
            ? windowDefinition[normalizedNeedLevel]
            : createNeedBucket([], []));
    }

    function getIslandNeedWindow(islandIndex) {
        const normalizedIslandIndex = Math.max(1, Math.floor(Number(islandIndex) || 1));
        const windowDefinition = islandNeedWindows.find((candidate) => (
            normalizedIslandIndex >= candidate.islandFrom
            && normalizedIslandIndex <= candidate.islandTo
        ));

        return windowDefinition ? cloneValue(windowDefinition) : null;
    }

    function getResourceNeedDefinition(resourceId) {
        return resourceNeedDefinitionById[resourceId]
            ? cloneValue(resourceNeedDefinitionById[resourceId])
            : null;
    }

    function getCraftBranchDefinition(branchId) {
        return craftBranchDefinitionById[branchId]
            ? cloneValue(craftBranchDefinitionById[branchId])
            : null;
    }

    function expandNeedBucket(bucket) {
        const normalizedBucket = bucket || createNeedBucket([], []);
        return {
            resources: normalizedBucket.resources
                .map((resourceId) => getResourceNeedDefinition(resourceId))
                .filter(Boolean),
            branches: normalizedBucket.branches
                .map((branchId) => getCraftBranchDefinition(branchId))
                .filter(Boolean)
        };
    }

    function getExpandedNeedWindow(islandIndex) {
        const windowDefinition = getIslandNeedWindow(islandIndex);
        if (!windowDefinition) {
            return null;
        }

        return {
            ...windowDefinition,
            mandatory: expandNeedBucket(windowDefinition.mandatory),
            recommended: expandNeedBucket(windowDefinition.recommended),
            optional: expandNeedBucket(windowDefinition.optional)
        };
    }

    Object.assign(islandNeedProfile, {
        NEED_LEVELS,
        resourceNeedDefinitions: resourceNeedDefinitions.map((definition) => cloneValue(definition)),
        craftBranchDefinitions: craftBranchDefinitions.map((definition) => cloneValue(definition)),
        islandNeedWindows: islandNeedWindows.map((windowDefinition) => cloneValue(windowDefinition)),
        getCraftBranchDefinition,
        getExpandedNeedWindow,
        getIslandNeedWindow,
        getNeedLevelBucket,
        getResourceNeedDefinition
    });
})();
