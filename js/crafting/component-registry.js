(() => {
    const game = window.Game;
    const componentRegistry = game.systems.componentRegistry = game.systems.componentRegistry || {};
    const COMPONENT_QUALITY_LEVELS = Object.freeze({
        ordinary: 'обычный',
        enhanced: 'усиленный',
        rare: 'редкий',
        stable: 'стабильный'
    });
    const COMPONENT_CRAFTING_TAGS = Object.freeze({
        healing: 'healing',
        building: 'building',
        repair: 'repair',
        water: 'water',
        route: 'route',
        survival: 'survival',
        merchant: 'merchant',
        bagquest: 'bagQuest'
    });
    const KNOWN_MERCHANT_INTERESTS = Object.freeze({
        merchant: 'merchant',
        fisherman: 'fisherman',
        bridgewright: 'bridgewright',
        junkdealer: 'junkDealer',
        storyteller: 'storyteller',
        exchanger: 'exchanger',
        quartermaster: 'quartermaster',
        collector: 'collector'
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

    function normalizeComponentTags(tags) {
        const tagList = Array.isArray(tags)
            ? tags
            : (typeof tags === 'string' ? tags.split(/\s+/g) : []);

        return [...new Set(tagList
            .map((tag) => COMPONENT_CRAFTING_TAGS[normalizeLookupValue(tag)] || '')
            .filter(Boolean))];
    }

    function getUnknownComponentTags(tags) {
        const tagList = Array.isArray(tags)
            ? tags
            : (typeof tags === 'string' ? tags.split(/\s+/g) : []);

        return [...new Set(tagList
            .map((tag) => String(tag || '').trim())
            .filter(Boolean)
            .filter((tag) => !COMPONENT_CRAFTING_TAGS[normalizeLookupValue(tag)]))];
    }

    function normalizeMerchantInterest(merchantInterest) {
        const interestList = Array.isArray(merchantInterest)
            ? merchantInterest
            : (typeof merchantInterest === 'string' ? merchantInterest.split(/\s+/g) : []);

        return [...new Set(interestList
            .map((role) => KNOWN_MERCHANT_INTERESTS[normalizeLookupValue(role)] || '')
            .filter(Boolean))];
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
        const tags = normalizeComponentTags(definition.tags);
        const ingredients = buildNormalizedIngredients(definition);
        const inventoryItem = normalizeComponentInventoryItem(definition);
        const qualityLevel = normalizeComponentQualityLevel(definition.qualityLevel);
        const merchantInterest = normalizeMerchantInterest(
            definition.merchantInterest
            || (inventoryItem && inventoryItem.extra ? inventoryItem.extra.merchantInterest : [])
        );
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
            merchantInterest,
            bulk,
            currentInventoryItemIds,
            inventoryItem: {
                ...inventoryItem,
                id: currentInventoryItemIds[0] || inventoryItem.id,
                extra: {
                    ...(inventoryItem.extra && typeof inventoryItem.extra === 'object' ? inventoryItem.extra : {}),
                    merchantInterest: cloneValue(merchantInterest),
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
        const merchantInterest = normalizeMerchantInterest(
            definition.merchantInterest
            || (inventoryItem && inventoryItem.extra ? inventoryItem.extra.merchantInterest : [])
        );
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
            merchantInterest,
            bulk,
            inventoryItem: {
                ...inventoryItem,
                id: inventoryItem.id || id,
                extra: {
                    ...(inventoryItem.extra && typeof inventoryItem.extra === 'object' ? inventoryItem.extra : {}),
                    merchantInterest: cloneValue(merchantInterest),
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

        if (!Array.isArray(normalizedDefinition.merchantInterest) || normalizedDefinition.merchantInterest.length === 0) {
            missingFields.push('merchantInterest');
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
        const unknownTags = getUnknownComponentTags(definition.tags);

        if (unknownTags.length > 0) {
            throw new Error(`[component-registry] Component "${normalizedDefinition.id}" contains unknown crafting tags: ${unknownTags.join(', ')}.`);
        }

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
            tags: ['healing', 'survival', 'bagQuest'],
            merchantInterest: ['merchant', 'quartermaster'],
            inventoryItem: {
                id: 'healing_base',
                icon: 'HB',
                lootTier: 0,
                categories: 'component material survival',
                extra: {
                    stackable: true,
                    merchantWeight: 2,
                    merchantQuestWeight: 2,
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
            tags: ['healing', 'survival', 'route'],
            merchantInterest: ['merchant', 'quartermaster'],
            inventoryItem: {
                id: 'herb_paste',
                icon: 'TP',
                lootTier: 0,
                categories: 'component material survival',
                extra: {
                    stackable: true,
                    merchantWeight: 2,
                    merchantQuestWeight: 1,
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
            tags: ['building', 'repair', 'route', 'merchant', 'bagQuest'],
            merchantInterest: ['bridgewright', 'quartermaster', 'junkDealer'],
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
            tags: ['building', 'repair', 'route', 'merchant', 'bagQuest'],
            merchantInterest: ['bridgewright', 'quartermaster'],
            inventoryItem: {
                id: 'wood_plank_basic',
                icon: 'BD',
                lootTier: 0,
                categories: 'component material building',
                extra: {
                    stackable: true,
                    merchantWeight: 5,
                    merchantQuestWeight: 4,
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
            tags: ['building', 'route', 'merchant'],
            merchantInterest: ['bridgewright', 'collector'],
            inventoryItem: {
                id: 'wood_frame_basic',
                icon: 'FR',
                lootTier: 0,
                categories: 'component material building',
                extra: {
                    stackable: true,
                    merchantWeight: 4,
                    merchantQuestWeight: 3,
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
            tags: ['building', 'route', 'water', 'merchant'],
            merchantInterest: ['bridgewright', 'collector'],
            inventoryItem: {
                id: 'boatFrame',
                icon: 'BF',
                lootTier: 0,
                categories: 'component material building',
                extra: {
                    stackable: true,
                    merchantWeight: 3,
                    merchantQuestWeight: 2,
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
            sourceResourceIds: ['rubble', 'stone'],
            resourceInputs: [{ resourceId: 'rubble', quantity: 5 }],
            sourceSummary: 'Стабилизирующий заполнитель для ремонта повреждённых конструкций.',
            baseConversion: ['5 щебня -> 1 гравийная засыпка', '2 камня + 3 щебня -> 1 ремонтный наполнитель'],
            mainRole: 'Дешёвый стройкомпонент для восстановления мостов и стабилизации переходов.',
            usedInRecipes: ['Ремкомплект моста'],
            criticalWindows: ['Острова 7-15: ремонт и долгие маршруты', 'Острова 19-24: поддержание логистики'],
            currentInventoryItemIds: ['gravel_fill'],
            tags: ['repair', 'building', 'route'],
            merchantInterest: ['bridgewright', 'junkDealer'],
            inventoryItem: {
                id: 'gravel_fill',
                icon: 'GZ',
                lootTier: 0,
                categories: 'component material repair',
                extra: {
                    stackable: true,
                    merchantWeight: 4,
                    merchantQuestWeight: 3,
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
            tags: ['building', 'route', 'merchant'],
            merchantInterest: ['bridgewright', 'junkDealer'],
            inventoryItem: {
                id: 'stone_block',
                icon: 'KB',
                lootTier: 0,
                categories: 'component material building',
                extra: {
                    stackable: true,
                    merchantWeight: 4,
                    merchantQuestWeight: 3,
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
            tags: ['water', 'survival', 'bagQuest'],
            merchantInterest: ['merchant', 'fisherman', 'quartermaster'],
            inventoryItem: {
                id: 'fuel_bundle',
                icon: 'TB',
                lootTier: 0,
                categories: 'component material survival',
                extra: {
                    stackable: true,
                    merchantWeight: 3,
                    merchantQuestWeight: 2,
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
            tags: ['survival'],
            merchantInterest: ['fisherman', 'quartermaster'],
            inventoryItem: {
                id: 'fish_meat',
                icon: 'FM',
                lootTier: 0,
                categories: 'component material food',
                extra: {
                    stackable: true,
                    merchantWeight: 3,
                    merchantQuestWeight: 2,
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
            tags: ['building', 'water', 'route', 'merchant'],
            merchantInterest: ['fisherman', 'bridgewright', 'collector'],
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
                    baseValue: 12,
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
                    baseValue: 12,
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
                    baseValue: 11,
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
                    baseValue: 10,
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
                    baseValue: 12,
                    description: 'Даёт всплеск темпа и удешевляет тяжёлое движение на несколько шагов.',
                    consumable: { energy: 18, focus: 12 },
                    activeEffect: { kind: 'travelBuff', discountMultiplier: 0.7, durationSteps: 8 }
                }
            }
        },
        {
            id: 'bridge_kit',
            label: 'Мост-комплект',
            aliases: ['Bridge Kit', 'bridgeKit'],
            bulk: 7,
            sourceRecipeIds: ['portable-bridge'],
            tags: ['crafted', 'tool', 'movement', 'bridge'],
            merchantInterest: ['bridgewright', 'quartermaster', 'junkDealer'],
            inventoryItem: {
                id: 'bridge_kit',
                icon: 'BK',
                lootTier: 2,
                categories: 'tool utility movement',
                extra: {
                    chestWeight: 0,
                    merchantWeight: 4,
                    merchantQuestWeight: 2,
                    baseValue: 14,
                    description: 'Грубый мостовой комплект. Его можно использовать сразу или собрать из него более компактный переносной мост.',
                    bridgeFamily: 'portable',
                    bridgeUpgradeStage: 0,
                    bridgeReady: false,
                    upgradeFromItemIds: [],
                    activeEffect: { kind: 'bridgeBuilder', charges: 1 }
                }
            }
        },
        {
            id: 'portableBridge',
            label: 'Переносной мост',
            aliases: ['Portable Bridge', 'portable_bridge'],
            bulk: 6,
            sourceRecipeIds: ['portable-bridge-assembly'],
            tags: ['crafted', 'tool', 'movement', 'bridge', 'route'],
            merchantInterest: ['bridgewright', 'quartermaster', 'collector'],
            inventoryItem: {
                id: 'portableBridge',
                icon: 'PM',
                lootTier: 2,
                categories: 'tool utility movement bridge',
                extra: {
                    chestWeight: 5,
                    merchantWeight: 6,
                    merchantQuestWeight: 2,
                    baseValue: 15,
                    description: 'Готовая переносная переправа. Более удобная и компактная форма мост-комплекта.',
                    bridgeFamily: 'portable',
                    bridgeUpgradeStage: 1,
                    bridgeReady: true,
                    upgradeFromItemIds: ['bridge_kit'],
                    activeEffect: { kind: 'bridgeBuilder', charges: 1 }
                }
            }
        },
        {
            id: 'reinforcedBridge',
            label: 'Усиленный мост',
            aliases: ['Reinforced Bridge', 'reinforced_bridge'],
            bulk: 7,
            sourceRecipeIds: ['reinforced-bridge-upgrade'],
            tags: ['crafted', 'tool', 'movement', 'bridge', 'route', 'advanced'],
            merchantInterest: ['bridgewright', 'collector'],
            inventoryItem: {
                id: 'reinforcedBridge',
                icon: 'UM',
                lootTier: 3,
                categories: 'tool utility movement bridge',
                extra: {
                    chestWeight: 4,
                    merchantWeight: 5,
                    merchantQuestWeight: 2,
                    baseValue: 16,
                    description: 'Усиленная версия переносного моста. Даёт две клетки переправы и держит поздние маршруты увереннее.',
                    bridgeFamily: 'portable',
                    bridgeUpgradeStage: 2,
                    bridgeReady: true,
                    upgradeFromItemIds: ['portableBridge'],
                    activeEffect: { kind: 'bridgeBuilder', charges: 2 }
                }
            }
        },
        {
            id: 'fieldBridge',
            label: 'Полевой мостик',
            aliases: ['Field Bridge', 'field_bridge'],
            bulk: 5,
            sourceRecipeIds: ['field-bridge-upgrade'],
            tags: ['crafted', 'tool', 'movement', 'bridge', 'route', 'advanced'],
            merchantInterest: ['bridgewright', 'collector'],
            inventoryItem: {
                id: 'fieldBridge',
                icon: 'PB',
                lootTier: 4,
                categories: 'tool utility movement bridge',
                extra: {
                    chestWeight: 2,
                    merchantWeight: 3,
                    merchantQuestWeight: 2,
                    baseValue: 16,
                    description: 'Облегчённый маршрутный апгрейд моста. Даёт две клетки переправы, но носится чуть легче тяжёлых вариантов.',
                    bridgeFamily: 'portable',
                    bridgeUpgradeStage: 3,
                    bridgeReady: true,
                    upgradeFromItemIds: ['portableBridge'],
                    activeEffect: { kind: 'bridgeBuilder', charges: 2 }
                }
            }
        },
        {
            id: 'absoluteBridge',
            label: 'Абсолютный мост',
            aliases: ['Absolute Bridge', 'absolute_bridge'],
            bulk: 8,
            sourceRecipeIds: ['absolute-bridge-upgrade'],
            tags: ['crafted', 'tool', 'movement', 'bridge', 'route', 'advanced', 'legendary'],
            merchantInterest: ['bridgewright', 'collector'],
            inventoryItem: {
                id: 'absoluteBridge',
                icon: 'AM',
                lootTier: 6,
                categories: 'legendary tool movement bridge',
                extra: {
                    chestWeight: 1,
                    merchantWeight: 2,
                    merchantQuestWeight: 1,
                    baseValue: 34,
                    rarity: 'legendary',
                    description: 'Крайняя сборка мостовой ветки. Даёт мощную длинную переправу для финальной логистики.',
                    bridgeFamily: 'portable',
                    bridgeUpgradeStage: 4,
                    bridgeReady: true,
                    upgradeFromItemIds: ['reinforcedBridge', 'fieldBridge'],
                    activeEffect: { kind: 'bridgeBuilder', charges: 4 }
                }
            }
        },
        {
            id: 'repair_kit_bridge',
            label: 'Ремкомплект моста',
            aliases: ['Bridge Repair Kit', 'bridgeRepairKit'],
            bulk: 4,
            sourceRecipeIds: ['bridge-repair-kit'],
            tags: ['crafted', 'tool', 'repair', 'bridge', 'utility'],
            merchantInterest: ['bridgewright', 'quartermaster', 'junkDealer'],
            inventoryItem: {
                id: 'repair_kit_bridge',
                icon: 'RM',
                lootTier: 2,
                categories: 'tool utility repair bridge',
                extra: {
                    chestWeight: 0,
                    merchantWeight: 4,
                    merchantQuestWeight: 3,
                    baseValue: 12,
                    description: 'Утилитарный комплект для ремонта повреждённых мостов и переправ.',
                    activeEffect: { kind: 'repairStructure', structureKind: 'bridge' }
                }
            }
        },
        {
            id: 'boat_ready',
            label: 'Готовая лодка',
            aliases: ['Boat Ready', 'boatReady'],
            bulk: 7,
            sourceRecipeIds: ['boat'],
            tags: ['crafted', 'tool', 'movement', 'boat', 'water'],
            merchantInterest: ['fisherman', 'quartermaster', 'collector'],
            inventoryItem: {
                id: 'boat_ready',
                icon: 'BL',
                lootTier: 3,
                categories: 'tool utility movement water',
                extra: {
                    chestWeight: 0,
                    merchantWeight: 3,
                    merchantQuestWeight: 1,
                    baseValue: 22,
                    description: 'Собранная лодка для водной фазы и богатых маршрутов.',
                    boatFamily: 'expedition',
                    boatUpgradeStage: 1,
                    boatMaxDurability: 3,
                    waterTravelMultiplier: 1.34,
                    waterRouteBand: 'hazard',
                    waterTraversalLabel: 'вода на лодке',
                    activeEffect: { kind: 'boatTraversal' }
                }
            }
        },
        {
            id: 'repair_kit_boat',
            label: 'Ремкомплект лодки',
            aliases: ['Boat Repair Kit', 'boatRepairKit'],
            bulk: 4,
            sourceRecipeIds: ['boat-repair-kit'],
            tags: ['crafted', 'tool', 'repair', 'boat', 'water', 'utility'],
            merchantInterest: ['fisherman', 'quartermaster', 'collector'],
            inventoryItem: {
                id: 'repair_kit_boat',
                icon: 'RL',
                lootTier: 2,
                categories: 'tool utility repair water',
                extra: {
                    chestWeight: 0,
                    merchantWeight: 4,
                    merchantQuestWeight: 3,
                    baseValue: 13,
                    description: 'Утилитарный набор для поддержания лодки в рабочем состоянии.',
                    activeEffect: { kind: 'repairStructure', structureKind: 'boat' }
                }
            }
        },
        {
            id: 'trade_papers',
            label: 'Торговые бумаги',
            aliases: ['Trade Papers', 'tradePapers'],
            bulk: 1,
            sourceRecipeIds: ['wood-plank-to-trade-papers'],
            tags: ['crafted', 'value', 'trade', 'economy', 'merchant'],
            merchantInterest: ['merchant', 'exchanger', 'collector', 'quartermaster'],
            inventoryItem: {
                id: 'trade_papers',
                icon: 'TP',
                lootTier: 2,
                categories: 'value trade utility',
                extra: {
                    stackable: true,
                    chestWeight: 0,
                    merchantWeight: 6,
                    merchantQuestWeight: 4,
                    baseValue: 9,
                    description: 'Дешёвая торговая ценность от писаря. Хороша для продажи и мелких обменов, но не заменяет редкий лут.'
                }
            }
        },
        {
            id: 'market_seal',
            label: 'Рыночная печать',
            aliases: ['Market Seal', 'marketSeal'],
            bulk: 1,
            sourceRecipeIds: ['stone-block-to-market-seal'],
            tags: ['crafted', 'value', 'trade', 'economy', 'merchant'],
            merchantInterest: ['merchant', 'exchanger', 'collector'],
            inventoryItem: {
                id: 'market_seal',
                icon: 'RP',
                lootTier: 2,
                categories: 'value trade',
                extra: {
                    stackable: true,
                    chestWeight: 0,
                    merchantWeight: 6,
                    merchantQuestWeight: 4,
                    baseValue: 10,
                    description: 'Недорогая ценность из каменного пакета. Удобно нести к торговцу, если сбор уже пережал маршрут.'
                }
            }
        },
        {
            id: 'roadChalk',
            label: 'Мел дорожника',
            bulk: 1,
            sourceRecipeIds: ['road-chalk'],
            tags: ['crafted', 'tool', 'info', 'route'],
            inventoryItem: {
                id: 'roadChalk',
                icon: 'MD',
                lootTier: 2,
                categories: 'tool utility info',
                extra: {
                    chestWeight: 2,
                    merchantWeight: 4,
                    baseValue: 12,
                    description: 'Собранный маршрутный мел. Даёт подсказку по самому дешёвому пути.',
                    activeEffect: { kind: 'cheapestRouteHint' }
                }
            }
        },
        {
            id: 'pathMarker',
            label: 'Маркер пути',
            bulk: 1,
            sourceRecipeIds: ['path-marker'],
            tags: ['crafted', 'tool', 'info', 'route'],
            inventoryItem: {
                id: 'pathMarker',
                icon: 'MP',
                lootTier: 3,
                categories: 'consumable utility movement',
                extra: {
                    stackable: true,
                    chestWeight: 3,
                    merchantWeight: 4,
                    baseValue: 13,
                    description: 'Собранный маршрутный маркер. Показывает самый дешёвый путь к выбранной цели.',
                    activeEffect: { kind: 'cheapestRouteHint' }
                }
            }
        },
        {
            id: 'safeHouseSeal',
            label: 'Печать безопасного дома',
            bulk: 2,
            sourceRecipeIds: ['safe-house-seal'],
            tags: ['crafted', 'tool', 'survival', 'protection'],
            inventoryItem: {
                id: 'safeHouseSeal',
                icon: 'PD',
                lootTier: 4,
                categories: 'tool utility survival',
                extra: {
                    chestWeight: 2,
                    merchantWeight: 3,
                    baseValue: 18,
                    description: 'Собранная защитная печать. Один раз спасает от штрафа пустого или опасного дома.',
                    activeEffect: { kind: 'trapWard', charges: 1 }
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
                    baseValue: 18,
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
                    baseValue: 16,
                    description: 'Сигнальный маяк на рыбьем жире. Показывает координаты торговца текущего острова.',
                    activeEffect: { kind: 'revealMerchant' }
                }
            }
        },
        {
            id: 'relicCase',
            label: 'Футляр реликвий',
            bulk: 2,
            sourceRecipeIds: ['relic-case'],
            tags: ['crafted', 'artifact', 'info', 'trade'],
            merchantInterest: ['collector', 'merchant', 'exchanger'],
            inventoryItem: {
                id: 'relicCase',
                icon: 'FR',
                lootTier: 5,
                categories: 'artifact utility info value',
                extra: {
                    chestWeight: 0,
                    merchantWeight: 2,
                    merchantQuestWeight: 2,
                    baseValue: 30,
                    description: 'Коллекционерский футляр для позднего отрезка. Помогает заранее видеть дорогие точки острова и выгоднее выводить ценности.',
                    passive: {
                        showHouseValue: true,
                        merchantSellMultiplier: 1.16,
                        chestLuck: 1
                    }
                }
            }
        },
        {
            id: 'toolHolster',
            label: 'Кобура инструмента',
            bulk: 2,
            sourceRecipeIds: ['tool-holster'],
            tags: ['crafted', 'artifact', 'route', 'utility'],
            merchantInterest: ['quartermaster', 'collector', 'bridgewright'],
            inventoryItem: {
                id: 'toolHolster',
                icon: 'KI',
                lootTier: 5,
                categories: 'artifact utility movement',
                extra: {
                    chestWeight: 0,
                    merchantWeight: 2,
                    merchantQuestWeight: 2,
                    baseValue: 28,
                    description: 'Поздняя ремесленная оснастка для маршрута. Делает старт движения мягче и удобнее для длинных связок с инструментами.',
                    passive: {
                        freeOpeningSteps: 1,
                        routeLengthBonus: 1,
                        bridgeTravelCostMultiplier: 0.8
                    }
                }
            }
        },
        {
            id: 'anchorLine',
            label: 'Якорная линия',
            bulk: 2,
            sourceRecipeIds: ['anchor-line'],
            tags: ['crafted', 'tool', 'movement', 'water', 'route'],
            merchantInterest: ['quartermaster', 'fisherman', 'collector'],
            inventoryItem: {
                id: 'anchorLine',
                icon: 'AL',
                lootTier: 5,
                categories: 'tool utility movement water',
                extra: {
                    chestWeight: 0,
                    merchantWeight: 2,
                    merchantQuestWeight: 1,
                    baseValue: 26,
                    description: 'Поздняя страховка маршрута. Один раз уводит к безопасной точке острова, если забег начинает ломаться.',
                    activeEffect: { kind: 'teleportToSafe' }
                }
            }
        },
        {
            id: 'islandDrill',
            label: 'Островная дрель',
            bulk: 4,
            sourceRecipeIds: ['island-drill'],
            tags: ['crafted', 'tool', 'route', 'heavy'],
            merchantInterest: ['bridgewright', 'quartermaster', 'junkDealer'],
            inventoryItem: {
                id: 'islandDrill',
                icon: 'OD',
                lootTier: 5,
                categories: 'tool utility movement',
                extra: {
                    chestWeight: 0,
                    merchantWeight: 2,
                    merchantQuestWeight: 1,
                    baseValue: 30,
                    description: 'Тяжёлый маршрутный инструмент эндгейма. Сбрасывает часть местного дорожного давления, когда карта уже слишком дорогая.',
                    activeEffect: { kind: 'clearTravelPenalty' }
                }
            }
        },
        {
            id: 'blackCup',
            label: 'Чёрный кубок',
            bulk: 1,
            sourceRecipeIds: ['black-cup'],
            tags: ['crafted', 'ritual', 'survival', 'risk'],
            inventoryItem: {
                id: 'blackCup',
                icon: 'BK',
                lootTier: 5,
                categories: 'consumable survival risk',
                extra: {
                    chestWeight: 0,
                    merchantWeight: 0,
                    baseValue: 30,
                    rarity: 'cursed',
                    description: 'Ситуативный ритуальный напиток финальной подготовки. Даёт островной рывок и лучшее восстановление, но повышает общий drain до конца острова.',
                    consumable: { hunger: 45, energy: 30, focus: 24, cold: 14 },
                    activeEffect: {
                        kind: 'islandBuff',
                        label: 'Чёрный кубок',
                        travelCostMultiplier: 0.88,
                        recoveryMultiplier: 1.18,
                        foodRecoveryMultiplier: 1.1,
                        drainMultiplier: 1.12
                    }
                }
            }
        },
        {
            id: 'lastVow',
            label: 'Последний обет',
            bulk: 1,
            sourceRecipeIds: ['last-vow'],
            tags: ['crafted', 'ritual', 'movement', 'survival', 'risk'],
            inventoryItem: {
                id: 'lastVow',
                icon: 'PO',
                lootTier: 6,
                categories: 'consumable survival movement risk',
                extra: {
                    chestWeight: 0,
                    merchantWeight: 0,
                    baseValue: 34,
                    rarity: 'cursed',
                    description: 'Финальный ритуал под проход, а не под greed. Даёт сильный короткий рывок и позволяет проскочить тяжёлые зоны.',
                    consumable: { energy: 26, focus: 28, cold: 18 },
                    activeEffect: {
                        kind: 'travelBuff',
                        freeSteps: 3,
                        discountMultiplier: 0.45,
                        durationSteps: 12,
                        ignoreTravelZones: ['drainingLowland', 'badSector', 'dangerPass', 'cursedTrail']
                    }
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
                    baseValue: 6,
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
    const generatedCraftingOutputByInventoryItemId = Object.fromEntries(generatedCraftingOutputCatalogItems.map((item) => [
        item.id,
        cloneValue(generatedCraftingOutputById[item.craftingOutputId])
    ]));
    const generatedCraftingOutputByInventoryItemLookupValue = Object.fromEntries(generatedCraftingOutputCatalogItems.map((item) => [
        normalizeLookupValue(item.id),
        cloneValue(generatedCraftingOutputById[item.craftingOutputId])
    ]));
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

    function getGeneratedCraftingOutputDefinitionByInventoryItemId(itemId) {
        const normalizedItemId = normalizeLookupValue(itemId);
        return generatedCraftingOutputByInventoryItemId[itemId] || generatedCraftingOutputByInventoryItemLookupValue[normalizedItemId]
            ? cloneValue(generatedCraftingOutputByInventoryItemId[itemId] || generatedCraftingOutputByInventoryItemLookupValue[normalizedItemId])
            : null;
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
                craftingTags: definition.componentId ? cloneValue((componentById[definition.componentId] && componentById[definition.componentId].tags) || []) : [],
                merchantInterest: definition.componentId
                    ? cloneValue((componentById[definition.componentId] && componentById[definition.componentId].merchantInterest) || [])
                    : cloneValue(definition.merchantInterest || []),
                sourceRecipeIds: cloneValue(definition.sourceRecipeIds),
                ...cloneValue(definition.extra)
            }
        ));
    }

    function getComponentsByMerchantInterest(merchantRole) {
        const normalizedMerchantRole = normalizeLookupValue(merchantRole);
        return intermediateComponents
            .filter((component) => Array.isArray(component.merchantInterest)
                && component.merchantInterest.some((role) => normalizeLookupValue(role) === normalizedMerchantRole))
            .map((component) => cloneValue(component));
    }

    function getCraftingOutputsByMerchantInterest(merchantRole) {
        const normalizedMerchantRole = normalizeLookupValue(merchantRole);
        return generatedCraftingOutputs
            .filter((output) => Array.isArray(output.merchantInterest)
                && output.merchantInterest.some((role) => normalizeLookupValue(role) === normalizedMerchantRole))
            .map((output) => cloneValue(output));
    }

    function getMerchantInterestedInventoryItemIds(merchantRole) {
        return [
            ...getComponentsByMerchantInterest(merchantRole)
                .map((component) => component && component.inventoryItem ? component.inventoryItem.id : ''),
            ...getCraftingOutputsByMerchantInterest(merchantRole)
                .map((output) => output && output.inventoryItem ? output.inventoryItem.id : '')
        ].filter((itemId, index, collection) => itemId && collection.indexOf(itemId) === index);
    }

    function getMerchantInterestForInventoryItemId(itemId) {
        const componentDefinition = getComponentDefinitionByInventoryItemId(itemId);
        if (componentDefinition && Array.isArray(componentDefinition.merchantInterest)) {
            return cloneValue(componentDefinition.merchantInterest);
        }

        const outputDefinition = getGeneratedCraftingOutputDefinitionByInventoryItemId(itemId);
        return outputDefinition && Array.isArray(outputDefinition.merchantInterest)
            ? cloneValue(outputDefinition.merchantInterest)
            : [];
    }

    function matchesMerchantInterest(itemIdOrComponentId, merchantRole) {
        const normalizedMerchantRole = normalizeLookupValue(merchantRole);
        if (!normalizedMerchantRole) {
            return false;
        }

        const componentDefinition = getComponentDefinition(itemIdOrComponentId)
            || getComponentDefinitionByInventoryItemId(itemIdOrComponentId);

        if (componentDefinition) {
            return Boolean(componentDefinition
                && Array.isArray(componentDefinition.merchantInterest)
                && componentDefinition.merchantInterest.some((role) => normalizeLookupValue(role) === normalizedMerchantRole));
        }

        const outputDefinition = getGeneratedCraftingOutputDefinition(itemIdOrComponentId)
            || getGeneratedCraftingOutputDefinitionByInventoryItemId(itemIdOrComponentId);

        return Boolean(outputDefinition
            && Array.isArray(outputDefinition.merchantInterest)
            && outputDefinition.merchantInterest.some((role) => normalizeLookupValue(role) === normalizedMerchantRole));
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
        getComponentsByMerchantInterest,
        getCraftingOutputsByMerchantInterest,
        getComponentQualityLabel,
        getComponentsByCraftMethod,
        getGeneratedCraftingOutputDefinitionByInventoryItemId,
        getMerchantInterestedInventoryItemIds,
        getMerchantInterestForInventoryItemId,
        getComponentsBySourceResource,
        getComponentsByTag,
        getGeneratedCraftingOutputDefinition,
        getGeneratedCraftingOutputDefinitions,
        isComponentInventoryItem,
        isGeneratedCraftingOutputItem,
        getUnknownComponentTags,
        matchesMerchantInterest,
        normalizeComponentTags,
        normalizeComponentQualityLevel,
        normalizeComponentDefinition,
        normalizeGeneratedCraftingOutputDefinition,
        normalizeCraftMethod,
        validateComponentDefinition,
        validateGeneratedCraftingOutputDefinition,
        COMPONENT_QUALITY_LEVELS,
        COMPONENT_CRAFTING_TAGS,
        KNOWN_MERCHANT_INTERESTS
    });
})();
