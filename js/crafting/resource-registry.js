(() => {
    const game = window.Game;
    const resourceRegistry = game.systems.resourceRegistry = game.systems.resourceRegistry || {};

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

    function normalizeTextList(value) {
        return (Array.isArray(value) ? value : [])
            .filter((entry) => typeof entry === 'string' && entry.trim())
            .map((entry) => entry.trim());
    }

    function normalizeResourceDefinition(definition = {}) {
        const resourceId = typeof definition.resourceId === 'string' && definition.resourceId.trim()
            ? definition.resourceId.trim()
            : (typeof definition.id === 'string' ? definition.id.trim() : '');
        const type = typeof definition.type === 'string' && definition.type.trim()
            ? definition.type.trim()
            : (typeof definition.layer === 'string' ? definition.layer.trim() : '');

        return {
            ...cloneValue(definition),
            id: resourceId,
            resourceId,
            type,
            layer: type,
            label: typeof definition.label === 'string' ? definition.label.trim() : '',
            source: typeof definition.source === 'string' ? definition.source.trim() : '',
            baseConversion: normalizeTextList(definition.baseConversion),
            currentInventoryItemIds: normalizeTextList(definition.currentInventoryItemIds)
        };
    }

    function validateBaseResourceDefinition(definition, options = {}) {
        const normalizedDefinition = normalizeResourceDefinition(definition);
        const missingFields = [];

        if (!normalizedDefinition.id) {
            missingFields.push('resourceId');
        }

        if (!normalizedDefinition.label) {
            missingFields.push('label');
        }

        if (!normalizedDefinition.type) {
            missingFields.push('type');
        }

        if (!normalizedDefinition.source) {
            missingFields.push('source');
        }

        if (missingFields.length > 0) {
            const resourceLabel = normalizedDefinition.id || `#${Number(options.index) + 1 || 1}`;
            throw new Error(`[resource-registry] Resource "${resourceLabel}" is missing required fields: ${missingFields.join(', ')}.`);
        }

        return normalizedDefinition;
    }

    function createValidatedResourceRegistry(definitions, options = {}) {
        const normalizedDefinitions = [];
        const resourceById = Object.create(null);

        (Array.isArray(definitions) ? definitions : []).forEach((definition, index) => {
            const normalizedDefinition = validateBaseResourceDefinition(definition, { index });

            if (resourceById[normalizedDefinition.id]) {
                const error = new Error(`[resource-registry] Duplicate resourceId "${normalizedDefinition.id}" detected.`);

                if (isDevMode(options)) {
                    throw error;
                }

                return;
            }

            resourceById[normalizedDefinition.id] = normalizedDefinition;
            normalizedDefinitions.push(normalizedDefinition);
        });

        return {
            definitions: normalizedDefinitions.map((definition) => cloneValue(definition)),
            byId: Object.fromEntries(Object.entries(resourceById).map(([resourceId, definition]) => [
                resourceId,
                cloneValue(definition)
            ]))
        };
    }

    const baseResourceDefinitions = [
        {
            id: 'grass',
            type: 'raw',
            label: 'Трава',
            source: 'Сбор руками / кусты / луга',
            baseConversion: ['5 шт. -> 1 база лечения', '5 шт. -> 1 травяная паста'],
            mainRole: 'Зелья, восстановление, лёгкие баффы',
            requiredIslands: { from: 1, to: 6 },
            currentInventoryItemIds: ['raw_grass']
        },
        {
            id: 'stone',
            type: 'raw',
            label: 'Камень',
            source: 'Каменные выступы / карьеры',
            baseConversion: ['5 шт. -> 1 каменный блок'],
            mainRole: 'Тяжёлая утилита, укрепление, мосты',
            requiredIslands: { from: 4, to: 15 },
            currentInventoryItemIds: ['raw_stone']
        },
        {
            id: 'rubble',
            type: 'raw',
            label: 'Щебень',
            source: 'Разрушенные мосты / осыпи',
            baseConversion: ['5 шт. -> 1 заполнитель'],
            mainRole: 'Ремонт, стабилизация, дешёвый стройматериал',
            requiredIslands: { from: 7, to: 24 },
            currentInventoryItemIds: ['raw_rubble']
        },
        {
            id: 'wood',
            type: 'raw',
            label: 'Дерево',
            source: 'Лес, коряги, обломки',
            baseConversion: ['5 шт. -> 1 доска', '10 шт. -> 1 каркас'],
            mainRole: 'Мосты, лодка, ремонт, топливо',
            requiredIslands: { from: 2, to: 30 },
            currentInventoryItemIds: ['raw_wood']
        },
        {
            id: 'water',
            type: 'raw',
            label: 'Вода',
            source: 'Водоём + пустая фляга',
            baseConversion: ['Фляга: пустая -> полная'],
            mainRole: 'Питьё, варка, алхимия',
            requiredIslands: { from: 1, to: 30 },
            currentInventoryItemIds: ['waterFlask']
        },
        {
            id: 'fish',
            type: 'raw',
            label: 'Рыба',
            source: 'Удочка + точка ловли',
            baseConversion: ['5 шт. -> 1 рыбное мясо', '10 шт. -> 1 рыбий жир'],
            mainRole: 'Еда, масло, поздние рецепты',
            requiredIslands: { from: 6, to: 24 },
            currentInventoryItemIds: ['raw_fish']
        }
    ];

    const builtResourceRegistry = createValidatedResourceRegistry(baseResourceDefinitions, {
        devMode: isDevMode()
    });
    const baseResources = builtResourceRegistry.definitions;
    const baseResourceById = builtResourceRegistry.byId;
    const resourceSubtypeDefinitions = [
        {
            id: 'lowlandGrass',
            familyResourceId: 'grass',
            familyItemId: 'raw_grass',
            label: 'Низинная трава',
            sourceLabel: 'тростник',
            collectedLabel: 'низинную траву',
            adviceKey: 'reeds',
            legacyItemIds: ['lowlandGrass'],
            terrainTileTypes: ['reeds']
        },
        {
            id: 'fieldGrass',
            familyResourceId: 'grass',
            familyItemId: 'raw_grass',
            label: 'Полевая трава',
            sourceLabel: 'трава',
            collectedLabel: 'пучок полевой травы',
            adviceKey: 'grass',
            legacyItemIds: ['fieldGrass'],
            terrainTileTypes: ['grass']
        }
    ];
    const resourceSubtypeById = Object.fromEntries(resourceSubtypeDefinitions.map((subtype) => [subtype.id, subtype]));

    function buildSubtypeTerrainGatherProfile(subtypeId, extra = {}) {
        const subtype = resourceSubtypeById[subtypeId];

        if (!subtype) {
            return null;
        }

        return {
            resourceId: subtype.familyResourceId,
            resourceFamilyId: subtype.familyResourceId,
            itemId: subtype.familyItemId,
            resourceSubtypeId: subtype.id,
            resourceSubtypeLabel: subtype.label,
            sourceLabel: subtype.sourceLabel,
            collectedLabel: subtype.collectedLabel,
            adviceKey: subtype.adviceKey,
            legacyHarvestItemIds: normalizeTextList(subtype.legacyItemIds),
            ...cloneValue(extra)
        };
    }

    const terrainGatherProfiles = {
        rubble: {
            resourceId: 'rubble',
            itemId: 'raw_rubble',
            sourceLabel: 'осыпь',
            collectedLabel: 'щебень',
            adviceKey: 'rubble',
            legacyHarvestItemIds: ['rubbleChunk'],
            conversionHint: 'Собери сырьё и выбери его в сумке: пять единиц можно сжать в гравийную засыпку.',
            allowAdjacent: false
        },
        rock: {
            resourceId: 'stone',
            itemId: 'raw_stone',
            sourceLabel: 'камни',
            collectedLabel: 'камень',
            adviceKey: 'stone',
            legacyHarvestItemIds: ['rubbleChunk'],
            conversionHint: 'Собери сырьё и выбери его в сумке: пять единиц можно сжать в каменный блок.',
            allowAdjacent: true,
            clickToCollect: true
        },
        reeds: buildSubtypeTerrainGatherProfile('lowlandGrass', {
            conversionHint: 'Собери сырьё и выбери его в сумке: пять единиц идут в базу лечения или травяную пасту, а десять на верстаке в верёвку.',
            allowAdjacent: false
        }),
        grass: buildSubtypeTerrainGatherProfile('fieldGrass', {
            conversionHint: 'Собери сырьё и выбери его в сумке: пять единиц идут в базу лечения или травяную пасту, а десять на верстаке в верёвку.',
            allowAdjacent: false
        })
    };

    const resourceCatalogItems = [
        {
            id: 'waterFlask',
            resourceId: 'water',
            label: 'Фляга воды',
            icon: 'FW',
            lootTier: 1,
            categories: 'consumable survival',
            extra: {
                stackable: true,
                chestWeight: 10,
                merchantWeight: 10,
                baseValue: 7,
                description: 'Чистая вода. Восстанавливает фокус, энергию и немного сбивает голод.',
                consumable: {
                    ignoreRecoveryScaling: true,
                    allowPartialHunger: true,
                    hunger: 25,
                    focus: 40,
                    energy: 50
                }
            }
        },
        {
            id: 'raw_grass',
            resourceId: 'grass',
            label: 'Трава',
            icon: 'TR',
            lootTier: 0,
            categories: 'resource material',
            extra: {
                stackable: true,
                baseValue: 2,
                merchantQuestWeight: 2,
                description: 'Базовое травяное сырьё. Выбери предмет в сумке, чтобы переработать 5 единиц в лечебную основу или травяную пасту, а 10 на верстаке в верёвку.'
            }
        },
        {
            id: 'raw_stone',
            resourceId: 'stone',
            label: 'Камень',
            icon: 'KS',
            lootTier: 0,
            categories: 'resource material',
            extra: {
                stackable: true,
                baseValue: 3,
                merchantQuestWeight: 2,
                description: 'Базовое каменное сырьё. Пять единиц сжимаются в каменный блок.'
            }
        },
        {
            id: 'raw_rubble',
            resourceId: 'rubble',
            label: 'Щебень',
            icon: 'OS',
            lootTier: 0,
            categories: 'resource material',
            extra: {
                stackable: true,
                baseValue: 2,
                merchantQuestWeight: 2,
                description: 'Базовое сыпучее сырьё. Пять единиц сжимаются в гравийную засыпку.'
            }
        },
        {
            id: 'raw_wood',
            resourceId: 'wood',
            label: 'Дерево',
            icon: 'DW',
            lootTier: 0,
            categories: 'resource material',
            extra: {
                stackable: true,
                baseValue: 3,
                description: 'Базовое древесное сырьё. Пять единиц сжимаются в доску, десять — в каркас.'
            }
        },
        {
            id: 'raw_fish',
            resourceId: 'fish',
            label: 'Рыба',
            icon: 'RF',
            lootTier: 0,
            categories: 'resource material food',
            extra: {
                stackable: true,
                baseValue: 3,
                description: 'Базовый улов. Пять единиц идут в рыбное мясо, десять — в рыбий жир.'
            }
        }
    ];

    const resourceCatalogItemById = Object.fromEntries(resourceCatalogItems.map((item) => [item.id, item]));

    function getBaseResourceDefinition(resourceId) {
        return baseResourceById[resourceId] ? cloneValue(baseResourceById[resourceId]) : null;
    }

    function getBaseResourceDefinitions() {
        return baseResources.map((resource) => cloneValue(resource));
    }

    function getBaseResourceIds() {
        return baseResources.map((resource) => resource.id);
    }

    function getCatalogResourceItemDefinition(itemId) {
        return resourceCatalogItemById[itemId] ? cloneValue(resourceCatalogItemById[itemId]) : null;
    }

    function getResourceSubtypeDefinition(subtypeId) {
        return resourceSubtypeById[subtypeId] ? cloneValue(resourceSubtypeById[subtypeId]) : null;
    }

    function getResourceSubtypeDefinitions(familyResourceId = '') {
        const normalizedFamilyResourceId = typeof familyResourceId === 'string' ? familyResourceId.trim() : '';
        return resourceSubtypeDefinitions
            .filter((subtype) => !normalizedFamilyResourceId || subtype.familyResourceId === normalizedFamilyResourceId)
            .map((subtype) => cloneValue(subtype));
    }

    function buildCatalogEntries(makeItem) {
        if (typeof makeItem !== 'function') {
            return [];
        }

        return resourceCatalogItems.map((definition) => makeItem(
            definition.id,
            definition.label,
            definition.icon,
            definition.lootTier,
            definition.categories,
            {
                resourceId: definition.resourceId,
                ...cloneValue(definition.extra)
            }
        ));
    }

    function getTerrainGatherProfile(tileType) {
        return terrainGatherProfiles[tileType] ? cloneValue(terrainGatherProfiles[tileType]) : null;
    }

    function getTerrainGatherLegacyItemIds(tileType) {
        const profile = getTerrainGatherProfile(tileType);
        return profile && Array.isArray(profile.legacyHarvestItemIds)
            ? profile.legacyHarvestItemIds.map((itemId) => itemId)
            : [];
    }

    function getLegacyTerrainGatherItemIds() {
        return [...new Set(Object.values(terrainGatherProfiles)
            .flatMap((profile) => Array.isArray(profile && profile.legacyHarvestItemIds)
                ? profile.legacyHarvestItemIds
                : []))];
    }

    Object.assign(resourceRegistry, {
        baseResources,
        resourceSubtypeDefinitions,
        terrainGatherProfiles,
        resourceCatalogItems,
        createValidatedResourceRegistry,
        getBaseResourceDefinition,
        getBaseResourceDefinitions,
        getBaseResourceIds,
        getCatalogResourceItemDefinition,
        getResourceSubtypeDefinition,
        getResourceSubtypeDefinitions,
        buildCatalogEntries,
        getLegacyTerrainGatherItemIds,
        getTerrainGatherProfile,
        getTerrainGatherLegacyItemIds,
        normalizeResourceDefinition,
        validateBaseResourceDefinition
    });
})();
