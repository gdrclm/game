(() => {
    const game = window.Game;
    const componentRegistry = game.systems.componentRegistry = game.systems.componentRegistry || {};

    function getStationRuntime() {
        return game.systems.stationRuntime || null;
    }

    function getResourceRegistry() {
        return game.systems.resourceRegistry || null;
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

    function isDevMode(options = {}) {
        if (typeof options.devMode === 'boolean') {
            return options.devMode;
        }

        return Boolean(game.debug && game.debug.enabled);
    }

    function normalizeLookupValue(value) {
        return typeof value === 'string' ? value.trim().toLowerCase() : '';
    }

    function normalizeCraftMethod(craftMethod) {
        const stationRuntime = getStationRuntime();
        return stationRuntime && typeof stationRuntime.normalizeStationId === 'function'
            ? stationRuntime.normalizeStationId(craftMethod)
            : normalizeLookupValue(craftMethod);
    }

    function normalizeIngredientEntry(entry, kindKey, kind) {
        if (!entry) {
            return null;
        }

        const id = typeof entry[kindKey] === 'string' && entry[kindKey].trim()
            ? entry[kindKey].trim()
            : (typeof entry.id === 'string' ? entry.id.trim() : '');
        const quantity = Math.max(1, Number.isFinite(entry.quantity) ? entry.quantity : 1);

        if (!id) {
            return null;
        }

        return {
            kind,
            id,
            quantity,
            label: typeof entry.label === 'string' ? entry.label.trim() : ''
        };
    }

    function buildNormalizedIngredients(definition = {}) {
        const resourceIngredients = (Array.isArray(definition.resourceInputs) ? definition.resourceInputs : [])
            .map((entry) => normalizeIngredientEntry(entry, 'resourceId', 'resource'))
            .filter(Boolean);
        const componentIngredients = (Array.isArray(definition.componentInputs) ? definition.componentInputs : [])
            .map((entry) => normalizeIngredientEntry(entry, 'componentId', 'component'))
            .filter(Boolean);
        const externalIngredients = (Array.isArray(definition.externalInputs) ? definition.externalInputs : [])
            .map((entry) => ({
                kind: 'external',
                id: typeof entry.id === 'string' && entry.id.trim()
                    ? entry.id.trim()
                    : normalizeLookupValue(entry.label || 'external'),
                quantity: Math.max(1, Number.isFinite(entry.quantity) ? entry.quantity : 1),
                label: typeof entry.label === 'string' ? entry.label.trim() : ''
            }))
            .filter((entry) => entry.id);

        return [
            ...resourceIngredients,
            ...componentIngredients,
            ...externalIngredients
        ];
    }

    function buildSourceTags(definition = {}) {
        const tags = new Set();

        (Array.isArray(definition.sourceResourceIds) ? definition.sourceResourceIds : []).forEach((resourceId) => {
            const normalizedResourceId = normalizeLookupValue(resourceId);
            if (normalizedResourceId) {
                tags.add(normalizedResourceId);
            }
        });

        normalizeCraftMethod(definition.craftMethod) && tags.add(normalizeCraftMethod(definition.craftMethod));

        (Array.isArray(definition.tags) ? definition.tags : []).forEach((tag) => {
            const normalizedTag = normalizeLookupValue(tag);
            if (normalizedTag) {
                tags.add(normalizedTag);
            }
        });

        return [...tags];
    }

    function normalizeComponentDefinition(definition = {}) {
        const id = typeof definition.id === 'string' ? definition.id.trim() : '';
        const tags = [...new Set((Array.isArray(definition.tags) ? definition.tags : [])
            .map((tag) => normalizeLookupValue(tag))
            .filter(Boolean))];
        const ingredients = buildNormalizedIngredients(definition);

        return {
            ...cloneValue(definition),
            id,
            label: typeof definition.label === 'string' ? definition.label.trim() : '',
            aliases: (Array.isArray(definition.aliases) ? definition.aliases : [])
                .filter((alias) => typeof alias === 'string' && alias.trim())
                .map((alias) => alias.trim()),
            layer: typeof definition.layer === 'string' && definition.layer.trim()
                ? definition.layer.trim()
                : 'component',
            craftMethod: normalizeCraftMethod(definition.craftMethod),
            craftMethodLabel: typeof definition.craftMethodLabel === 'string' ? definition.craftMethodLabel.trim() : '',
            sourceResourceIds: (Array.isArray(definition.sourceResourceIds) ? definition.sourceResourceIds : [])
                .filter((resourceId) => typeof resourceId === 'string' && resourceId.trim())
                .map((resourceId) => resourceId.trim()),
            resourceInputs: (Array.isArray(definition.resourceInputs) ? definition.resourceInputs : [])
                .map((entry) => normalizeIngredientEntry(entry, 'resourceId', 'resource'))
                .filter(Boolean)
                .map((entry) => ({
                    resourceId: entry.id,
                    quantity: entry.quantity,
                    label: entry.label
                })),
            componentInputs: (Array.isArray(definition.componentInputs) ? definition.componentInputs : [])
                .map((entry) => normalizeIngredientEntry(entry, 'componentId', 'component'))
                .filter(Boolean)
                .map((entry) => ({
                    componentId: entry.id,
                    quantity: entry.quantity,
                    label: entry.label
                })),
            externalInputs: (Array.isArray(definition.externalInputs) ? definition.externalInputs : [])
                .filter(Boolean)
                .map((entry) => ({
                    id: typeof entry.id === 'string' ? entry.id.trim() : '',
                    label: typeof entry.label === 'string' ? entry.label.trim() : '',
                    quantity: Math.max(1, Number.isFinite(entry.quantity) ? entry.quantity : 1)
                })),
            currentInventoryItemIds: (Array.isArray(definition.currentInventoryItemIds) ? definition.currentInventoryItemIds : [])
                .filter((itemId) => typeof itemId === 'string' && itemId.trim())
                .map((itemId) => itemId.trim()),
            tags,
            ingredients,
            sourceTags: buildSourceTags({
                ...definition,
                id,
                craftMethod: normalizeCraftMethod(definition.craftMethod),
                tags
            })
        };
    }

    function buildKnownResourceIdSet(options = {}) {
        if (Array.isArray(options.resourceIds)) {
            return new Set(options.resourceIds.map((resourceId) => normalizeLookupValue(resourceId)).filter(Boolean));
        }

        const resourceRegistryRef = options.resourceRegistry || getResourceRegistry();
        const resourceDefinitions = resourceRegistryRef && typeof resourceRegistryRef.getBaseResourceDefinitions === 'function'
            ? resourceRegistryRef.getBaseResourceDefinitions()
            : [];

        return new Set(resourceDefinitions
            .map((resourceDefinition) => normalizeLookupValue(resourceDefinition && resourceDefinition.id))
            .filter(Boolean));
    }

    function validateComponentDefinition(definition, options = {}) {
        const normalizedDefinition = normalizeComponentDefinition(definition);
        const missingFields = [];

        if (!normalizedDefinition.id) {
            missingFields.push('id');
        }

        if (!normalizedDefinition.label) {
            missingFields.push('label');
        }

        if (!normalizedDefinition.craftMethod) {
            missingFields.push('craftMethod');
        }

        if (!Array.isArray(normalizedDefinition.ingredients) || normalizedDefinition.ingredients.length === 0) {
            missingFields.push('ingredients');
        }

        if (!Array.isArray(normalizedDefinition.sourceTags) || normalizedDefinition.sourceTags.length === 0) {
            missingFields.push('sourceTags');
        }

        if (missingFields.length > 0) {
            const componentLabel = normalizedDefinition.id || `#${Number(options.index) + 1 || 1}`;
            throw new Error(`[component-registry] Component "${componentLabel}" is missing required fields: ${missingFields.join(', ')}.`);
        }

        const knownResourceIds = buildKnownResourceIdSet(options);
        normalizedDefinition.sourceResourceIds.forEach((resourceId) => {
            if (!knownResourceIds.has(normalizeLookupValue(resourceId))) {
                throw new Error(`[component-registry] Component "${normalizedDefinition.id}" references unknown raw resource "${resourceId}".`);
            }
        });
        normalizedDefinition.resourceInputs.forEach((entry) => {
            if (!knownResourceIds.has(normalizeLookupValue(entry.resourceId))) {
                throw new Error(`[component-registry] Component "${normalizedDefinition.id}" has unknown resource ingredient "${entry.resourceId}".`);
            }
        });

        return normalizedDefinition;
    }

    function createValidatedComponentRegistry(definitions, options = {}) {
        const normalizedDefinitions = [];
        const componentById = Object.create(null);
        const componentByLookupValue = Object.create(null);
        const componentsByTag = Object.create(null);

        (Array.isArray(definitions) ? definitions : []).forEach((definition, index) => {
            const normalizedDefinition = validateComponentDefinition(definition, {
                ...options,
                index
            });

            if (componentById[normalizedDefinition.id]) {
                const error = new Error(`[component-registry] Duplicate component id "${normalizedDefinition.id}" detected.`);

                if (isDevMode(options)) {
                    throw error;
                }

                return;
            }

            componentById[normalizedDefinition.id] = normalizedDefinition;
            normalizedDefinitions.push(normalizedDefinition);

            [normalizedDefinition.id, normalizedDefinition.label, ...(normalizedDefinition.aliases || [])]
                .map((lookupValue) => normalizeLookupValue(lookupValue))
                .filter(Boolean)
                .forEach((lookupValue) => {
                    componentByLookupValue[lookupValue] = normalizedDefinition;
                });

            [...new Set([...(normalizedDefinition.tags || []), ...(normalizedDefinition.sourceTags || [])])]
                .forEach((tag) => {
                    componentsByTag[tag] = componentsByTag[tag] || [];
                    componentsByTag[tag].push(normalizedDefinition);
                });
        });

        return {
            definitions: normalizedDefinitions.map((definition) => cloneValue(definition)),
            byId: Object.fromEntries(Object.entries(componentById).map(([componentId, definition]) => [
                componentId,
                cloneValue(definition)
            ])),
            byLookupValue: Object.fromEntries(Object.entries(componentByLookupValue).map(([lookupValue, definition]) => [
                lookupValue,
                cloneValue(definition)
            ])),
            byTag: Object.fromEntries(Object.entries(componentsByTag).map(([tag, definitionsByTag]) => [
                tag,
                definitionsByTag.map((definition) => cloneValue(definition))
            ]))
        };
    }

    const componentDefinitions = [
        {
            id: 'healingBase',
            label: 'Травяная база лечения',
            aliases: ['База лечения'],
            layer: 'component',
            tier: 1,
            craftMethod: 'hand',
            craftMethodLabel: 'Руки',
            sourceResourceIds: ['grass'],
            resourceInputs: [{ resourceId: 'grass', quantity: 5 }],
            sourceSummary: 'Сжатая лечебная основа из травы.',
            baseConversion: ['5 травы -> 1 травяная база лечения'],
            mainRole: 'Базовый лечебный компонент для раннего и среднего выживания.',
            usedInRecipes: ['Отвар лечения', 'Второе дыхание'],
            criticalWindows: ['Острова 1-12: стабилизация и лечение', 'Острова 19-30: запас под тяжёлые забеги'],
            currentInventoryItemIds: ['healingBase'],
            tags: ['healing']
        },
        {
            id: 'herbalPaste',
            label: 'Травяная паста',
            aliases: [],
            layer: 'component',
            tier: 1,
            craftMethod: 'hand',
            craftMethodLabel: 'Руки',
            sourceResourceIds: ['grass'],
            resourceInputs: [{ resourceId: 'grass', quantity: 5 }],
            sourceSummary: 'Концентрированная травяная смесь для энергии и настоев.',
            baseConversion: ['5 травы -> 1 травяная паста'],
            mainRole: 'Поддерживает длинные маршруты, настои и усиленные рецепты восстановления.',
            usedInRecipes: ['Энергетик', 'Крепкий бульон', 'Второе дыхание'],
            criticalWindows: ['Острова 1-12: ранний темп', 'Острова 16+: усиленные рецепты и длинные маршруты'],
            currentInventoryItemIds: ['herbalPaste'],
            tags: ['healing']
        },
        {
            id: 'rope',
            label: 'Верёвка',
            aliases: ['Верёвка из волокна'],
            layer: 'component',
            tier: 1,
            craftMethod: 'bench',
            craftMethodLabel: 'Верстак',
            sourceResourceIds: ['grass'],
            resourceInputs: [{ resourceId: 'grass', quantity: 10 }],
            sourceSummary: 'Полевой утилитарный компонент из травяного волокна.',
            baseConversion: ['10 травы -> 1 верёвка'],
            mainRole: 'Открывает мосты, лодочные сборки, ремонт и раннюю маршрутную утилиту.',
            usedInRecipes: ['Переносной мост', 'Ремкомплект моста', 'Рама лодки', 'Готовая лодка', 'Ремкомплект лодки'],
            criticalWindows: ['Острова 4-6: первый маршрутный барьер', 'Острова 13-18: лодка и ремонт', 'Острова 25-27: эндгейм-логистика'],
            currentInventoryItemIds: ['rope'],
            tags: ['building', 'repair']
        },
        {
            id: 'board',
            label: 'Доска',
            aliases: [],
            layer: 'component',
            tier: 1,
            craftMethod: 'hand',
            craftMethodLabel: 'Руки',
            sourceResourceIds: ['wood'],
            resourceInputs: [{ resourceId: 'wood', quantity: 5 }],
            sourceSummary: 'Базовая деревянная заготовка для сборки и ремонта.',
            baseConversion: ['5 дерева -> 1 доска'],
            mainRole: 'Главный строительный пакет для мостов, мастерских и лодочного цикла.',
            usedInRecipes: ['Переносной мост', 'Ремкомплект моста', 'Рама лодки', 'Ремкомплект лодки'],
            criticalWindows: ['Острова 2-6: ранние переправы', 'Острова 13-18: лодка и ремонт', 'Острова 25-27: тяжёлая утилита'],
            currentInventoryItemIds: ['board'],
            tags: ['building', 'repair']
        },
        {
            id: 'frame',
            label: 'Каркас',
            aliases: [],
            layer: 'component',
            tier: 1,
            craftMethod: 'bench',
            craftMethodLabel: 'Верстак',
            sourceResourceIds: ['wood'],
            resourceInputs: [{ resourceId: 'wood', quantity: 10 }],
            sourceSummary: 'Крупная силовая заготовка для лодочных и тяжёлых сборок.',
            baseConversion: ['10 дерева -> 1 каркас'],
            mainRole: 'Опорный узел для лодки и тяжёлой поздней утилиты.',
            usedInRecipes: ['Рама лодки', 'Островная дрель'],
            criticalWindows: ['Острова 13-18: лодочный цикл', 'Острова 25-27: эндгейм-сборки'],
            currentInventoryItemIds: ['frame'],
            tags: ['building']
        },
        {
            id: 'boatFrame',
            label: 'Рама лодки',
            aliases: ['Каркас лодки', 'Лодочный каркас'],
            layer: 'component',
            tier: 2,
            craftMethod: 'workbench',
            craftMethodLabel: 'Мастерская',
            sourceResourceIds: ['wood', 'grass'],
            resourceInputs: [],
            componentInputs: [
                { componentId: 'frame', quantity: 1 },
                { componentId: 'board', quantity: 2 },
                { componentId: 'rope', quantity: 2 }
            ],
            sourceSummary: 'Собранная заготовка корпуса перед выпуском готовой лодки.',
            baseConversion: ['Каркас + 2 доски + 2 верёвки -> 1 рама лодки'],
            mainRole: 'Промежуточный лодочный узел, который нужно подготовить до водной фазы.',
            usedInRecipes: ['Готовая лодка'],
            criticalWindows: ['Острова 13-15: подготовка лодочного цикла', 'Острова 16-18: обязательный доступ к воде'],
            currentInventoryItemIds: ['boatFrame'],
            tags: ['building']
        },
        {
            id: 'gravelFill',
            label: 'Гравийная засыпка',
            aliases: ['Заполнитель'],
            layer: 'component',
            tier: 1,
            craftMethod: 'hand',
            craftMethodLabel: 'Руки',
            sourceResourceIds: ['rubble'],
            resourceInputs: [{ resourceId: 'rubble', quantity: 5 }],
            sourceSummary: 'Стабилизирующий заполнитель для ремонта повреждённых конструкций.',
            baseConversion: ['5 щебня -> 1 гравийная засыпка'],
            mainRole: 'Дешёвый стройкомпонент для восстановления мостов и стабилизации переходов.',
            usedInRecipes: ['Ремкомплект моста'],
            criticalWindows: ['Острова 7-15: ремонт и долгие маршруты', 'Острова 19-24: поддержание логистики'],
            currentInventoryItemIds: ['gravelFill'],
            tags: ['repair', 'building']
        },
        {
            id: 'stoneBlock',
            label: 'Каменный блок',
            aliases: [],
            layer: 'component',
            tier: 1,
            craftMethod: 'hand',
            craftMethodLabel: 'Руки',
            sourceResourceIds: ['stone'],
            resourceInputs: [{ resourceId: 'stone', quantity: 5 }],
            sourceSummary: 'Тяжёлый каменный пакет под строительство и позднюю утилиту.',
            baseConversion: ['5 камня -> 1 каменный блок'],
            mainRole: 'Несущая часть мостов, укреплений и эндгейм-инструментов.',
            usedInRecipes: ['Переносной мост', 'Островная дрель'],
            criticalWindows: ['Острова 4-15: мосты и укрепление', 'Острова 25-27: поздняя тяжёлая утилита'],
            currentInventoryItemIds: ['stoneBlock'],
            tags: ['building']
        },
        {
            id: 'fuelBundle',
            label: 'Топливная связка',
            aliases: [],
            layer: 'component',
            tier: 1,
            craftMethod: 'hand',
            craftMethodLabel: 'Руки',
            sourceResourceIds: ['wood'],
            resourceInputs: [{ resourceId: 'wood', quantity: 5 }],
            sourceSummary: 'Быстрая топливная упаковка для лагерной кухни и варки.',
            baseConversion: ['5 дерева -> 1 топливная связка'],
            mainRole: 'Поддерживает лагерные рецепты воды, еды и восстановления.',
            usedInRecipes: ['Сухпаёк', 'Сытный паёк', 'Крепкий бульон'],
            criticalWindows: ['Острова 1-18: лагерная кухня', 'Острова 19-30: усиленные лагерные рецепты'],
            currentInventoryItemIds: ['fuelBundle'],
            tags: ['camp']
        },
        {
            id: 'fishMeat',
            label: 'Рыбное мясо',
            aliases: [],
            layer: 'component',
            tier: 1,
            craftMethod: 'camp',
            craftMethodLabel: 'Лагерь',
            sourceResourceIds: ['fish'],
            resourceInputs: [{ resourceId: 'fish', quantity: 5 }],
            sourceSummary: 'Пищевая заготовка из улова для лагерной кухни.',
            baseConversion: ['5 рыбы -> 1 рыбное мясо'],
            mainRole: 'Основной пищевой компонент для пайков и усиленного восстановления.',
            usedInRecipes: ['Сухпаёк', 'Сытный паёк', 'Крепкий бульон'],
            criticalWindows: ['Острова 7-12: базовая еда', 'Острова 16+: усиленные лагерные рецепты'],
            currentInventoryItemIds: ['fishMeat'],
            tags: ['food']
        },
        {
            id: 'fishOil',
            label: 'Рыбий жир',
            aliases: [],
            layer: 'component',
            tier: 1,
            craftMethod: 'camp',
            craftMethodLabel: 'Лагерь',
            sourceResourceIds: ['fish'],
            resourceInputs: [{ resourceId: 'fish', quantity: 10 }],
            sourceSummary: 'Плотный жир для лодочного цикла, света и поздней утилиты.',
            baseConversion: ['10 рыбы -> 1 рыбий жир'],
            mainRole: 'Ключевой ресурс водной фазы и части поздних рецептов.',
            usedInRecipes: ['Готовая лодка', 'Ремкомплект лодки'],
            criticalWindows: ['Острова 16-18: обязательная лодка', 'Острова 25-27: поздняя логистика и инструменты'],
            currentInventoryItemIds: ['fishOil'],
            tags: ['building']
        }
    ];

    const builtComponentRegistry = createValidatedComponentRegistry(componentDefinitions, {
        devMode: isDevMode()
    });
    const intermediateComponents = builtComponentRegistry.definitions;
    const componentById = builtComponentRegistry.byId;
    const componentByLookupValue = builtComponentRegistry.byLookupValue;
    const componentsByTag = builtComponentRegistry.byTag;
    const componentCatalogItemPresets = Object.freeze({
        healingBase: {
            icon: 'HB',
            lootTier: 0,
            categories: 'component material survival',
            extra: {
                stackable: true,
                baseValue: 7,
                description: 'Сжатая лечебная основа из пяти единиц травы.'
            }
        },
        herbalPaste: {
            icon: 'TP',
            lootTier: 0,
            categories: 'component material survival',
            extra: {
                stackable: true,
                baseValue: 7,
                description: 'Концентрированная травяная паста для настоев и восстановления.'
            }
        },
        rope: {
            icon: 'VR',
            lootTier: 1,
            categories: 'tool utility component',
            extra: {
                stackable: true,
                chestWeight: 6,
                merchantWeight: 8,
                merchantQuestWeight: 5,
                baseValue: 11,
                description: 'Прочный волокнистый компонент для мостов, лодки и ремонта.'
            }
        },
        board: {
            icon: 'BD',
            lootTier: 0,
            categories: 'component material building',
            extra: {
                stackable: true,
                baseValue: 9,
                description: 'Сжатая деревянная заготовка для мостов, ремонта и лодочных узлов.'
            }
        },
        frame: {
            icon: 'FR',
            lootTier: 0,
            categories: 'component material building',
            extra: {
                stackable: true,
                baseValue: 15,
                description: 'Крупный силовой каркас для лодочных и тяжёлых сборок.'
            }
        },
        boatFrame: {
            icon: 'BF',
            lootTier: 0,
            categories: 'component material building',
            extra: {
                stackable: true,
                baseValue: 24,
                description: 'Собранная рама лодки, готовая к финальной сборке.'
            }
        },
        gravelFill: {
            icon: 'GZ',
            lootTier: 0,
            categories: 'component material repair',
            extra: {
                stackable: true,
                baseValue: 8,
                description: 'Уплотнённая гравийная засыпка для ремонта и стабилизации.'
            }
        },
        stoneBlock: {
            icon: 'KB',
            lootTier: 0,
            categories: 'component material building',
            extra: {
                stackable: true,
                baseValue: 10,
                description: 'Тяжёлый каменный блок для мостов, укреплений и тяжёлой утилиты.'
            }
        },
        fuelBundle: {
            icon: 'TB',
            lootTier: 0,
            categories: 'component material survival',
            extra: {
                stackable: true,
                baseValue: 7,
                description: 'Плотная топливная связка для лагерной кухни и варки.'
            }
        },
        fishMeat: {
            icon: 'FM',
            lootTier: 0,
            categories: 'component material food',
            extra: {
                stackable: true,
                baseValue: 8,
                description: 'Подготовленное рыбное мясо для лагерных рецептов.'
            }
        },
        fishOil: {
            icon: 'FO',
            lootTier: 0,
            categories: 'component material building',
            extra: {
                stackable: true,
                baseValue: 12,
                description: 'Плотный рыбий жир для лодочных и поздних рецептов.'
            }
        }
    });
    const componentCatalogItems = intermediateComponents
        .filter((component) => componentCatalogItemPresets[component.id])
        .map((component) => ({
            id: component.currentInventoryItemIds[0] || component.id,
            componentId: component.id,
            label: component.label,
            ...cloneValue(componentCatalogItemPresets[component.id])
        }));
    const componentCatalogItemById = Object.fromEntries(componentCatalogItems.map((item) => [item.id, item]));

    function getComponentDefinition(componentIdOrLabel) {
        const component = componentById[componentIdOrLabel] || componentByLookupValue[normalizeLookupValue(componentIdOrLabel)];
        return component ? cloneValue(component) : null;
    }

    function getComponentDefinitions() {
        return intermediateComponents.map((component) => cloneValue(component));
    }

    function getComponentsBySourceResource(resourceId) {
        return intermediateComponents
            .filter((component) => Array.isArray(component.sourceResourceIds)
                && component.sourceResourceIds.includes(resourceId))
            .map((component) => cloneValue(component));
    }

    function getComponentsByCraftMethod(craftMethod) {
        const normalizedCraftMethod = normalizeCraftMethod(craftMethod);

        return intermediateComponents
            .filter((component) => normalizeCraftMethod(component.craftMethod) === normalizedCraftMethod)
            .map((component) => cloneValue(component));
    }

    function getComponentsByTag(tag) {
        return (componentsByTag[normalizeLookupValue(tag)] || []).map((component) => cloneValue(component));
    }

    function getCatalogComponentItemDefinition(itemId) {
        return componentCatalogItemById[itemId] ? cloneValue(componentCatalogItemById[itemId]) : null;
    }

    function buildCatalogEntries(makeItem) {
        if (typeof makeItem !== 'function') {
            return [];
        }

        return componentCatalogItems.map((definition) => makeItem(
            definition.id,
            definition.label,
            definition.icon,
            definition.lootTier,
            definition.categories,
            {
                componentId: definition.componentId,
                ...cloneValue(definition.extra)
            }
        ));
    }

    Object.assign(componentRegistry, {
        intermediateComponents,
        componentCatalogItems,
        buildCatalogEntries,
        createValidatedComponentRegistry,
        getCatalogComponentItemDefinition,
        getComponentDefinition,
        getComponentDefinitions,
        getComponentsByCraftMethod,
        getComponentsBySourceResource,
        getComponentsByTag,
        normalizeComponentDefinition,
        normalizeCraftMethod,
        validateComponentDefinition
    });
})();
