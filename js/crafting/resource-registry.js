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
            id: 'reeds',
            type: 'raw',
            label: 'Тростник',
            source: 'Прибрежные заросли / кромка воды',
            baseConversion: ['5 шт. -> 1 база лечения', '10 шт. -> 1 верёвка'],
            mainRole: 'Лечение у воды, верёвка, ранняя маршрутная утилита',
            requiredIslands: { from: 1, to: 30 },
            currentInventoryItemIds: ['raw_reeds']
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
            baseConversion: ['Фляга: пустая -> сырая', 'сырая -> кипячёная', 'кипячёная -> алхимическая'],
            mainRole: 'Питьё, варка, алхимия',
            requiredIslands: { from: 1, to: 30 },
            currentInventoryItemIds: ['flask_water_full', 'flask_water_alchemy']
        },
        {
            id: 'fish',
            type: 'raw',
            label: 'Рыба',
            source: 'Удочка + точка ловли',
            baseConversion: ['5 шт. -> 1 рыбное мясо', '10 шт. -> 1 рыбий жир'],
            mainRole: 'Еда, масло, поздние рецепты',
            requiredIslands: { from: 6, to: 30 },
            currentInventoryItemIds: ['raw_fish', 'raw_fish_rare', 'raw_fish_trophy']
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
            familyResourceId: 'reeds',
            familyItemId: 'raw_reeds',
            label: 'Тростник',
            sourceLabel: 'тростник',
            collectedLabel: 'тростник',
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
    const fishCatchDefinitions = [
        {
            id: 'commonFish',
            resourceId: 'fish',
            itemId: 'raw_fish',
            label: 'Обычная рыба',
            collectedLabel: 'обычную рыбу',
            rarityLabel: 'обычная',
            requiredIslands: { from: 6, to: 12 },
            description: 'Ранний базовый улов для еды и первого рыбьего жира.'
        },
        {
            id: 'rareFish',
            resourceId: 'fish',
            itemId: 'raw_fish_rare',
            label: 'Редкая рыба',
            collectedLabel: 'редкую рыбу',
            rarityLabel: 'редкая',
            requiredIslands: { from: 13, to: 24 },
            description: 'Средний и поздний улов с лучшей ценностью для масла, торговли и длинных маршрутов.'
        },
        {
            id: 'trophyFish',
            resourceId: 'fish',
            itemId: 'raw_fish_trophy',
            label: 'Трофейная рыба',
            collectedLabel: 'трофейную рыбу',
            rarityLabel: 'трофейная',
            requiredIslands: { from: 25, to: 30 },
            description: 'Эндгейм-улов для поздней логистики, дорогой торговли и топовых решений.'
        }
    ];
    const fishCatchById = Object.fromEntries(fishCatchDefinitions.map((definition) => [definition.id, definition]));

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

    const lateGatherRiskProfiles = {
        stone: {
            startIsland: 19,
            baseChance: 0.12,
            islandChanceStep: 0.012,
            pressureChanceStep: 0.025,
            badWeatherChanceBonus: 0.03,
            maxChance: 0.28,
            outcomes: {
                extraDrain: 4,
                localPressure: 3,
                loseTurn: 2,
                noise: 1
            },
            extraDrainFactor: 0.8,
            localPressureSteps: 2,
            noiseTimeSteps: 1
        },
        rubble: {
            startIsland: 19,
            baseChance: 0.13,
            islandChanceStep: 0.014,
            pressureChanceStep: 0.03,
            badWeatherChanceBonus: 0.03,
            maxChance: 0.3,
            outcomes: {
                localPressure: 4,
                extraDrain: 3,
                noise: 2,
                loseTurn: 1
            },
            extraDrainFactor: 0.82,
            localPressureSteps: 3,
            noiseTimeSteps: 1
        },
        wood: {
            startIsland: 19,
            baseChance: 0.14,
            islandChanceStep: 0.014,
            pressureChanceStep: 0.03,
            badWeatherChanceBonus: 0.04,
            maxChance: 0.33,
            outcomes: {
                loseTurn: 3,
                localPressure: 3,
                extraDrain: 2,
                noise: 2
            },
            extraDrainFactor: 0.9,
            localPressureSteps: 3,
            noiseTimeSteps: 1
        },
        fish: {
            startIsland: 19,
            baseChance: 0.15,
            islandChanceStep: 0.013,
            pressureChanceStep: 0.03,
            badWeatherChanceBonus: 0.04,
            maxChance: 0.34,
            outcomes: {
                noise: 4,
                extraDrain: 3,
                localPressure: 2,
                loseTurn: 1
            },
            extraDrainFactor: 0.78,
            localPressureSteps: 2,
            noiseTimeSteps: 1
        }
    };

    const terrainGatherProfiles = {
        rubble: {
            resourceId: 'rubble',
            itemId: 'raw_rubble',
            sourceLabel: 'осыпь',
            collectedLabel: 'щебень',
            adviceKey: 'rubble',
            legacyHarvestItemIds: ['rubbleChunk'],
            conversionHint: 'Собери сырьё и выбери его в сумке: пять единиц можно сжать в гравийную засыпку.',
            allowAdjacent: false,
            gatherCost: {
                routeCost: 1.4,
                timeSteps: 2
            },
            gatherRisk: cloneValue(lateGatherRiskProfiles.rubble)
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
            clickToCollect: true,
            gatherCost: {
                routeCost: 1.35,
                timeSteps: 2
            },
            gatherRisk: cloneValue(lateGatherRiskProfiles.stone)
        },
        reeds: buildSubtypeTerrainGatherProfile('lowlandGrass', {
            conversionHint: 'Собери сырьё и выбери его в сумке: пять единиц идут в базу лечения, а десять на верстаке в верёвку.',
            allowAdjacent: false,
            gatherCost: {
                routeCost: 0.85,
                timeSteps: 1
            }
        }),
        grass: buildSubtypeTerrainGatherProfile('fieldGrass', {
            conversionHint: 'Собери сырьё и выбери его в сумке: пять единиц идут в базу лечения или травяную пасту, а десять на верстаке в верёвку.',
            allowAdjacent: false,
            gatherCost: {
                routeCost: 0.75,
                timeSteps: 1
            }
        })
    };

    function buildFishingGatherProfile(sourceLabel, overrides = {}) {
        return {
            resourceId: 'fish',
            resourceFamilyId: 'fish',
            itemId: 'raw_fish',
            sourceLabel,
            collectedLabel: 'рыбу',
            adviceKey: 'fish',
            conversionHint: 'Собери улов и выбери его в сумке: пять единиц любой рыбы идут в рыбное мясо, а десять — в рыбий жир. На ранних островах ловится обычная рыба, в середине — редкая, в поздней игре — трофейная.',
            allowAdjacent: true,
            gatherCost: {
                routeCost: 1.45,
                timeSteps: 2
            },
            gatherRisk: cloneValue(lateGatherRiskProfiles.fish),
            requiredInventoryItemId: 'fishingRod',
            requiredInventoryItemLabel: 'Удочка путника',
            unlockHint: 'Удочка открывает рыбалку у берега, в тростнике, на спокойной воде и в редких точках.',
            ...cloneValue(overrides)
        };
    }

    const resourceNodeDefinitions = [
        {
            id: 'grassBush',
            resourceId: 'grass',
            label: 'Куст травы',
            family: 'flora',
            renderKind: 'bush',
            respawnPolicy: {
                mode: 'newRun'
            },
            durabilityProfile: {
                maxHarvests: 2,
                regenerationTimeAdvances: 1
            },
            summary: 'Сырьевой куст для ранней полевой травы с лугов и безопасных краёв маршрута.',
            requiredIslands: { from: 1, to: 6 },
            sourceTileTypes: ['grass'],
            preferredTileTypes: ['grass'],
            placementProfile: {
                biomeLabel: 'meadow/grass',
                allowedTravelBands: ['normal', 'rough'],
                clusterProfile: {
                    minCount: 2,
                    maxCount: 3,
                    radius: 1,
                    includeDiagonals: true
                },
                neighborRequirements: [
                    {
                        matchTileTypes: ['grass'],
                        minCount: 3,
                        includeDiagonals: true
                    }
                ]
            },
            gatherProfile: {
                resourceId: 'grass',
                resourceFamilyId: 'grass',
                itemId: 'raw_grass',
                sourceLabel: 'луговой куст травы',
                collectedLabel: 'траву',
                adviceKey: 'grass',
                conversionHint: 'Собери сырьё и выбери его в сумке: пять единиц идут в базу лечения или травяную пасту, а десять на верстаке в верёвку.',
                allowAdjacent: true,
                gatherCost: {
                    routeCost: 0.75,
                    timeSteps: 1
                }
            }
        },
        {
            id: 'reedPatch',
            resourceId: 'reeds',
            label: 'Заросли тростника',
            family: 'flora',
            renderKind: 'reedPatch',
            respawnPolicy: {
                mode: 'newRun'
            },
            durabilityProfile: {
                maxHarvests: 2,
                regenerationTimeAdvances: 1
            },
            summary: 'Прибрежный тростник: даёт волокно под лечебную основу и верёвку.',
            requiredIslands: { from: 1, to: 30 },
            sourceTileTypes: ['reeds'],
            preferredTileTypes: ['reeds'],
            placementProfile: {
                biomeLabel: 'water/reeds',
                allowedTravelBands: ['normal', 'rough'],
                clusterProfile: {
                    minCount: 2,
                    maxCount: 3,
                    radius: 1,
                    includeDiagonals: true
                },
                neighborRequirements: [
                    {
                        matchTileTypes: ['reeds', 'water', 'shore'],
                        minCount: 2,
                        includeDiagonals: true
                    }
                ]
            },
            gatherProfile: {
                resourceId: 'reeds',
                resourceFamilyId: 'reeds',
                itemId: 'raw_reeds',
                sourceLabel: 'заросли тростника',
                collectedLabel: 'тростник',
                adviceKey: 'reeds',
                conversionHint: 'Собери сырьё и выбери его в сумке: пять единиц идут в базу лечения, а десять на верстаке в верёвку.',
                allowAdjacent: true,
                gatherCost: {
                    routeCost: 0.85,
                    timeSteps: 1
                }
            }
        },
        {
            id: 'stonePile',
            resourceId: 'stone',
            label: 'Каменная куча',
            family: 'mineral',
            renderKind: 'stonePile',
            respawnPolicy: {
                mode: 'singleUse'
            },
            durabilityProfile: {
                maxHarvests: 1,
                regenerationTimeAdvances: 0
            },
            summary: 'Тяжёлый каменный выступ для маршрутов, где нужен запас под блоки и мосты.',
            requiredIslands: { from: 4, to: 15 },
            sourceTileTypes: ['rock'],
            preferredTileTypes: ['rock'],
            gatherProfile: {
                resourceId: 'stone',
                resourceFamilyId: 'stone',
                itemId: 'raw_stone',
                sourceLabel: 'каменная куча',
                collectedLabel: 'камень',
                adviceKey: 'stone',
                conversionHint: 'Собери сырьё и выбери его в сумке: пять единиц можно сжать в каменный блок.',
                allowAdjacent: true,
                clickToCollect: true,
                gatherCost: {
                    routeCost: 1.35,
                    timeSteps: 2
                },
                gatherRisk: cloneValue(lateGatherRiskProfiles.stone)
            }
        },
        {
            id: 'rubbleScree',
            resourceId: 'rubble',
            label: 'Щебёночная осыпь',
            family: 'mineral',
            renderKind: 'rubblePile',
            respawnPolicy: {
                mode: 'hardLimited',
                islandLimit: 3,
                limitGroupId: 'rubble'
            },
            durabilityProfile: {
                maxHarvests: 2,
                regenerationTimeAdvances: 0
            },
            summary: 'Сыпучая осыпь под ремонт и дешёвый строительный заполнитель.',
            requiredIslands: { from: 7, to: 24 },
            sourceTileTypes: ['rubble'],
            preferredTileTypes: ['rubble'],
            placementProfile: {
                biomeLabel: 'badSector/rubble',
                allowedTravelZoneKeys: ['badSector'],
                allowTravelZoneFallback: true,
                neighborRequirements: [
                    {
                        matchTileTypes: ['rubble', 'rock'],
                        minCount: 1,
                        includeDiagonals: true
                    }
                ]
            },
            gatherProfile: {
                resourceId: 'rubble',
                resourceFamilyId: 'rubble',
                itemId: 'raw_rubble',
                sourceLabel: 'щебёночная осыпь',
                collectedLabel: 'щебень',
                adviceKey: 'rubble',
                conversionHint: 'Собери сырьё и выбери его в сумке: пять единиц можно сжать в гравийную засыпку.',
                allowAdjacent: true,
                gatherCost: {
                    routeCost: 1.4,
                    timeSteps: 2
                },
                gatherRisk: cloneValue(lateGatherRiskProfiles.rubble)
            }
        },
        {
            id: 'woodTree',
            resourceId: 'wood',
            label: 'Дерево',
            family: 'flora',
            renderKind: 'tree',
            respawnPolicy: {
                mode: 'hardLimited',
                islandLimit: 3,
                limitGroupId: 'wood'
            },
            durabilityProfile: {
                maxHarvests: 2,
                regenerationTimeAdvances: 0
            },
            summary: 'Полезное дерево или коряга для досок, каркасов и лагерного топлива.',
            requiredIslands: { from: 2, to: 30 },
            sourceTileTypes: ['grass', 'shore', 'reeds'],
            preferredTileTypes: ['grass', 'shore'],
            placementProfile: {
                biomeLabel: 'safe-medium',
                allowedTravelBands: ['normal', 'rough'],
                neighborRequirements: [
                    {
                        matchTileTypes: ['grass', 'reeds'],
                        minCount: 2,
                        includeDiagonals: true
                    }
                ]
            },
            gatherProfile: {
                resourceId: 'wood',
                resourceFamilyId: 'wood',
                itemId: 'raw_wood',
                sourceLabel: 'дерево',
                collectedLabel: 'дерево',
                adviceKey: 'wood',
                conversionHint: 'Собери сырьё и выбери его в сумке: пять единиц идут в доску, а десять в каркас.',
                allowAdjacent: true,
                gatherCost: {
                    routeCost: 1.55,
                    timeSteps: 2
                },
                gatherRisk: cloneValue(lateGatherRiskProfiles.wood)
            }
        },
        {
            id: 'waterSource',
            resourceId: 'water',
            label: 'Точка воды',
            family: 'liquid',
            renderKind: 'waterSource',
            respawnPolicy: {
                mode: 'newRun'
            },
            durabilityProfile: {
                maxHarvests: 1,
                regenerationTimeAdvances: 1
            },
            summary: 'Место, где пустая фляга наполняется сырой водой.',
            requiredIslands: { from: 1, to: 30 },
            sourceTileTypes: ['water', 'shore', 'reeds'],
            preferredTileTypes: ['shore', 'reeds', 'water'],
            placementProfile: {
                biomeLabel: 'water/reeds',
                neighborRequirements: [
                    {
                        matchTileTypes: ['water', 'reeds'],
                        minCount: 2,
                        includeDiagonals: true
                    }
                ]
            },
            interactionHint: 'Для воды нужна пустая фляга: здесь набирается сырая вода, а для рецептов нужна уже чистая.',
            gatherProfile: null
        },
        {
            id: 'fishingSpot',
            resourceId: 'fish',
            label: 'Береговая рыболовная точка',
            family: 'aquatic',
            renderKind: 'fishingSpot',
            respawnPolicy: {
                mode: 'newRun'
            },
            durabilityProfile: {
                maxHarvests: 2,
                regenerationTimeAdvances: 1
            },
            summary: 'Береговой заброс: удобная рыбалка с кромки берега, когда рядом есть тихая вода.',
            requiredIslands: { from: 6, to: 30 },
            sourceTileTypes: ['shore'],
            preferredTileTypes: ['shore'],
            placementProfile: {
                biomeLabel: 'shore',
                neighborRequirements: [
                    {
                        matchTileTypes: ['shore', 'water', 'reeds'],
                        minCount: 2,
                        includeDiagonals: true
                    }
                ]
            },
            gatherProfile: buildFishingGatherProfile('береговая точка ловли')
        },
        {
            id: 'fishingReedsSpot',
            resourceId: 'fish',
            label: 'Рыболовная точка в тростнике',
            family: 'aquatic',
            renderKind: 'fishingSpot',
            respawnPolicy: {
                mode: 'newRun'
            },
            durabilityProfile: {
                maxHarvests: 2,
                regenerationTimeAdvances: 1
            },
            summary: 'Тихая точка между тростником: здесь рыба держится ближе к зарослям и укрытию.',
            requiredIslands: { from: 6, to: 30 },
            sourceTileTypes: ['reeds'],
            preferredTileTypes: ['reeds'],
            placementProfile: {
                biomeLabel: 'reeds/water',
                neighborRequirements: [
                    {
                        matchTileTypes: ['reeds', 'water'],
                        minCount: 3,
                        includeDiagonals: true
                    }
                ]
            },
            gatherProfile: buildFishingGatherProfile('тростниковая точка ловли')
        },
        {
            id: 'fishingCalmSpot',
            resourceId: 'fish',
            label: 'Рыболовная точка тихой воды',
            family: 'aquatic',
            renderKind: 'fishingSpot',
            respawnPolicy: {
                mode: 'newRun'
            },
            durabilityProfile: {
                maxHarvests: 2,
                regenerationTimeAdvances: 1
            },
            summary: 'Спокойная вода без лишнего шума: хороший заброс вдали от берега и троп.',
            requiredIslands: { from: 6, to: 30 },
            sourceTileTypes: ['water'],
            preferredTileTypes: ['water'],
            placementProfile: {
                biomeLabel: 'calm-water',
                neighborRequirements: [
                    {
                        matchTileTypes: ['water'],
                        minCount: 5,
                        includeDiagonals: true
                    }
                ]
            },
            gatherProfile: buildFishingGatherProfile('тихая вода')
        },
        {
            id: 'fishingRareSpot',
            resourceId: 'fish',
            label: 'Редкая рыболовная точка',
            family: 'aquatic',
            renderKind: 'fishingSpot',
            respawnPolicy: {
                mode: 'newRun'
            },
            durabilityProfile: {
                maxHarvests: 2,
                regenerationTimeAdvances: 1
            },
            summary: 'Редкая точка заброса в глубокой спокойной воде. Появляется не на каждом острове.',
            requiredIslands: { from: 10, to: 30 },
            sourceTileTypes: ['water'],
            preferredTileTypes: ['water'],
            placementProfile: {
                biomeLabel: 'rare calm-water',
                neighborRequirements: [
                    {
                        matchTileTypes: ['water'],
                        minCount: 5,
                        includeDiagonals: true
                    }
                ]
            },
            gatherProfile: buildFishingGatherProfile('редкая точка ловли', {
                gatherCost: {
                    routeCost: 1.55,
                    timeSteps: 2
                }
            })
        }
    ];
    const resourceNodeById = Object.fromEntries(resourceNodeDefinitions.map((definition) => [definition.id, definition]));

    const resourceCatalogItems = [
        {
            id: 'flask_empty',
            resourceId: 'water',
            label: 'Пустая фляга',
            icon: 'FE',
            lootTier: 1,
            categories: 'utility container',
            extra: {
                stackable: true,
                chestWeight: 6,
                merchantWeight: 8,
                baseValue: 4,
                containerId: 'waterFlask',
                containerStateId: 'waterFlaskEmpty',
                description: 'Пустая фляга под воду. У точки воды она наполняется сырой водой, а в лагере эту воду можно вскипятить в чистую.'
            }
        },
        {
            id: 'flask_water_dirty',
            resourceId: 'water',
            label: 'Фляга сырой воды',
            icon: 'FD',
            lootTier: 1,
            categories: 'consumable survival container',
            extra: {
                stackable: true,
                chestWeight: 0,
                merchantWeight: 0,
                baseValue: 5,
                containerId: 'waterFlask',
                containerStateId: 'waterFlaskDirty',
                description: 'Сырая вода из природного источника. Её можно пить, но в лагере с одной топливной связкой лучше вскипятить её в чистую воду.',
                consumable: {
                    ignoreRecoveryScaling: true,
                    allowPartialHunger: true,
                    hunger: 8,
                    focus: 18,
                    energy: 22
                }
            }
        },
        {
            id: 'flask_water_full',
            resourceId: 'water',
            label: 'Фляга кипячёной воды',
            icon: 'FW',
            lootTier: 1,
            categories: 'consumable survival container',
            extra: {
                stackable: true,
                chestWeight: 10,
                merchantWeight: 10,
                baseValue: 7,
                containerId: 'waterFlask',
                containerStateId: 'waterFlaskFull',
                description: 'Кипячёная вода. Её можно пить и использовать в пищевых лагерных рецептах, а при желании довести дальше до алхимической воды.',
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
            id: 'flask_water_alchemy',
            resourceId: 'water',
            label: 'Фляга алхимической воды',
            icon: 'FA',
            lootTier: 2,
            categories: 'utility survival container',
            extra: {
                stackable: true,
                chestWeight: 0,
                merchantWeight: 0,
                baseValue: 8,
                containerId: 'waterFlask',
                containerStateId: 'waterFlaskAlchemy',
                description: 'Подготовленная вода для лагерной алхимии. Её не пьют напрямую: она идёт в отвары, тоники и сложные настои.'
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
            id: 'raw_reeds',
            resourceId: 'reeds',
            label: 'Тростник',
            icon: 'RT',
            lootTier: 0,
            categories: 'resource material',
            extra: {
                stackable: true,
                baseValue: 2,
                description: 'Прибрежное волокнистое сырьё. Выбери предмет в сумке, чтобы переработать 5 единиц в лечебную основу, а 10 на верстаке в верёвку.'
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
            label: 'Обычная рыба',
            icon: 'RF',
            lootTier: 0,
            categories: 'resource material food',
            extra: {
                stackable: true,
                baseValue: 3,
                spoilage: {
                    spoilsAfterAdvances: 1,
                    spoiledItemId: 'spoiledFish',
                    spoilageLabel: 'свежая только до следующей смены времени'
                },
                description: 'Ранний базовый улов. Пять единиц любой рыбы идут в рыбное мясо, десять — в рыбий жир для лодки, фонарей, поздней утилиты и торговли. Без переработки быстро портится.'
            }
        },
        {
            id: 'raw_fish_rare',
            resourceId: 'fish',
            label: 'Редкая рыба',
            icon: 'RR',
            lootTier: 1,
            categories: 'resource material food value',
            extra: {
                stackable: true,
                baseValue: 6,
                merchantWeight: 5,
                merchantQuestWeight: 2,
                spoilage: {
                    spoilsAfterAdvances: 2,
                    spoiledItemId: 'spoiledFish',
                    spoilageLabel: 'держится дольше обычной, но всё ещё скоропортящаяся'
                },
                description: 'Средний и поздний улов. Идёт в те же рыбные рецепты, но ценится выше обычной рыбы. Без переработки тоже портится, хотя медленнее.'
            }
        },
        {
            id: 'raw_fish_trophy',
            resourceId: 'fish',
            label: 'Трофейная рыба',
            icon: 'TF',
            lootTier: 2,
            categories: 'resource material food value',
            extra: {
                stackable: true,
                baseValue: 10,
                merchantWeight: 4,
                merchantQuestWeight: 3,
                description: 'Поздний трофейный улов. Идёт в общую рыбную переработку, но особенно хорош для дорогой торговли и поздней логистики.'
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

    function getFishCatchDefinition(catchId) {
        return fishCatchById[catchId] ? cloneValue(fishCatchById[catchId]) : null;
    }

    function getFishCatchDefinitions() {
        return fishCatchDefinitions.map((definition) => cloneValue(definition));
    }

    function resolveFishCatchDefinition(islandIndex = game.state.currentIslandIndex || 1) {
        const normalizedIslandIndex = Math.max(1, Math.floor(islandIndex || 1));
        const match = fishCatchDefinitions.find((definition) => {
            const window = definition.requiredIslands || {};
            const fromIsland = Number.isFinite(window.from) ? window.from : 1;
            const toIsland = Number.isFinite(window.to) ? window.to : Infinity;
            return normalizedIslandIndex >= fromIsland && normalizedIslandIndex <= toIsland;
        });

        return cloneValue(match || fishCatchDefinitions[0] || null);
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

    function getResourceNodeDefinition(resourceNodeId) {
        return resourceNodeById[resourceNodeId] ? cloneValue(resourceNodeById[resourceNodeId]) : null;
    }

    function getResourceNodeDefinitions(resourceId = '') {
        const normalizedResourceId = typeof resourceId === 'string' ? resourceId.trim() : '';
        return resourceNodeDefinitions
            .filter((definition) => !normalizedResourceId || definition.resourceId === normalizedResourceId)
            .map((definition) => cloneValue(definition));
    }

    function getResourceNodeRespawnPolicy(definitionOrId) {
        const definition = typeof definitionOrId === 'string'
            ? resourceNodeById[definitionOrId]
            : definitionOrId;
        const policy = definition && definition.respawnPolicy && typeof definition.respawnPolicy === 'object'
            ? definition.respawnPolicy
            : {};
        const mode = typeof policy.mode === 'string' && policy.mode.trim()
            ? policy.mode.trim()
            : 'singleUse';
        const islandLimit = Number.isFinite(policy.islandLimit)
            ? Math.max(1, Math.floor(policy.islandLimit))
            : null;
        const limitGroupId = typeof policy.limitGroupId === 'string' && policy.limitGroupId.trim()
            ? policy.limitGroupId.trim()
            : (definition && definition.resourceId ? definition.resourceId : '');

        return {
            mode,
            islandLimit,
            limitGroupId
        };
    }

    function getResourceNodeRespawnPolicyLabel(policyOrMode) {
        const policy = typeof policyOrMode === 'string'
            ? { mode: policyOrMode }
            : (policyOrMode || {});

        switch (policy.mode) {
            case 'newRun':
                return 'восстанавливается новым забегом';
            case 'hardLimited':
                return policy.islandLimit
                    ? `жёсткий лимит ${policy.islandLimit} на остров`
                    : 'жёстко лимитирован на острове';
            case 'singleUse':
            default:
                return 'одноразовый узел';
        }
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
        resourceNodeDefinitions,
        resourceCatalogItems,
        createValidatedResourceRegistry,
        getBaseResourceDefinition,
        getBaseResourceDefinitions,
        getBaseResourceIds,
        getCatalogResourceItemDefinition,
        getResourceSubtypeDefinition,
        getResourceSubtypeDefinitions,
        getFishCatchDefinition,
        getFishCatchDefinitions,
        resolveFishCatchDefinition,
        buildCatalogEntries,
        getLegacyTerrainGatherItemIds,
        getTerrainGatherProfile,
        getResourceNodeDefinition,
        getResourceNodeDefinitions,
        getResourceNodeRespawnPolicy,
        getResourceNodeRespawnPolicyLabel,
        getTerrainGatherLegacyItemIds,
        normalizeResourceDefinition,
        validateBaseResourceDefinition
    });
})();
