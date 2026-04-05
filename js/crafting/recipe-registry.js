(() => {
    const game = window.Game;
    const recipeRegistry = game.systems.recipeRegistry = game.systems.recipeRegistry || {};

    function getStationRuntime() {
        return game.systems.stationRuntime || null;
    }

    function getResourceRegistry() {
        return game.systems.resourceRegistry || null;
    }

    function getComponentRegistry() {
        return game.systems.componentRegistry || null;
    }

    const RECIPE_TIERS = {
        baseConversion: 1,
        survivalAndEnergy: 2,
        buildWaterAndRepair: 3
    };

    function isDevMode(options = {}) {
        if (typeof options.devMode === 'boolean') {
            return options.devMode;
        }

        return Boolean(game.debug && game.debug.enabled);
    }

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

    function createIngredient(kind, id, label, quantity, extra = {}) {
        return {
            kind,
            id,
            label,
            quantity,
            ...cloneValue(extra)
        };
    }

    function createResult(kind, id, label, quantity, extra = {}) {
        return {
            kind,
            id,
            label,
            quantity,
            ...cloneValue(extra)
        };
    }

    function createIslandNeedProfile(windows) {
        const normalizedWindows = (Array.isArray(windows) ? windows : [])
            .map((window) => ({
                from: Number(window.from),
                to: Number(window.to),
                priority: window.priority || 'recommended',
                note: window.note || ''
            }))
            .filter((window) => Number.isFinite(window.from) && Number.isFinite(window.to));

        const earliestIsland = normalizedWindows.length
            ? Math.min(...normalizedWindows.map((window) => window.from))
            : null;
        const latestIsland = normalizedWindows.length
            ? Math.max(...normalizedWindows.map((window) => window.to))
            : null;

        return {
            earliestIsland,
            latestIsland,
            windows: normalizedWindows
        };
    }

    function normalizeStationId(station) {
        const stationRuntime = getStationRuntime();
        return stationRuntime && typeof stationRuntime.normalizeStationId === 'function'
            ? stationRuntime.normalizeStationId(station)
            : (typeof station === 'string' ? station.trim().toLowerCase() : '');
    }

    function normalizeTagList(tags) {
        return [...new Set((Array.isArray(tags) ? tags : [])
            .filter((tag) => typeof tag === 'string' && tag.trim())
            .map((tag) => tag.trim()))];
    }

    function buildKnownResourceIdSet(options = {}) {
        if (Array.isArray(options.resourceIds)) {
            return new Set(options.resourceIds
                .filter((resourceId) => typeof resourceId === 'string' && resourceId.trim())
                .map((resourceId) => resourceId.trim()));
        }

        const resourceRegistryRef = options.resourceRegistry || getResourceRegistry();
        const definitions = resourceRegistryRef && typeof resourceRegistryRef.getBaseResourceDefinitions === 'function'
            ? resourceRegistryRef.getBaseResourceDefinitions()
            : [];

        return new Set(definitions
            .map((definition) => definition && definition.id)
            .filter((resourceId) => typeof resourceId === 'string' && resourceId.trim())
            .map((resourceId) => resourceId.trim()));
    }

    function buildKnownComponentIdSet(options = {}) {
        if (Array.isArray(options.componentIds)) {
            return new Set(options.componentIds
                .filter((componentId) => typeof componentId === 'string' && componentId.trim())
                .map((componentId) => componentId.trim()));
        }

        const componentRegistryRef = options.componentRegistry || getComponentRegistry();
        const definitions = componentRegistryRef && typeof componentRegistryRef.getComponentDefinitions === 'function'
            ? componentRegistryRef.getComponentDefinitions()
            : [];

        return new Set(definitions
            .map((definition) => definition && definition.id)
            .filter((componentId) => typeof componentId === 'string' && componentId.trim())
            .map((componentId) => componentId.trim()));
    }

    function normalizeRecipeDefinition(definition = {}) {
        const station = normalizeStationId(definition.station);
        const stationOptions = [...new Set(((Array.isArray(definition.stationOptions) && definition.stationOptions.length > 0)
            ? definition.stationOptions
            : [station])
            .map((stationOption) => normalizeStationId(stationOption))
            .filter(Boolean))];

        return {
            ...cloneValue(definition),
            recipeId: typeof definition.recipeId === 'string' ? definition.recipeId.trim() : '',
            label: typeof definition.label === 'string' ? definition.label.trim() : '',
            station,
            stationLabel: typeof definition.stationLabel === 'string' ? definition.stationLabel.trim() : '',
            stationOptions,
            tags: normalizeTagList(definition.tags),
            ingredients: (Array.isArray(definition.ingredients) ? definition.ingredients : [])
                .map((ingredient) => cloneValue(ingredient))
                .filter((ingredient) => ingredient && typeof ingredient.id === 'string' && ingredient.id.trim()),
            result: definition.result ? cloneValue(definition.result) : null
        };
    }

    function validateRecipeReference(recipe, entry, knownResourceIds, knownComponentIds, entryType) {
        if (!entry || typeof entry.id !== 'string' || !entry.id.trim()) {
            return;
        }

        if (entry.kind === 'resource' && !knownResourceIds.has(entry.id)) {
            throw new Error(`[recipe-registry] Recipe "${recipe.recipeId}" has unknown ${entryType} resource "${entry.id}".`);
        }

        if (entry.kind === 'component' && !knownComponentIds.has(entry.id)) {
            throw new Error(`[recipe-registry] Recipe "${recipe.recipeId}" has unknown ${entryType} component "${entry.id}".`);
        }
    }

    function validateRecipeDefinition(definition, options = {}) {
        const normalizedDefinition = normalizeRecipeDefinition(definition);
        const missingFields = [];

        if (!normalizedDefinition.recipeId) {
            missingFields.push('recipeId');
        }

        if (!normalizedDefinition.label) {
            missingFields.push('label');
        }

        if (!normalizedDefinition.station) {
            missingFields.push('station');
        }

        if (!Number.isFinite(normalizedDefinition.tier)) {
            missingFields.push('tier');
        }

        if (!Array.isArray(normalizedDefinition.ingredients) || normalizedDefinition.ingredients.length === 0) {
            missingFields.push('ingredients');
        }

        if (!normalizedDefinition.result || typeof normalizedDefinition.result.id !== 'string' || !normalizedDefinition.result.id.trim()) {
            missingFields.push('result');
        }

        if (missingFields.length > 0) {
            const recipeLabel = normalizedDefinition.recipeId || `#${Number(options.index) + 1 || 1}`;
            throw new Error(`[recipe-registry] Recipe "${recipeLabel}" is missing required fields: ${missingFields.join(', ')}.`);
        }

        const stationRuntime = getStationRuntime();
        const allStationsKnown = normalizedDefinition.stationOptions.every((stationOption) => {
            if (!stationRuntime || typeof stationRuntime.getStationDefinition !== 'function') {
                return true;
            }

            return Boolean(stationRuntime.getStationDefinition(stationOption));
        });

        if (!allStationsKnown) {
            throw new Error(`[recipe-registry] Recipe "${normalizedDefinition.recipeId}" uses an unknown station.`);
        }

        const knownResourceIds = buildKnownResourceIdSet(options);
        const knownComponentIds = buildKnownComponentIdSet(options);
        normalizedDefinition.ingredients.forEach((ingredient) => {
            validateRecipeReference(normalizedDefinition, ingredient, knownResourceIds, knownComponentIds, 'ingredient');
        });
        validateRecipeReference(normalizedDefinition, normalizedDefinition.result, knownResourceIds, knownComponentIds, 'result');

        return normalizedDefinition;
    }

    function createValidatedRecipeRegistry(definitions, options = {}) {
        const normalizedDefinitions = [];
        const recipeById = Object.create(null);

        (Array.isArray(definitions) ? definitions : []).forEach((definition, index) => {
            const normalizedDefinition = validateRecipeDefinition(definition, {
                ...options,
                index
            });

            if (recipeById[normalizedDefinition.recipeId]) {
                const error = new Error(`[recipe-registry] Duplicate recipeId "${normalizedDefinition.recipeId}" detected.`);

                if (isDevMode(options)) {
                    throw error;
                }

                return;
            }

            recipeById[normalizedDefinition.recipeId] = normalizedDefinition;
            normalizedDefinitions.push(normalizedDefinition);
        });

        return {
            definitions: normalizedDefinitions.map((definition) => cloneValue(definition)),
            byId: Object.fromEntries(Object.entries(recipeById).map(([recipeId, definition]) => [
                recipeId,
                cloneValue(definition)
            ]))
        };
    }

    const recipeDefinitions = [
        {
            recipeId: 'fill-water-flask',
            label: 'Наполнить флягу',
            station: 'hand',
            stationLabel: 'Руки',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('environment', 'waterSource', 'Водоём', 1, { consumed: false }),
                createIngredient('itemState', 'waterFlaskEmpty', 'Пустая фляга', 1, {
                    gameplayItemId: 'waterFlask'
                })
            ],
            result: createResult('itemState', 'waterFlaskFull', 'Полная фляга', 1, {
                gameplayItemId: 'waterFlask'
            }),
            tags: ['base-conversion', 'water', 'survival', 'state-change'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 1, to: 30, priority: 'critical', note: 'Базовая вода нужна на всём маршруте.' }
            ]),
            notes: 'В документах вода существует как состояние фляги: пустая -> полная.'
        },
        {
            recipeId: 'grass-to-healing-base',
            label: 'Травяная база лечения',
            station: 'hand',
            stationLabel: 'Руки',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('resource', 'grass', 'Трава', 5)
            ],
            result: createResult('component', 'healingBase', 'Травяная база лечения', 1, {
                aliases: ['База лечения']
            }),
            tags: ['base-conversion', 'component', 'grass', 'healing'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 1, to: 12, priority: 'critical', note: 'Основа раннего лечения и лагерных отваров.' },
                { from: 19, to: 30, priority: 'recommended', note: 'Страховка для поздних тяжёлых серий.' }
            ]),
            notes: 'Базовый лечебный пакет из 5 единиц травы.'
        },
        {
            recipeId: 'grass-to-herbal-paste',
            label: 'Травяная паста',
            station: 'hand',
            stationLabel: 'Руки',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('resource', 'grass', 'Трава', 5)
            ],
            result: createResult('component', 'herbalPaste', 'Травяная паста', 1),
            tags: ['base-conversion', 'component', 'grass', 'energy'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 1, to: 12, priority: 'recommended', note: 'Поддерживает ранний темп и настои.' },
                { from: 16, to: 30, priority: 'critical', note: 'Нужна для усиленных рецептов и длинных маршрутов.' }
            ]),
            notes: 'Базовая энергетическая и алхимическая смесь.'
        },
        {
            recipeId: 'grass-to-rope',
            label: 'Верёвка из волокна',
            station: 'bench',
            stationLabel: 'Верстак',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('resource', 'grass', 'Трава', 10)
            ],
            result: createResult('component', 'rope', 'Верёвка', 1, {
                aliases: ['Верёвка из волокна'],
                gameplayItemId: 'rope'
            }),
            tags: ['base-conversion', 'component', 'grass', 'movement', 'construction'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 4, to: 6, priority: 'critical', note: 'Первое обязательное окно мостов.' },
                { from: 13, to: 18, priority: 'critical', note: 'Лодка и ремонт требуют запас верёвки.' },
                { from: 25, to: 27, priority: 'recommended', note: 'Полезна в поздней маршрутной утилите.' }
            ]),
            notes: 'Верстачная упаковка травы в ранний утилитарный компонент.'
        },
        {
            recipeId: 'stone-to-stone-block',
            label: 'Каменный блок',
            station: 'hand',
            stationLabel: 'Руки',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('resource', 'stone', 'Камень', 5)
            ],
            result: createResult('component', 'stoneBlock', 'Каменный блок', 1),
            tags: ['base-conversion', 'component', 'stone', 'construction'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 4, to: 15, priority: 'critical', note: 'Нужен для мостов и укрепления в середине игры.' },
                { from: 25, to: 27, priority: 'recommended', note: 'Подготовка тяжёлой поздней утилиты.' }
            ]),
            notes: 'Тяжёлый базовый строительный компонент.'
        },
        {
            recipeId: 'rubble-to-gravel-fill',
            label: 'Гравийная засыпка',
            station: 'hand',
            stationLabel: 'Руки',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('resource', 'rubble', 'Щебень', 5)
            ],
            result: createResult('component', 'gravelFill', 'Гравийная засыпка', 1, {
                aliases: ['Заполнитель']
            }),
            tags: ['base-conversion', 'component', 'rubble', 'repair'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 24, priority: 'critical', note: 'Опорный компонент для ремонта мостов и логистики.' }
            ]),
            notes: 'Уплотнённый ремонтный заполнитель из щебня.'
        },
        {
            recipeId: 'soil-clod-to-soil-resource',
            label: 'Земляной ресурс',
            station: 'hand',
            stationLabel: 'Руки',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('item', 'soilClod', 'Комья земли', 5)
            ],
            result: createResult('item', 'soilResource', 'Земляной ресурс', 1, {
                gameplayItemId: 'soilResource'
            }),
            tags: ['base-conversion', 'soil', 'legacy-compression'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 1, to: 30, priority: 'recommended', note: 'Совместимый пакет для плохих секторов и старых маршрутов.' }
            ]),
            notes: 'Переходный рецепт: земля не входит в базовую шестёрку craft-доков, но проходит через тот же compression layer.'
        },
        {
            recipeId: 'wood-to-board',
            label: 'Доска',
            station: 'hand',
            stationLabel: 'Руки',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('resource', 'wood', 'Дерево', 5)
            ],
            result: createResult('component', 'board', 'Доска', 1),
            tags: ['base-conversion', 'component', 'wood', 'construction'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 2, to: 18, priority: 'critical', note: 'Главный строительный пакет ранней и водной фаз.' },
                { from: 25, to: 27, priority: 'recommended', note: 'Нужна для поздней утилиты и аварийного ремонта.' }
            ]),
            notes: 'Базовая деревянная заготовка для мостов, лагеря и ремонта.'
        },
        {
            recipeId: 'wood-to-frame',
            label: 'Каркас',
            station: 'bench',
            stationLabel: 'Верстак',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('resource', 'wood', 'Дерево', 10)
            ],
            result: createResult('component', 'frame', 'Каркас', 1),
            tags: ['base-conversion', 'component', 'wood', 'heavy-assembly'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 13, to: 18, priority: 'critical', note: 'Нужен для лодочного цикла до водной фазы.' },
                { from: 25, to: 27, priority: 'recommended', note: 'Используется в поздней тяжёлой утилите.' }
            ]),
            notes: 'Крупный верстачный узел для лодки и тяжёлых сборок.'
        },
        {
            recipeId: 'wood-to-fuel-bundle',
            label: 'Топливная связка',
            station: 'hand',
            stationLabel: 'Руки',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('resource', 'wood', 'Дерево', 5)
            ],
            result: createResult('component', 'fuelBundle', 'Топливная связка', 1),
            tags: ['base-conversion', 'component', 'wood', 'camp', 'fuel'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 1, to: 18, priority: 'recommended', note: 'Поддерживает воду, пайки и базовую алхимию.' },
                { from: 19, to: 30, priority: 'situational', note: 'Нужна для отдельных усиленных лагерных рецептов.' }
            ]),
            notes: 'Универсальное топливо для лагерной кухни и варки.'
        },
        {
            recipeId: 'fish-to-fish-meat',
            label: 'Рыбное мясо',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('resource', 'fish', 'Рыба', 5)
            ],
            result: createResult('component', 'fishMeat', 'Рыбное мясо', 1),
            tags: ['base-conversion', 'component', 'fish', 'food', 'camp'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 21, priority: 'critical', note: 'Основной пищевой компонент длинных серий.' }
            ]),
            notes: 'Лагерная разделка улова в пищевой компонент.'
        },
        {
            recipeId: 'fish-to-fish-oil',
            label: 'Рыбий жир',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('resource', 'fish', 'Рыба', 10)
            ],
            result: createResult('component', 'fishOil', 'Рыбий жир', 1),
            tags: ['base-conversion', 'component', 'fish', 'oil', 'camp'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 16, to: 18, priority: 'critical', note: 'Обязателен для готовой лодки.' },
                { from: 25, to: 27, priority: 'recommended', note: 'Полезен в поздней логистике и утилите.' }
            ]),
            notes: 'Плотный лагерный компонент для лодки и поздних рецептов.'
        },
        {
            recipeId: 'healing-brew',
            label: 'Отвар лечения',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.survivalAndEnergy,
            ingredients: [
                createIngredient('itemState', 'waterFlaskFull', 'Полная фляга', 1, { gameplayItemId: 'waterFlask' }),
                createIngredient('component', 'healingBase', 'Травяная база лечения', 1)
            ],
            result: createResult('item', 'healingBrew', 'Отвар лечения', 1),
            tags: ['survival', 'healing', 'camp', 'consumable'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 1, to: 12, priority: 'critical', note: 'Критично на ранних островах.' }
            ]),
            notes: 'Базовый лагерный лечебный рецепт.'
        },
        {
            recipeId: 'energy-tonic',
            label: 'Энергетик',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.survivalAndEnergy,
            ingredients: [
                createIngredient('itemState', 'waterFlaskFull', 'Полная фляга', 1, { gameplayItemId: 'waterFlask' }),
                createIngredient('component', 'herbalPaste', 'Травяная паста', 1)
            ],
            result: createResult('item', 'energyTonic', 'Энергетик', 1),
            tags: ['survival', 'energy', 'camp', 'consumable'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 1, to: 18, priority: 'recommended', note: 'Нужен для длинных шаговых серий и темпа.' }
            ]),
            notes: 'Лёгкий ранний рецепт на движение и темп.'
        },
        {
            recipeId: 'dried-ration',
            label: 'Сухпаёк',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.survivalAndEnergy,
            ingredients: [
                createIngredient('component', 'fishMeat', 'Рыбное мясо', 1),
                createIngredient('component', 'fuelBundle', 'Топливная связка', 1)
            ],
            result: createResult('item', 'ration', 'Сухпаёк', 1, {
                gameplayItemId: 'ration'
            }),
            tags: ['survival', 'food', 'camp', 'ration'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 21, priority: 'recommended', note: 'Базовый рацион после открытия рыбалки.' }
            ]),
            notes: 'Самая простая лагерная еда на базе рыбы и топлива.'
        },
        {
            recipeId: 'hearty-ration',
            label: 'Сытный паёк',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.survivalAndEnergy,
            ingredients: [
                createIngredient('component', 'fishMeat', 'Рыбное мясо', 1),
                createIngredient('itemState', 'waterFlaskFull', 'Полная фляга', 1, { gameplayItemId: 'waterFlask' }),
                createIngredient('component', 'fuelBundle', 'Топливная связка', 1)
            ],
            result: createResult('item', 'heartyRation', 'Сытный паёк', 1),
            tags: ['survival', 'food', 'camp', 'ration'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 18, priority: 'critical', note: 'Нужен с 7 острова для длинных маршрутов.' }
            ]),
            notes: 'Усиленный рацион с водой для средней фазы.'
        },
        {
            recipeId: 'strong-broth',
            label: 'Крепкий бульон',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.survivalAndEnergy,
            ingredients: [
                createIngredient('component', 'fishMeat', 'Рыбное мясо', 2),
                createIngredient('itemState', 'waterFlaskFull', 'Полная фляга', 1, { gameplayItemId: 'waterFlask' }),
                createIngredient('component', 'herbalPaste', 'Травяная паста', 1),
                createIngredient('component', 'fuelBundle', 'Топливная связка', 1)
            ],
            result: createResult('item', 'strongBroth', 'Крепкий бульон', 1),
            tags: ['survival', 'food', 'healing', 'camp', 'advanced'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 16, to: 24, priority: 'critical', note: 'Пик восстановления после открытия водной фазы.' }
            ]),
            notes: 'Продвинутый лагерный рецепт на устойчивость и восстановление.'
        },
        {
            recipeId: 'second-wind',
            label: 'Второе дыхание',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.survivalAndEnergy,
            ingredients: [
                createIngredient('component', 'healingBase', 'Травяная база лечения', 1),
                createIngredient('component', 'herbalPaste', 'Травяная паста', 1),
                createIngredient('itemState', 'waterFlaskFull', 'Полная фляга', 1, { gameplayItemId: 'waterFlask' })
            ],
            result: createResult('item', 'secondWind', 'Второе дыхание', 1),
            tags: ['survival', 'movement', 'camp', 'advanced'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 10, to: 18, priority: 'critical', note: 'Снижает цену шагов в тяжёлой фазе.' },
                { from: 25, to: 27, priority: 'recommended', note: 'Полезная страховка в позднем маршруте.' }
            ]),
            notes: 'Рецепт на темп и снижение цены тяжёлого перемещения.'
        },
        {
            recipeId: 'portable-bridge',
            label: 'Переносной мост',
            station: 'bench',
            stationLabel: 'Верстак / мастерская',
            stationOptions: ['bench', 'workbench'],
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'board', 'Доска', 2),
                createIngredient('component', 'rope', 'Верёвка', 1, { gameplayItemId: 'rope' }),
                createIngredient('component', 'stoneBlock', 'Каменный блок', 1)
            ],
            result: createResult('item', 'portableBridge', 'Переносной мост', 1, {
                gameplayItemId: 'portableBridge'
            }),
            tags: ['construction', 'movement', 'bridge', 'utility'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 4, to: 6, priority: 'critical', note: 'Главное окно первого маршрутного барьера.' },
                { from: 7, to: 15, priority: 'recommended', note: 'Полезен как запас под разломы и обходы.' }
            ]),
            notes: 'Ключевой ранний предмет доступа к карте.'
        },
        {
            recipeId: 'bridge-repair-kit',
            label: 'Ремкомплект моста',
            station: 'workbench',
            stationLabel: 'Мастерская',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'board', 'Доска', 1),
                createIngredient('component', 'gravelFill', 'Гравийная засыпка', 1, {
                    aliases: ['Заполнитель']
                }),
                createIngredient('component', 'rope', 'Верёвка', 1, { gameplayItemId: 'rope' })
            ],
            result: createResult('item', 'bridgeRepairKit', 'Ремкомплект моста', 1),
            tags: ['construction', 'repair', 'bridge', 'utility'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 15, priority: 'critical', note: 'Нужен с 7 острова для повреждённых мостов.' },
                { from: 19, to: 24, priority: 'recommended', note: 'Поддерживает стабильную логистику.' }
            ]),
            notes: 'Стандартный ремонтный набор для переправ.'
        },
        {
            recipeId: 'boat-frame',
            label: 'Каркас лодки',
            station: 'workbench',
            stationLabel: 'Мастерская',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'frame', 'Каркас', 1),
                createIngredient('component', 'board', 'Доска', 2),
                createIngredient('component', 'rope', 'Верёвка', 2, { gameplayItemId: 'rope' })
            ],
            result: createResult('component', 'boatFrame', 'Рама лодки', 1, {
                aliases: ['Каркас лодки', 'Лодочный каркас']
            }),
            tags: ['construction', 'boat', 'component', 'water-access'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 13, to: 15, priority: 'critical', note: 'Нужно собрать до старта водной фазы.' }
            ]),
            notes: 'Промежуточный лодочный узел перед сборкой готовой лодки.'
        },
        {
            recipeId: 'boat',
            label: 'Готовая лодка',
            station: 'workbench',
            stationLabel: 'Мастерская',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'boatFrame', 'Рама лодки', 1, {
                    aliases: ['Каркас лодки']
                }),
                createIngredient('component', 'fishOil', 'Рыбий жир', 1),
                createIngredient('component', 'rope', 'Верёвка', 1, { gameplayItemId: 'rope' })
            ],
            result: createResult('structure', 'boat', 'Готовая лодка', 1),
            tags: ['construction', 'boat', 'water-access', 'structure'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 16, to: 18, priority: 'critical', note: 'Жёстко нужна к водной фазе.' }
            ]),
            notes: 'Главный предмет доступа к водным веткам и богатым маршрутам.'
        },
        {
            recipeId: 'boat-repair-kit',
            label: 'Ремкомплект лодки',
            station: 'workbench',
            stationLabel: 'Мастерская',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'board', 'Доска', 1),
                createIngredient('component', 'fishOil', 'Рыбий жир', 1),
                createIngredient('component', 'rope', 'Верёвка', 1, { gameplayItemId: 'rope' })
            ],
            result: createResult('item', 'boatRepairKit', 'Ремкомплект лодки', 1),
            tags: ['construction', 'repair', 'boat', 'utility'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 16, to: 30, priority: 'critical', note: 'После 16 острова нужен как постоянная страховка.' }
            ]),
            notes: 'Ремонтный комплект для поддержания лодки в рабочем состоянии.'
        },
        {
            recipeId: 'island-drill',
            label: 'Островная дрель',
            station: 'smithy',
            stationLabel: 'Кузница',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'stoneBlock', 'Каменный блок', 2),
                createIngredient('component', 'frame', 'Каркас', 1),
                createIngredient('material', 'metal', 'Металл', 1)
            ],
            result: createResult('item', 'islandDrill', 'Островная дрель', 1),
            tags: ['construction', 'utility', 'endgame', 'smithy'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 25, to: 27, priority: 'critical', note: 'Эндгейм-рецепт тяжёлой маршрутной утилиты.' }
            ]),
            notes: 'Поздний кузнечный рецепт на тяжёлый инструмент.'
        }
    ];

    const builtRecipeRegistry = createValidatedRecipeRegistry(recipeDefinitions, {
        devMode: isDevMode()
    });
    const recipes = builtRecipeRegistry.definitions;
    const recipeById = builtRecipeRegistry.byId;

    function getRecipeDefinition(recipeId) {
        return recipeById[recipeId] ? cloneValue(recipeById[recipeId]) : null;
    }

    function getRecipeDefinitions() {
        return recipes.map((recipe) => cloneValue(recipe));
    }

    function getRecipesByStation(station) {
        const normalizedStationId = normalizeStationId(station);

        return recipes
            .filter((recipe) => normalizeStationId(recipe.station) === normalizedStationId
                || (Array.isArray(recipe.stationOptions) && recipe.stationOptions.some((stationOption) => normalizeStationId(stationOption) === normalizedStationId)))
            .map((recipe) => cloneValue(recipe));
    }

    function getRecipesByTier(tier) {
        return recipes
            .filter((recipe) => recipe.tier === tier)
            .map((recipe) => cloneValue(recipe));
    }

    function getRecipesByTag(tag) {
        return recipes
            .filter((recipe) => Array.isArray(recipe.tags) && recipe.tags.includes(tag))
            .map((recipe) => cloneValue(recipe));
    }

    function getRecipesForIsland(islandNumber) {
        return recipes
            .filter((recipe) => {
                const windows = recipe
                    && recipe.islandNeedProfile
                    && Array.isArray(recipe.islandNeedProfile.windows)
                    ? recipe.islandNeedProfile.windows
                    : [];

                return windows.some((window) => islandNumber >= window.from && islandNumber <= window.to);
            })
            .map((recipe) => cloneValue(recipe));
    }

    function getRecipesByResultId(resultId) {
        return recipes
            .filter((recipe) => recipe.result && recipe.result.id === resultId)
            .map((recipe) => cloneValue(recipe));
    }

    Object.assign(recipeRegistry, {
        RECIPE_TIERS,
        recipes,
        createValidatedRecipeRegistry,
        getRecipeDefinition,
        getRecipeDefinitions,
        getRecipesByStation,
        getRecipesByTier,
        getRecipesByTag,
        getRecipesForIsland,
        getRecipesByResultId,
        normalizeRecipeDefinition,
        validateRecipeDefinition
    });
})();
