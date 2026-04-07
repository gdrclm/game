(() => {
    const game = window.Game;
    const componentRegistry = game.systems.componentRegistry = game.systems.componentRegistry || {};
    const COMPONENT_QUALITY_LEVELS = Object.freeze({
        ordinary: 'обычный',
        enhanced: 'усиленный',
        rare: 'редкий',
        stable: 'стабильный'
    });

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

    function normalizeInventoryCategories(categories) {
        if (typeof categories === 'string') {
            return categories.trim().replace(/\s+/g, ' ');
        }

        if (Array.isArray(categories)) {
            return categories
                .filter((category) => typeof category === 'string' && category.trim())
                .map((category) => category.trim())
                .join(' ');
        }

        return '';
    }

    function normalizeCraftMethod(craftMethod) {
        const stationRuntime = getStationRuntime();
        return stationRuntime && typeof stationRuntime.normalizeStationId === 'function'
            ? stationRuntime.normalizeStationId(craftMethod)
            : normalizeLookupValue(craftMethod);
    }

    function normalizeComponentQualityLevel(qualityLevel) {
        const normalizedQualityLevel = normalizeLookupValue(qualityLevel);
        return COMPONENT_QUALITY_LEVELS[normalizedQualityLevel]
            ? normalizedQualityLevel
            : '';
    }

    function normalizeBulkValue(bulk, fallback = 0) {
        const numericBulk = Number.isFinite(bulk) ? bulk : fallback;
        return Math.max(0, Math.floor(numericBulk));
    }

    function getComponentQualityLabel(qualityLevel) {
        return COMPONENT_QUALITY_LEVELS[normalizeComponentQualityLevel(qualityLevel)] || '';
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

    function normalizeComponentInventoryItem(definition = {}) {
        const inventoryItem = definition && typeof definition.inventoryItem === 'object'
            ? definition.inventoryItem
            : {};
        const fallbackItemId = Array.isArray(definition.currentInventoryItemIds) && typeof definition.currentInventoryItemIds[0] === 'string'
            ? definition.currentInventoryItemIds[0].trim()
            : '';

        return {
            id: typeof inventoryItem.id === 'string' && inventoryItem.id.trim()
                ? inventoryItem.id.trim()
                : fallbackItemId,
            icon: typeof inventoryItem.icon === 'string' ? inventoryItem.icon.trim() : '',
            lootTier: Number.isFinite(inventoryItem.lootTier) ? inventoryItem.lootTier : 0,
            categories: normalizeInventoryCategories(inventoryItem.categories),
            extra: inventoryItem.extra && typeof inventoryItem.extra === 'object'
                ? cloneValue(inventoryItem.extra)
                : {}
        };
    }

    function normalizeComponentDefinition(definition = {}) {
        const id = typeof definition.id === 'string' ? definition.id.trim() : '';
        const tags = [...new Set((Array.isArray(definition.tags) ? definition.tags : [])
            .map((tag) => normalizeLookupValue(tag))
            .filter(Boolean))];
        const ingredients = buildNormalizedIngredients(definition);
        const inventoryItem = normalizeComponentInventoryItem(definition);
        const qualityLevel = normalizeComponentQualityLevel(definition.qualityLevel);
        const bulk = normalizeBulkValue(
            definition.bulk,
            inventoryItem && inventoryItem.extra ? inventoryItem.extra.bulk : 0
        );
        const currentInventoryItemIds = [
            inventoryItem.id,
            ...(Array.isArray(definition.currentInventoryItemIds) ? definition.currentInventoryItemIds : [])
        ].filter((itemId, index, collection) => typeof itemId === 'string'
            && itemId.trim()
            && collection.findIndex((candidate) => normalizeLookupValue(candidate) === normalizeLookupValue(itemId)) === index)
            .map((itemId) => itemId.trim());

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
            qualityLevel,
            qualityLabel: getComponentQualityLabel(qualityLevel),
            bulk,
            currentInventoryItemIds,
            inventoryItem: {
                ...inventoryItem,
                id: currentInventoryItemIds[0] || inventoryItem.id,
                extra: {
                    ...(inventoryItem.extra && typeof inventoryItem.extra === 'object' ? inventoryItem.extra : {}),
                    bulk
                }
            },
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

    function normalizeGeneratedCraftingOutputDefinition(definition = {}) {
        const id = typeof definition.id === 'string' ? definition.id.trim() : '';
        const inventoryItem = normalizeComponentInventoryItem(definition);
        const bulk = normalizeBulkValue(
            definition.bulk,
            inventoryItem && inventoryItem.extra ? inventoryItem.extra.bulk : 0
        );

        return {
            ...cloneValue(definition),
            id,
            label: typeof definition.label === 'string' ? definition.label.trim() : '',
            aliases: (Array.isArray(definition.aliases) ? definition.aliases : [])
                .filter((alias) => typeof alias === 'string' && alias.trim())
                .map((alias) => alias.trim()),
            layer: typeof definition.layer === 'string' && definition.layer.trim()
                ? definition.layer.trim()
                : 'crafted-output',
            sourceRecipeIds: (Array.isArray(definition.sourceRecipeIds) ? definition.sourceRecipeIds : [])
                .filter((recipeId) => typeof recipeId === 'string' && recipeId.trim())
                .map((recipeId) => recipeId.trim()),
            tags: [...new Set((Array.isArray(definition.tags) ? definition.tags : [])
                .map((tag) => normalizeLookupValue(tag))
                .filter(Boolean))],
            bulk,
            inventoryItem: {
                ...inventoryItem,
                id: inventoryItem.id || id,
                extra: {
                    ...(inventoryItem.extra && typeof inventoryItem.extra === 'object' ? inventoryItem.extra : {}),
                    bulk
                }
            }
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

    function hasExplicitBulk(definition) {
        return Number.isFinite(definition && definition.bulk)
            || Boolean(definition
                && definition.inventoryItem
                && definition.inventoryItem.extra
                && Number.isFinite(definition.inventoryItem.extra.bulk));
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

        if (!normalizedDefinition.qualityLevel) {
            missingFields.push('qualityLevel');
        }

        if (!hasExplicitBulk(definition)) {
            missingFields.push('bulk');
        }

        if (!normalizedDefinition.inventoryItem || !normalizedDefinition.inventoryItem.id) {
            missingFields.push('inventoryItem.id');
        }

        if (!normalizedDefinition.inventoryItem || !normalizedDefinition.inventoryItem.icon) {
            missingFields.push('inventoryItem.icon');
        }

        if (!normalizedDefinition.inventoryItem || !normalizedDefinition.inventoryItem.categories) {
            missingFields.push('inventoryItem.categories');
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

    function validateGeneratedCraftingOutputDefinition(definition, options = {}) {
        const normalizedDefinition = normalizeGeneratedCraftingOutputDefinition(definition);
        const missingFields = [];

        if (!normalizedDefinition.id) {
            missingFields.push('id');
        }

        if (!normalizedDefinition.label) {
            missingFields.push('label');
        }

        if (!Array.isArray(normalizedDefinition.sourceRecipeIds) || normalizedDefinition.sourceRecipeIds.length === 0) {
            missingFields.push('sourceRecipeIds');
        }

        if (!normalizedDefinition.inventoryItem || !normalizedDefinition.inventoryItem.id) {
            missingFields.push('inventoryItem.id');
        }

        if (!normalizedDefinition.inventoryItem || !normalizedDefinition.inventoryItem.icon) {
            missingFields.push('inventoryItem.icon');
        }

        if (!normalizedDefinition.inventoryItem || !normalizedDefinition.inventoryItem.categories) {
            missingFields.push('inventoryItem.categories');
        }

        if (!hasExplicitBulk(definition)) {
            missingFields.push('bulk');
        }

        if (missingFields.length > 0) {
            const outputLabel = normalizedDefinition.id || `#${Number(options.index) + 1 || 1}`;
            throw new Error(`[component-registry] Crafted output "${outputLabel}" is missing required fields: ${missingFields.join(', ')}.`);
        }

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

    function createValidatedCraftingOutputRegistry(definitions, options = {}) {
        const normalizedDefinitions = [];
        const outputById = Object.create(null);
        const outputByLookupValue = Object.create(null);

        (Array.isArray(definitions) ? definitions : []).forEach((definition, index) => {
            const normalizedDefinition = validateGeneratedCraftingOutputDefinition(definition, {
                ...options,
                index
            });

            if (outputById[normalizedDefinition.id]) {
                const error = new Error(`[component-registry] Duplicate crafted output id "${normalizedDefinition.id}" detected.`);

                if (isDevMode(options)) {
                    throw error;
                }

                return;
            }

            outputById[normalizedDefinition.id] = normalizedDefinition;
            normalizedDefinitions.push(normalizedDefinition);

            [normalizedDefinition.id, normalizedDefinition.label, ...(normalizedDefinition.aliases || [])]
                .map((lookupValue) => normalizeLookupValue(lookupValue))
                .filter(Boolean)
                .forEach((lookupValue) => {
                    outputByLookupValue[lookupValue] = normalizedDefinition;
                });
        });

        return {
            definitions: normalizedDefinitions.map((definition) => cloneValue(definition)),
            byId: Object.fromEntries(Object.entries(outputById).map(([outputId, definition]) => [
                outputId,
                cloneValue(definition)
            ])),
            byLookupValue: Object.fromEntries(Object.entries(outputByLookupValue).map(([lookupValue, definition]) => [
                lookupValue,
                cloneValue(definition)
            ]))
        };
    }

    const componentDefinitions = [
        {
            id: 'healing_base',
            label: 'Травяная база лечения',
            aliases: ['База лечения', 'healingBase'],
            layer: 'component',
            tier: 1,
            qualityLevel: 'ordinary',
            bulk: 1,
            craftMethod: 'hand',
            craftMethodLabel: 'Руки',
            sourceResourceIds: ['grass', 'reeds'],
            resourceInputs: [{ resourceId: 'grass', quantity: 5 }],
            sourceSummary: 'Сжатая лечебная основа из травы или тростника.',
            baseConversion: ['5 травы -> 1 травяная база лечения', '5 тростника -> 1 травяная база лечения'],
            mainRole: 'Базовый лечебный компонент для раннего и среднего выживания.',
            usedInRecipes: ['Отвар лечения', 'Второе дыхание'],
            criticalWindows: ['Острова 1-12: стабилизация и лечение', 'Острова 19-30: запас под тяжёлые забеги'],
            currentInventoryItemIds: ['healing_base'],
            tags: ['healing'],
            inventoryItem: {
                id: 'healing_base',
                icon: 'HB',
                lootTier: 0,
                categories: 'component material survival',
                extra: {
                    stackable: true,
                    baseValue: 7,
                    description: 'Сжатая лечебная основа из пяти единиц травы.'
                }
            }
        },
        {
            id: 'herb_paste',
            label: 'Травяная паста',
            aliases: ['herbalPaste'],
            layer: 'component',
            tier: 1,
            qualityLevel: 'ordinary',
            bulk: 1,
            craftMethod: 'hand',
            craftMethodLabel: 'Руки',
            sourceResourceIds: ['grass'],
            resourceInputs: [{ resourceId: 'grass', quantity: 5 }],
            sourceSummary: 'Концентрированная травяная смесь для энергии и настоев.',
            baseConversion: ['5 травы -> 1 травяная паста'],
            mainRole: 'Поддерживает длинные маршруты, настои и усиленные рецепты восстановления.',
            usedInRecipes: ['Энергетик', 'Крепкий бульон', 'Второе дыхание'],
            criticalWindows: ['Острова 1-12: ранний темп', 'Острова 16+: усиленные рецепты и длинные маршруты'],
            currentInventoryItemIds: ['herb_paste'],
            tags: ['healing'],
            inventoryItem: {
                id: 'herb_paste',
                icon: 'TP',
                lootTier: 0,
                categories: 'component material survival',
                extra: {
                    stackable: true,
                    baseValue: 7,
                    description: 'Концентрированная травяная паста для настоев и восстановления.'
                }
            }
        },
        {
            id: 'fiber_rope',
            label: 'Верёвка',
            aliases: ['Верёвка из волокна', 'rope'],
            layer: 'component',
            tier: 1,
            qualityLevel: 'enhanced',
            bulk: 1,
            craftMethod: 'bench',
            craftMethodLabel: 'Верстак',
            sourceResourceIds: ['grass', 'reeds'],
            resourceInputs: [{ resourceId: 'grass', quantity: 10 }],
            sourceSummary: 'Полевой утилитарный компонент из травяного или тростникового волокна.',
            baseConversion: ['10 травы -> 1 верёвка', '10 тростника -> 1 верёвка'],
            mainRole: 'Открывает мосты, лодочные сборки, ремонт и раннюю маршрутную утилиту.',
            usedInRecipes: ['Переносной мост', 'Ремкомплект моста', 'Рама лодки', 'Готовая лодка', 'Ремкомплект лодки'],
            criticalWindows: ['Острова 4-6: первый маршрутный барьер', 'Острова 13-18: лодка и ремонт', 'Острова 25-27: эндгейм-логистика'],
            currentInventoryItemIds: ['fiber_rope'],
            tags: ['building', 'repair'],
            inventoryItem: {
                id: 'fiber_rope',
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
            }
        },
        {
            id: 'wood_plank_basic',
            label: 'Доска',
            aliases: ['board'],
            layer: 'component',
            tier: 1,
            qualityLevel: 'enhanced',
            bulk: 2,
            craftMethod: 'hand',
            craftMethodLabel: 'Руки',
            sourceResourceIds: ['wood'],
            resourceInputs: [{ resourceId: 'wood', quantity: 5 }],
            sourceSummary: 'Базовая деревянная заготовка для сборки и ремонта.',
            baseConversion: ['5 дерева -> 1 доска'],
            mainRole: 'Главный строительный пакет для мостов, мастерских и лодочного цикла.',
            usedInRecipes: ['Переносной мост', 'Ремкомплект моста', 'Рама лодки', 'Ремкомплект лодки'],
            criticalWindows: ['Острова 2-6: ранние переправы', 'Острова 13-18: лодка и ремонт', 'Острова 25-27: тяжёлая утилита'],
            currentInventoryItemIds: ['wood_plank_basic'],
            tags: ['building', 'repair'],
            inventoryItem: {
                id: 'wood_plank_basic',
                icon: 'BD',
                lootTier: 0,
                categories: 'component material building',
                extra: {
                    stackable: true,
                    baseValue: 9,
                    description: 'Сжатая деревянная заготовка для мостов, ремонта и лодочных узлов.'
                }
            }
        },
        {
            id: 'wood_frame_basic',
            label: 'Каркас',
            aliases: ['frame'],
            layer: 'component',
            tier: 1,
            qualityLevel: 'enhanced',
            bulk: 4,
            craftMethod: 'bench',
            craftMethodLabel: 'Верстак',
            sourceResourceIds: ['wood'],
            resourceInputs: [{ resourceId: 'wood', quantity: 10 }],
            sourceSummary: 'Крупная силовая заготовка для лодочных и тяжёлых сборок.',
            baseConversion: ['10 дерева -> 1 каркас'],
            mainRole: 'Опорный узел для лодки и тяжёлой поздней утилиты.',
            usedInRecipes: ['Рама лодки', 'Островная дрель'],
            criticalWindows: ['Острова 13-18: лодочный цикл', 'Острова 25-27: эндгейм-сборки'],
            currentInventoryItemIds: ['wood_frame_basic'],
            tags: ['building'],
            inventoryItem: {
                id: 'wood_frame_basic',
                icon: 'FR',
                lootTier: 0,
                categories: 'component material building',
                extra: {
                    stackable: true,
                    baseValue: 15,
                    description: 'Крупный силовой каркас для лодочных и тяжёлых сборок.'
                }
            }
        },
        {
            id: 'boatFrame',
            label: 'Рама лодки',
            aliases: ['Каркас лодки', 'Лодочный каркас'],
            layer: 'component',
            tier: 2,
            qualityLevel: 'rare',
            bulk: 6,
            craftMethod: 'workbench',
            craftMethodLabel: 'Мастерская',
            sourceResourceIds: ['wood', 'grass'],
            resourceInputs: [],
            componentInputs: [
                { componentId: 'wood_frame_basic', quantity: 1 },
                { componentId: 'wood_plank_basic', quantity: 2 },
                { componentId: 'fiber_rope', quantity: 2 }
            ],
            sourceSummary: 'Собранная заготовка корпуса перед выпуском готовой лодки.',
            baseConversion: ['Каркас + 2 доски + 2 верёвки -> 1 рама лодки'],
            mainRole: 'Промежуточный лодочный узел, который нужно подготовить до водной фазы.',
            usedInRecipes: ['Готовая лодка'],
            criticalWindows: ['Острова 13-15: подготовка лодочного цикла', 'Острова 16-18: обязательный доступ к воде'],
            currentInventoryItemIds: ['boatFrame'],
            tags: ['building'],
            inventoryItem: {
                id: 'boatFrame',
                icon: 'BF',
                lootTier: 0,
                categories: 'component material building',
                extra: {
                    stackable: true,
                    baseValue: 24,
                    description: 'Собранная рама лодки, готовая к финальной сборке.'
                }
            }
        },
        {
            id: 'gravel_fill',
            label: 'Гравийная засыпка',
            aliases: ['Заполнитель', 'gravelFill'],
            layer: 'component',
            tier: 1,
            qualityLevel: 'stable',
            bulk: 2,
            craftMethod: 'hand',
            craftMethodLabel: 'Руки',
            sourceResourceIds: ['rubble'],
            resourceInputs: [{ resourceId: 'rubble', quantity: 5 }],
            sourceSummary: 'Стабилизирующий заполнитель для ремонта повреждённых конструкций.',
            baseConversion: ['5 щебня -> 1 гравийная засыпка'],
            mainRole: 'Дешёвый стройкомпонент для восстановления мостов и стабилизации переходов.',
            usedInRecipes: ['Ремкомплект моста'],
            criticalWindows: ['Острова 7-15: ремонт и долгие маршруты', 'Острова 19-24: поддержание логистики'],
            currentInventoryItemIds: ['gravel_fill'],
            tags: ['repair', 'building'],
            inventoryItem: {
                id: 'gravel_fill',
                icon: 'GZ',
                lootTier: 0,
                categories: 'component material repair',
                extra: {
                    stackable: true,
                    baseValue: 8,
                    description: 'Уплотнённая гравийная засыпка для ремонта и стабилизации.'
                }
            }
        },
        {
            id: 'stone_block',
            label: 'Каменный блок',
            aliases: ['stoneBlock'],
            layer: 'component',
            tier: 1,
            qualityLevel: 'stable',
            bulk: 3,
            craftMethod: 'hand',
            craftMethodLabel: 'Руки',
            sourceResourceIds: ['stone'],
            resourceInputs: [{ resourceId: 'stone', quantity: 5 }],
            sourceSummary: 'Тяжёлый каменный пакет под строительство и позднюю утилиту.',
            baseConversion: ['5 камня -> 1 каменный блок'],
            mainRole: 'Несущая часть мостов, укреплений и эндгейм-инструментов.',
            usedInRecipes: ['Переносной мост', 'Островная дрель'],
            criticalWindows: ['Острова 4-15: мосты и укрепление', 'Острова 25-27: поздняя тяжёлая утилита'],
            currentInventoryItemIds: ['stone_block'],
            tags: ['building'],
            inventoryItem: {
                id: 'stone_block',
                icon: 'KB',
                lootTier: 0,
                categories: 'component material building',
                extra: {
                    stackable: true,
                    baseValue: 10,
                    description: 'Тяжёлый каменный блок для мостов, укреплений и тяжёлой утилиты.'
                }
            }
        },
        {
            id: 'fuel_bundle',
            label: 'Топливная связка',
            aliases: ['fuelBundle'],
            layer: 'component',
            tier: 1,
            qualityLevel: 'ordinary',
            bulk: 1,
            craftMethod: 'hand',
            craftMethodLabel: 'Руки',
            sourceResourceIds: ['wood'],
            resourceInputs: [{ resourceId: 'wood', quantity: 5 }],
            sourceSummary: 'Быстрая топливная упаковка для лагерной кухни и варки.',
            baseConversion: ['5 дерева -> 1 топливная связка'],
            mainRole: 'Поддерживает лагерные рецепты воды, еды и восстановления.',
            usedInRecipes: ['Сухпаёк', 'Сытный паёк', 'Крепкий бульон'],
            criticalWindows: ['Острова 1-18: лагерная кухня', 'Острова 19-30: усиленные лагерные рецепты'],
            currentInventoryItemIds: ['fuel_bundle'],
            tags: ['camp'],
            inventoryItem: {
                id: 'fuel_bundle',
                icon: 'TB',
                lootTier: 0,
                categories: 'component material survival',
                extra: {
                    stackable: true,
                    baseValue: 7,
                    description: 'Плотная топливная связка для лагерной кухни и варки.'
                }
            }
        },
        {
            id: 'fish_meat',
            label: 'Рыбное мясо',
            aliases: ['fishMeat'],
            layer: 'component',
            tier: 1,
            qualityLevel: 'ordinary',
            bulk: 1,
            craftMethod: 'camp',
            craftMethodLabel: 'Лагерь',
            sourceResourceIds: ['fish'],
            resourceInputs: [{ resourceId: 'fish', quantity: 5 }],
            sourceSummary: 'Пищевая заготовка из улова для лагерной кухни.',
            baseConversion: ['5 рыбы -> 1 рыбное мясо'],
            mainRole: 'Основной пищевой компонент для пайков и усиленного восстановления.',
            usedInRecipes: ['Сухпаёк', 'Сытный паёк', 'Крепкий бульон'],
            criticalWindows: ['Острова 7-12: базовая еда', 'Острова 16+: усиленные лагерные рецепты'],
            currentInventoryItemIds: ['fish_meat'],
            tags: ['food'],
            inventoryItem: {
                id: 'fish_meat',
                icon: 'FM',
                lootTier: 0,
                categories: 'component material food',
                extra: {
                    stackable: true,
                    baseValue: 8,
                    description: 'Подготовленное рыбное мясо для лагерных рецептов.'
                }
            }
        },
        {
            id: 'fish_oil',
            label: 'Рыбий жир',
            aliases: ['fishOil'],
            layer: 'component',
            tier: 1,
            qualityLevel: 'rare',
            bulk: 2,
            craftMethod: 'camp',
            craftMethodLabel: 'Лагерь',
            sourceResourceIds: ['fish'],
            resourceInputs: [{ resourceId: 'fish', quantity: 10 }],
            sourceSummary: 'Плотный жир для лодочного цикла, света, поздней утилиты и торговли.',
            baseConversion: ['10 рыбы -> 1 рыбий жир'],
            mainRole: 'Ключевой ресурс для лодки, фонарей, маяков, поздней логистики и выгодного обмена.',
            usedInRecipes: ['Готовая лодка', 'Ремкомплект лодки', 'Фонарь тумана', 'Маяк торговца'],
            criticalWindows: ['Острова 10-12: свет и туман', 'Острова 16-18: обязательная лодка', 'Острова 25-27: поздняя логистика и инструменты'],
            currentInventoryItemIds: ['fish_oil'],
            tags: ['building', 'utility', 'trade'],
            inventoryItem: {
                id: 'fish_oil',
                icon: 'FO',
                lootTier: 0,
                categories: 'component material building utility value',
                extra: {
                    stackable: true,
                    merchantWeight: 7,
                    merchantQuestWeight: 4,
                    baseValue: 14,
                    description: 'Плотный рыбий жир для лодки, фонарей, поздней утилиты и выгодной торговли.'
                }
            }
        }
    ];
    const generatedCraftingOutputDefinitions = [
        {
            id: 'healingBrew',
            label: 'Отвар лечения',
            bulk: 1,
            sourceRecipeIds: ['healing-brew'],
            tags: ['crafted', 'survival', 'healing'],
            inventoryItem: {
                id: 'healingBrew',
                icon: 'OL',
                lootTier: 2,
                categories: 'consumable survival',
                extra: {
                    stackable: true,
                    chestWeight: 0,
                    merchantWeight: 0,
                    baseValue: 12,
                    description: 'Лагерный лечебный отвар. Возвращает силы и помогает мягче пройти тяжёлый участок.',
                    consumable: { energy: 25, cold: 12, focus: 10 },
                    activeEffect: { kind: 'clearTravelPenalty' }
                }
            }
        },
        {
            id: 'energyTonic',
            label: 'Энергетик',
            bulk: 1,
            sourceRecipeIds: ['energy-tonic'],
            tags: ['crafted', 'survival', 'energy'],
            inventoryItem: {
                id: 'energyTonic',
                icon: 'ET',
                lootTier: 2,
                categories: 'consumable survival',
                extra: {
                    stackable: true,
                    chestWeight: 0,
                    merchantWeight: 0,
                    baseValue: 12,
                    description: 'Быстрый лагерный тоник для темпа и длинных серий ходов.',
                    consumable: { energy: 30, focus: 12 }
                }
            }
        },
        {
            id: 'heartyRation',
            label: 'Сытный паёк',
            bulk: 2,
            sourceRecipeIds: ['hearty-ration'],
            tags: ['crafted', 'survival', 'food'],
            inventoryItem: {
                id: 'heartyRation',
                icon: 'HP',
                lootTier: 2,
                categories: 'consumable survival food',
                extra: {
                    stackable: true,
                    chestWeight: 0,
                    merchantWeight: 0,
                    baseValue: 15,
                    description: 'Плотный лагерный паёк с водой и горячей обработкой. Хорошо держит темп длинного маршрута.',
                    consumable: { hunger: 100, energy: 40, focus: 8 }
                }
            }
        },
        {
            id: 'strongBroth',
            label: 'Крепкий бульон',
            bulk: 2,
            sourceRecipeIds: ['strong-broth'],
            tags: ['crafted', 'survival', 'food', 'advanced'],
            inventoryItem: {
                id: 'strongBroth',
                icon: 'KB',
                lootTier: 3,
                categories: 'consumable survival food',
                extra: {
                    stackable: true,
                    chestWeight: 0,
                    merchantWeight: 0,
                    baseValue: 18,
                    description: 'Густой лагерный бульон для тяжёлых отрезков. Сильно поддерживает восстановление.',
                    consumable: { hunger: 100, energy: 45, focus: 15, cold: 16 }
                }
            }
        },
        {
            id: 'fishBroth',
            label: 'Рыбный бульон',
            bulk: 2,
            sourceRecipeIds: ['fish-broth'],
            tags: ['crafted', 'survival', 'food', 'emergency'],
            inventoryItem: {
                id: 'fishBroth',
                icon: 'RB',
                lootTier: 2,
                categories: 'consumable survival food',
                extra: {
                    stackable: true,
                    chestWeight: 0,
                    merchantWeight: 0,
                    baseValue: 12,
                    description: 'Простой лагерный бульон из рыбы и кипячёной воды. Быстро закрывает аварийный голод на маршруте.',
                    consumable: { hunger: 80, energy: 22, focus: 5, cold: 8 }
                }
            }
        },
        {
            id: 'saltedFish',
            label: 'Солёная рыба',
            bulk: 1,
            sourceRecipeIds: ['salted-fish'],
            tags: ['crafted', 'survival', 'food', 'preserved'],
            inventoryItem: {
                id: 'saltedFish',
                icon: 'SR',
                lootTier: 2,
                categories: 'consumable survival food',
                extra: {
                    stackable: true,
                    chestWeight: 0,
                    merchantWeight: 0,
                    baseValue: 11,
                    description: 'Засоленный походный улов. Восстанавливает меньше, чем горячая еда, но спасает слот от порчи сырой рыбы.',
                    consumable: { hunger: 65, energy: 12, focus: 4 }
                }
            }
        },
        {
            id: 'secondWind',
            label: 'Второе дыхание',
            bulk: 1,
            sourceRecipeIds: ['second-wind'],
            tags: ['crafted', 'survival', 'movement', 'advanced'],
            inventoryItem: {
                id: 'secondWind',
                icon: 'VD',
                lootTier: 3,
                categories: 'consumable survival movement',
                extra: {
                    stackable: true,
                    chestWeight: 0,
                    merchantWeight: 0,
                    baseValue: 18,
                    description: 'Даёт всплеск темпа и удешевляет тяжёлое движение на несколько шагов.',
                    consumable: { energy: 18, focus: 12 },
                    activeEffect: { kind: 'travelBuff', discountMultiplier: 0.7, durationSteps: 8 }
                }
            }
        },
        {
            id: 'portableBridge',
            label: 'Переносной мост',
            bulk: 6,
            sourceRecipeIds: ['portable-bridge'],
            tags: ['crafted', 'tool', 'movement', 'bridge'],
            inventoryItem: {
                id: 'portableBridge',
                icon: 'PM',
                lootTier: 2,
                categories: 'tool utility movement',
                extra: {
                    chestWeight: 5,
                    merchantWeight: 6,
                    baseValue: 18,
                    description: 'Позволяет уложить одну клетку моста.',
                    activeEffect: { kind: 'bridgeBuilder', charges: 1 }
                }
            }
        },
        {
            id: 'fogLantern',
            label: 'Фонарь тумана',
            bulk: 2,
            sourceRecipeIds: ['fog-lantern'],
            tags: ['crafted', 'tool', 'info', 'light'],
            inventoryItem: {
                id: 'fogLantern',
                icon: 'FT',
                lootTier: 3,
                categories: 'tool utility info',
                extra: {
                    chestWeight: 3,
                    merchantWeight: 4,
                    baseValue: 24,
                    description: 'Масляный фонарь на рыбьем жире. Открывает карту вокруг героя на текущем острове.',
                    activeEffect: { kind: 'revealMap', mode: 'currentViewBoost' }
                }
            }
        },
        {
            id: 'merchantBeacon',
            label: 'Маяк торговца',
            bulk: 2,
            sourceRecipeIds: ['merchant-beacon'],
            tags: ['crafted', 'tool', 'info', 'trade'],
            inventoryItem: {
                id: 'merchantBeacon',
                icon: 'MT',
                lootTier: 3,
                categories: 'tool utility info',
                extra: {
                    chestWeight: 2,
                    merchantWeight: 4,
                    baseValue: 22,
                    description: 'Сигнальный маяк на рыбьем жире. Показывает координаты торговца текущего острова.',
                    activeEffect: { kind: 'revealMerchant' }
                }
            }
        },
        {
            id: 'soilResource',
            label: 'Земляной ресурс',
            bulk: 1,
            sourceRecipeIds: ['soil-clod-to-soil-resource'],
            tags: ['crafted', 'resource', 'material'],
            inventoryItem: {
                id: 'soilResource',
                icon: 'ZR',
                lootTier: 0,
                categories: 'resource material value',
                extra: {
                    stackable: true,
                    baseValue: 7,
                    merchantQuestWeight: 2,
                    description: 'Плотный земляной ресурс.'
                }
            }
        }
    ];

    const builtComponentRegistry = createValidatedComponentRegistry(componentDefinitions, {
        devMode: isDevMode()
    });
    const builtCraftingOutputRegistry = createValidatedCraftingOutputRegistry(generatedCraftingOutputDefinitions, {
        devMode: isDevMode()
    });
    const intermediateComponents = builtComponentRegistry.definitions;
    const componentById = builtComponentRegistry.byId;
    const componentByLookupValue = builtComponentRegistry.byLookupValue;
    const componentsByTag = builtComponentRegistry.byTag;
    const generatedCraftingOutputs = builtCraftingOutputRegistry.definitions;
    const generatedCraftingOutputById = builtCraftingOutputRegistry.byId;
    const generatedCraftingOutputByLookupValue = builtCraftingOutputRegistry.byLookupValue;
    const componentCatalogItems = intermediateComponents
        .filter((component) => component && component.inventoryItem && component.inventoryItem.id)
        .map((component) => ({
            id: component.inventoryItem.id,
            componentId: component.id,
            label: component.label,
            ...cloneValue(component.inventoryItem)
        }));
    const componentCatalogItemById = Object.fromEntries(componentCatalogItems.map((item) => [item.id, item]));
    const componentByInventoryItemId = Object.fromEntries(componentCatalogItems.map((item) => [item.id, cloneValue(componentById[item.componentId])]));
    const componentByInventoryItemLookupValue = Object.fromEntries(componentCatalogItems.map((item) => [
        normalizeLookupValue(item.id),
        cloneValue(componentById[item.componentId])
    ]));
    const generatedCraftingOutputCatalogItems = generatedCraftingOutputs
        .filter((output) => output && output.inventoryItem && output.inventoryItem.id)
        .map((output) => ({
            id: output.inventoryItem.id,
            craftingOutputId: output.id,
            label: output.label,
            sourceRecipeIds: cloneValue(output.sourceRecipeIds),
            ...cloneValue(output.inventoryItem)
        }));
    const generatedCraftingOutputCatalogItemById = Object.fromEntries(generatedCraftingOutputCatalogItems.map((item) => [item.id, item]));
    const generatedCraftingCatalogItems = [
        ...componentCatalogItems,
        ...generatedCraftingOutputCatalogItems
    ];

    if (isDevMode()) {
        const duplicateCatalogItemIds = generatedCraftingCatalogItems.reduce((duplicates, item, index, collection) => {
            const normalizedItemId = normalizeLookupValue(item && item.id);
            if (!normalizedItemId) {
                return duplicates;
            }

            const firstIndex = collection.findIndex((candidate) => normalizeLookupValue(candidate && candidate.id) === normalizedItemId);
            if (firstIndex !== index) {
                duplicates.add(item.id);
            }

            return duplicates;
        }, new Set());

        if (duplicateCatalogItemIds.size > 0) {
            throw new Error(`[component-registry] Duplicate generated catalog item ids detected: ${[...duplicateCatalogItemIds].join(', ')}.`);
        }
    }

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

    function getGeneratedCraftingOutputDefinition(outputIdOrLabel) {
        const output = generatedCraftingOutputById[outputIdOrLabel] || generatedCraftingOutputByLookupValue[normalizeLookupValue(outputIdOrLabel)];
        return output ? cloneValue(output) : null;
    }

    function getGeneratedCraftingOutputDefinitions() {
        return generatedCraftingOutputs.map((output) => cloneValue(output));
    }

    function getCatalogCraftingOutputItemDefinition(itemId) {
        return generatedCraftingOutputCatalogItemById[itemId] ? cloneValue(generatedCraftingOutputCatalogItemById[itemId]) : null;
    }

    function isGeneratedCraftingOutputItem(itemId) {
        return Boolean(getCatalogCraftingOutputItemDefinition(itemId));
    }

    function getComponentDefinitionByInventoryItemId(itemId) {
        const normalizedItemId = normalizeLookupValue(itemId);
        return componentByInventoryItemId[itemId] || componentByInventoryItemLookupValue[normalizedItemId]
            ? cloneValue(componentByInventoryItemId[itemId] || componentByInventoryItemLookupValue[normalizedItemId])
            : null;
    }

    function isComponentInventoryItem(itemId) {
        return Boolean(getComponentDefinitionByInventoryItemId(itemId));
    }

    function buildCatalogEntries(makeItem) {
        if (typeof makeItem !== 'function') {
            return [];
        }

        return generatedCraftingCatalogItems.map((definition) => makeItem(
            definition.id,
            definition.label,
            definition.icon,
            definition.lootTier,
            definition.categories,
            {
                componentId: definition.componentId,
                craftingOutputId: definition.craftingOutputId,
                qualityLevel: definition.componentId ? (componentById[definition.componentId] && componentById[definition.componentId].qualityLevel) || '' : '',
                qualityLabel: definition.componentId ? (componentById[definition.componentId] && componentById[definition.componentId].qualityLabel) || '' : '',
                sourceRecipeIds: cloneValue(definition.sourceRecipeIds),
                ...cloneValue(definition.extra)
            }
        ));
    }

    Object.assign(componentRegistry, {
        generatedCraftingOutputCatalogItems,
        generatedCraftingOutputs,
        intermediateComponents,
        componentCatalogItems,
        buildCatalogEntries,
        createValidatedComponentRegistry,
        createValidatedCraftingOutputRegistry,
        getCatalogComponentItemDefinition,
        getCatalogCraftingOutputItemDefinition,
        getComponentDefinition,
        getComponentDefinitionByInventoryItemId,
        getComponentDefinitions,
        getComponentQualityLabel,
        getComponentsByCraftMethod,
        getComponentsBySourceResource,
        getComponentsByTag,
        getGeneratedCraftingOutputDefinition,
        getGeneratedCraftingOutputDefinitions,
        isComponentInventoryItem,
        isGeneratedCraftingOutputItem,
        normalizeComponentQualityLevel,
        normalizeComponentDefinition,
        normalizeGeneratedCraftingOutputDefinition,
        normalizeCraftMethod,
        validateComponentDefinition,
        validateGeneratedCraftingOutputDefinition,
        COMPONENT_QUALITY_LEVELS
    });
})();
