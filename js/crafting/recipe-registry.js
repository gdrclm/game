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
    const RECIPE_CRAFT_TRACKS = Object.freeze({
        compression: 'compression',
        survival: 'survival',
        route: 'route',
        construction: 'construction',
        heavy: 'heavy',
        economy: 'economy',
        ritual: 'ritual'
    });
    const PRACTICAL_RAW_RESOURCE_EXCEPTION_TAG = 'raw-shortcut';
    const RECIPE_PROFILE_IDS = {
        allRecipes: 'allRecipes',
        wave1Minimal: 'wave1Minimal'
    };
    const DEFAULT_ACTIVE_RECIPE_PROFILE_ID = RECIPE_PROFILE_IDS.wave1Minimal;

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

    function normalizeIngredientComponentTags(componentTags) {
        const componentRegistry = getComponentRegistry();
        return componentRegistry && typeof componentRegistry.normalizeComponentTags === 'function'
            ? componentRegistry.normalizeComponentTags(componentTags)
            : normalizeTagList(componentTags);
    }

    function normalizeIngredientQualityLevel(qualityLevel) {
        const componentRegistry = getComponentRegistry();
        return componentRegistry && typeof componentRegistry.normalizeComponentQualityLevel === 'function'
            ? componentRegistry.normalizeComponentQualityLevel(qualityLevel)
            : (typeof qualityLevel === 'string' && qualityLevel.trim() ? qualityLevel.trim() : '');
    }

    function normalizeCraftTrack(craftTrack) {
        return typeof craftTrack === 'string' ? craftTrack.trim().toLowerCase() : '';
    }

    function inferRecipeCraftTrack(normalizedDefinition = {}) {
        const explicitCraftTrack = normalizeCraftTrack(normalizedDefinition.craftTrack);
        if (explicitCraftTrack) {
            return explicitCraftTrack;
        }

        const stationRuntime = getStationRuntime();
        const primaryStationId = Array.isArray(normalizedDefinition.stationOptions) && normalizedDefinition.stationOptions.length > 0
            ? normalizedDefinition.stationOptions[0]
            : normalizedDefinition.station;

        if (stationRuntime && typeof stationRuntime.getStationCraftTracks === 'function') {
            const stationTracks = stationRuntime.getStationCraftTracks(primaryStationId);

            if (stationTracks.includes(RECIPE_CRAFT_TRACKS.construction)) {
                return RECIPE_CRAFT_TRACKS.construction;
            }

            if (stationTracks.length > 0) {
                return normalizeCraftTrack(stationTracks[0]);
            }
        }

        switch (normalizeStationId(primaryStationId)) {
        case 'camp':
            return RECIPE_CRAFT_TRACKS.survival;
        case 'bench':
            return RECIPE_CRAFT_TRACKS.route;
        case 'workbench':
            return RECIPE_CRAFT_TRACKS.construction;
        case 'smithy':
            return RECIPE_CRAFT_TRACKS.heavy;
        case 'scribe':
            return RECIPE_CRAFT_TRACKS.economy;
        case 'altar':
            return RECIPE_CRAFT_TRACKS.ritual;
        case 'hand':
        default:
            return RECIPE_CRAFT_TRACKS.compression;
        }
    }

    function isPracticalRecipeTier(tier) {
        return Number.isFinite(tier) && tier > RECIPE_TIERS.baseConversion;
    }

    function getRawResourceIngredients(recipe) {
        return (Array.isArray(recipe && recipe.ingredients) ? recipe.ingredients : [])
            .filter((ingredient) => ingredient && ingredient.kind === 'resource');
    }

    function allowsPracticalRawShortcut(recipe) {
        return Boolean(
            recipe
            && Array.isArray(recipe.tags)
            && recipe.tags.includes(PRACTICAL_RAW_RESOURCE_EXCEPTION_TAG)
            && recipe.tags.includes('emergency')
        );
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
            craftTrack: inferRecipeCraftTrack({
                ...definition,
                station,
                stationOptions
            }),
            tags: normalizeTagList(definition.tags),
            ingredients: (Array.isArray(definition.ingredients) ? definition.ingredients : [])
                .map((ingredient) => {
                    const normalizedIngredient = cloneValue(ingredient);

                    if (normalizedIngredient && normalizedIngredient.kind === 'component') {
                        normalizedIngredient.componentTags = normalizeIngredientComponentTags(normalizedIngredient.componentTags);
                        if (typeof normalizedIngredient.qualityLevel !== 'undefined') {
                            normalizedIngredient.qualityLevel = normalizeIngredientQualityLevel(normalizedIngredient.qualityLevel);
                        }
                    }

                    return normalizedIngredient;
                })
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

        if (!normalizedDefinition.craftTrack) {
            missingFields.push('craftTrack');
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

        if (stationRuntime && typeof stationRuntime.stationSupportsCraftTrack === 'function') {
            const incompatibleStations = normalizedDefinition.stationOptions.filter((stationOption) => (
                !stationRuntime.stationSupportsCraftTrack(stationOption, normalizedDefinition.craftTrack)
            ));

            if (incompatibleStations.length > 0) {
                throw new Error(
                    `[recipe-registry] Recipe "${normalizedDefinition.recipeId}" uses craftTrack "${normalizedDefinition.craftTrack}" `
                    + `with incompatible station(s): ${incompatibleStations.join(', ')}.`
                );
            }
        }

        const knownResourceIds = buildKnownResourceIdSet(options);
        const knownComponentIds = buildKnownComponentIdSet(options);
        const sourceIngredients = Array.isArray(definition.ingredients) ? definition.ingredients : [];
        normalizedDefinition.ingredients.forEach((ingredient, index) => {
            const sourceIngredient = sourceIngredients[index] || {};

            if (ingredient.kind === 'component') {
                const componentRegistry = getComponentRegistry();
                const unknownTags = componentRegistry && typeof componentRegistry.getUnknownComponentTags === 'function'
                    ? componentRegistry.getUnknownComponentTags(sourceIngredient.componentTags)
                    : [];

                if (unknownTags.length > 0) {
                    throw new Error(`[recipe-registry] Recipe "${normalizedDefinition.recipeId}" uses unknown component tags: ${unknownTags.join(', ')}.`);
                }

                if (typeof sourceIngredient.qualityLevel !== 'undefined' && !ingredient.qualityLevel) {
                    throw new Error(`[recipe-registry] Recipe "${normalizedDefinition.recipeId}" uses an unknown component qualityLevel.`);
                }
            }

            validateRecipeReference(normalizedDefinition, ingredient, knownResourceIds, knownComponentIds, 'ingredient');
        });
        validateRecipeReference(normalizedDefinition, normalizedDefinition.result, knownResourceIds, knownComponentIds, 'result');

        const rawResourceIngredients = getRawResourceIngredients(normalizedDefinition);
        if (rawResourceIngredients.length > 0 && isPracticalRecipeTier(normalizedDefinition.tier) && !allowsPracticalRawShortcut(normalizedDefinition)) {
            throw new Error(
                `[recipe-registry] Recipe "${normalizedDefinition.recipeId}" uses raw resources in a practical tier. `
                + `Practical recipes must consume components unless explicitly tagged `
                + `"${PRACTICAL_RAW_RESOURCE_EXCEPTION_TAG}" and "emergency".`
            );
        }

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

    function createValidatedRecipeProfiles(profileDefinitions, options = {}) {
        const knownRecipeIds = new Set(Object.keys(options.recipeById || {}));
        const definitions = [];
        const byId = Object.create(null);

        (Array.isArray(profileDefinitions) ? profileDefinitions : []).forEach((definition, index) => {
            const normalizedProfileId = typeof definition.profileId === 'string' ? definition.profileId.trim() : '';
            const normalizedLabel = typeof definition.label === 'string' ? definition.label.trim() : '';
            const profileRecipeIds = [...new Set((Array.isArray(definition.recipeIds) ? definition.recipeIds : [])
                .filter((recipeId) => typeof recipeId === 'string' && recipeId.trim())
                .map((recipeId) => recipeId.trim()))];

            if (!normalizedProfileId) {
                throw new Error(`[recipe-registry] Recipe profile #${index + 1} is missing profileId.`);
            }

            if (!normalizedLabel) {
                throw new Error(`[recipe-registry] Recipe profile "${normalizedProfileId}" is missing label.`);
            }

            if (byId[normalizedProfileId]) {
                throw new Error(`[recipe-registry] Duplicate recipe profile "${normalizedProfileId}" detected.`);
            }

            const unknownRecipeIds = profileRecipeIds.filter((recipeId) => !knownRecipeIds.has(recipeId));
            if (unknownRecipeIds.length > 0) {
                throw new Error(`[recipe-registry] Recipe profile "${normalizedProfileId}" references unknown recipes: ${unknownRecipeIds.join(', ')}.`);
            }

            const normalizedDefinition = {
                profileId: normalizedProfileId,
                label: normalizedLabel,
                description: typeof definition.description === 'string' ? definition.description.trim() : '',
                recipeIds: profileRecipeIds
            };

            byId[normalizedProfileId] = normalizedDefinition;
            definitions.push(normalizedDefinition);
        });

        return {
            definitions: definitions.map((definition) => cloneValue(definition)),
            byId: Object.fromEntries(Object.entries(byId).map(([profileId, definition]) => [
                profileId,
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
                    gameplayItemId: 'flask_empty'
                })
            ],
            result: createResult('itemState', 'waterFlaskDirty', 'Фляга сырой воды', 1, {
                gameplayItemId: 'flask_water_dirty'
            }),
            tags: ['base-conversion', 'water', 'survival', 'state-change'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 1, to: 30, priority: 'critical', note: 'Базовая вода нужна на всём маршруте.' }
            ]),
            notes: 'В документах вода существует как состояние фляги: пустая -> полная. В runtime природный источник сначала даёт сырую воду как промежуточное состояние.'
        },
        {
            recipeId: 'boil-water',
            label: 'Вскипятить воду',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('itemState', 'waterFlaskDirty', 'Фляга сырой воды', 1, {
                    gameplayItemId: 'flask_water_dirty'
                }),
                createIngredient('component', 'fuel_bundle', 'Топливная связка', 1)
            ],
            result: createResult('itemState', 'waterFlaskFull', 'Фляга кипячёной воды', 1, {
                gameplayItemId: 'flask_water_full'
            }),
            tags: ['base-conversion', 'water', 'camp', 'fuel', 'survival', 'state-change'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 1, to: 30, priority: 'critical', note: 'Лагерь должен переводить сырую воду в безопасную для рецептов и длинных переходов.' }
            ]),
            notes: 'По craft-документам лагерь отвечает за воду и варку. Здесь сырая вода кипятится в чистую с затратой одной топливной связки.'
        },
        {
            recipeId: 'prepare-alchemy-water',
            label: 'Подготовить алхимическую воду',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.survivalAndEnergy,
            ingredients: [
                createIngredient('itemState', 'waterFlaskFull', 'Фляга кипячёной воды', 1, {
                    gameplayItemId: 'flask_water_full',
                    containerReturn: false
                })
            ],
            result: createResult('itemState', 'waterFlaskAlchemy', 'Фляга алхимической воды', 1, {
                gameplayItemId: 'flask_water_alchemy'
            }),
            tags: ['water', 'camp', 'alchemy', 'state-change'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 1, to: 30, priority: 'recommended', note: 'Отдельный алхимический уровень воды для лагерных настоев и усиленных рецептов.' }
            ]),
            notes: 'Расширение поверх craft-доков: кипячёная вода может быть дополнительно подготовлена в специальную алхимическую форму для не-пищевых лагерных рецептов.'
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
            result: createResult('component', 'healing_base', 'Травяная база лечения', 1, {
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
            recipeId: 'reeds-to-healing-base',
            label: 'Лечебная основа из тростника',
            station: 'hand',
            stationLabel: 'Руки',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('resource', 'reeds', 'Тростник', 5)
            ],
            result: createResult('component', 'healing_base', 'Травяная база лечения', 1, {
                aliases: ['База лечения']
            }),
            tags: ['base-conversion', 'component', 'reeds', 'healing'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 1, to: 12, priority: 'recommended', note: 'Запасной лечебный источник у воды и тростниковых кромок.' },
                { from: 13, to: 30, priority: 'recommended', note: 'Хороший страхующий ресурс, если трава уже снята по маршруту.' }
            ]),
            notes: 'Альтернативный лечебный пакет из 5 единиц тростника.'
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
            result: createResult('component', 'herb_paste', 'Травяная паста', 1),
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
            result: createResult('component', 'fiber_rope', 'Верёвка', 1, {
                aliases: ['Верёвка из волокна'],
                gameplayItemId: 'fiber_rope'
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
            recipeId: 'reeds-to-rope',
            label: 'Верёвка из тростника',
            station: 'bench',
            stationLabel: 'Верстак',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('resource', 'reeds', 'Тростник', 10)
            ],
            result: createResult('component', 'fiber_rope', 'Верёвка', 1, {
                aliases: ['Верёвка из тростника'],
                gameplayItemId: 'fiber_rope'
            }),
            tags: ['base-conversion', 'component', 'reeds', 'movement', 'construction'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 4, to: 6, priority: 'critical', note: 'Позволяет собрать первую верёвку даже на водных кромках.' },
                { from: 13, to: 18, priority: 'critical', note: 'Поддерживает лодку и ремонт, если основной травяной слой уже снят.' },
                { from: 25, to: 27, priority: 'recommended', note: 'Полезен как резервный волокнистый ресурс в позднем маршруте.' }
            ]),
            notes: 'Верстачная упаковка тростника в тот же утилитарный компонент.'
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
            result: createResult('component', 'stone_block', 'Каменный блок', 1),
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
            result: createResult('component', 'gravel_fill', 'Гравийная засыпка', 1, {
                aliases: ['Заполнитель']
            }),
            tags: ['base-conversion', 'component', 'rubble', 'repair'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 24, priority: 'critical', note: 'Опорный компонент для ремонта мостов и логистики.' }
            ]),
            notes: 'Уплотнённый ремонтный заполнитель из щебня.'
        },
        {
            recipeId: 'stone-rubble-to-gravel-fill',
            label: 'Ремонтный наполнитель',
            station: 'hand',
            stationLabel: 'Руки',
            tier: RECIPE_TIERS.baseConversion,
            ingredients: [
                createIngredient('resource', 'stone', 'Камень', 2),
                createIngredient('resource', 'rubble', 'Щебень', 3)
            ],
            result: createResult('component', 'gravel_fill', 'Гравийная засыпка', 1, {
                aliases: ['Заполнитель', 'Ремонтный наполнитель']
            }),
            tags: ['base-conversion', 'component', 'stone', 'rubble', 'repair', 'mixed-input'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 24, priority: 'recommended', note: 'Альтернативный ремонтный путь, если игрок собрал смесь камня и щебня, но ещё не добрал полный пакет одного ресурса.' }
            ]),
            notes: 'Расширение поверх craft-доков: смешанный базовый рецепт ремонта сохраняет правило 5 сырья -> 1 repair-компонент, но позволяет собрать заполнитель из комбинированного каменно-щебневого пакета.'
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
            result: createResult('component', 'wood_plank_basic', 'Доска', 1),
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
            result: createResult('component', 'wood_frame_basic', 'Каркас', 1),
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
            result: createResult('component', 'fuel_bundle', 'Топливная связка', 1),
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
            result: createResult('component', 'fish_meat', 'Рыбное мясо', 1, {
                gameplayItemId: 'fish_meat'
            }),
            tags: ['base-conversion', 'component', 'fish', 'food', 'camp'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 21, priority: 'critical', note: 'Основной пищевой компонент длинных серий.' }
            ]),
            notes: 'Лагерная разделка любого рыбного улова в пищевой компонент. Gameplay-слой принимает обычную, редкую и трофейную рыбу как одну семейную resource-ветку.'
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
            result: createResult('component', 'fish_oil', 'Рыбий жир', 1, {
                gameplayItemId: 'fish_oil'
            }),
            tags: ['base-conversion', 'component', 'fish', 'oil', 'camp'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 16, to: 18, priority: 'critical', note: 'Обязателен для готовой лодки.' },
                { from: 25, to: 27, priority: 'recommended', note: 'Полезен в поздней логистике и утилите.' }
            ]),
            notes: 'Плотный лагерный компонент для лодки и поздних рецептов. Gameplay-слой принимает любую рыбу семейства fish, а не только ранний обычный улов.'
        },
        {
            recipeId: 'healing-brew',
            label: 'Отвар лечения',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.survivalAndEnergy,
            ingredients: [
                createIngredient('itemState', 'waterFlaskAlchemy', 'Фляга алхимической воды', 1, { gameplayItemId: 'flask_water_alchemy' }),
                createIngredient('component', 'healing_base', 'Травяная база лечения', 1)
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
                createIngredient('itemState', 'waterFlaskAlchemy', 'Фляга алхимической воды', 1, { gameplayItemId: 'flask_water_alchemy' }),
                createIngredient('component', 'herb_paste', 'Травяная паста', 1)
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
                createIngredient('component', 'fish_meat', 'Рыбное мясо', 1),
                createIngredient('component', 'fuel_bundle', 'Топливная связка', 1)
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
            recipeId: 'raw-fish-ration',
            label: 'Сухпаёк из улова',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.survivalAndEnergy,
            ingredients: [
                createIngredient('resource', 'fish', 'Рыба', 5),
                createIngredient('component', 'fuel_bundle', 'Топливная связка', 1)
            ],
            result: createResult('item', 'ration', 'Сухпаёк', 1, {
                gameplayItemId: 'ration'
            }),
            tags: ['survival', 'food', 'camp', 'ration', 'shortcut', 'emergency', 'fish', 'raw-shortcut'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 21, priority: 'recommended', note: 'Прямой походный сухпаёк из свежего улова, когда игроку важнее темп, чем промежуточный компонент.' }
            ]),
            notes: 'Осознанное emergency-исключение поверх документов: GDD допускает сухпаёк как крафт из еды, но craft-доки сохраняют основное правило, что практические рецепты должны идти через промежуточные компоненты.'
        },
        {
            recipeId: 'fish-broth',
            label: 'Рыбный бульон',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.survivalAndEnergy,
            ingredients: [
                createIngredient('component', 'fish_meat', 'Рыбное мясо', 1),
                createIngredient('itemState', 'waterFlaskFull', 'Фляга кипячёной воды', 1, { gameplayItemId: 'flask_water_full' }),
                createIngredient('component', 'fuel_bundle', 'Топливная связка', 1)
            ],
            result: createResult('item', 'fishBroth', 'Рыбный бульон', 1, {
                gameplayItemId: 'fishBroth'
            }),
            tags: ['survival', 'food', 'camp', 'broth', 'emergency', 'fish'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 18, priority: 'recommended', note: 'Лёгкая горячая еда на случай, когда нужен быстрый recovery, но ещё рано тратить редкие травяные компоненты.' }
            ]),
            notes: 'Простая аварийная рыбная еда. В отличие от крепкого бульона не требует травяной пасты и даёт более дешёвую горячую поддержку темпа.'
        },
        {
            recipeId: 'hearty-ration',
            label: 'Сытный паёк',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.survivalAndEnergy,
            ingredients: [
                createIngredient('component', 'fish_meat', 'Рыбное мясо', 1),
                createIngredient('itemState', 'waterFlaskFull', 'Фляга кипячёной воды', 1, { gameplayItemId: 'flask_water_full' }),
                createIngredient('component', 'fuel_bundle', 'Топливная связка', 1)
            ],
            result: createResult('item', 'heartyRation', 'Сытный паёк', 1),
            tags: ['survival', 'food', 'camp', 'ration'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 18, priority: 'critical', note: 'Нужен с 7 острова для длинных маршрутов.' }
            ]),
            notes: 'Усиленный рацион с водой для средней фазы.'
        },
        {
            recipeId: 'salted-fish',
            label: 'Солёная рыба',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.survivalAndEnergy,
            ingredients: [
                createIngredient('component', 'fish_meat', 'Рыбное мясо', 1),
                createIngredient('item', 'survivalSalt', 'Соль выживания', 1)
            ],
            result: createResult('item', 'saltedFish', 'Солёная рыба', 1, {
                gameplayItemId: 'saltedFish'
            }),
            tags: ['survival', 'food', 'camp', 'emergency', 'fish', 'preserved'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 21, priority: 'situational', note: 'Полезна, когда игрок хочет быстро законсервировать улов и не держать сырьё в сумке.' }
            ]),
            notes: 'Расширение поверх craft-доков: в документах нет отдельной солёной рыбы, поэтому это интерпретация через существующую Соль выживания как быстрый способ перевести рыбу в непортящуюся аварийную еду.'
        },
        {
            recipeId: 'strong-broth',
            label: 'Крепкий бульон',
            station: 'camp',
            stationLabel: 'Лагерь',
            tier: RECIPE_TIERS.survivalAndEnergy,
            ingredients: [
                createIngredient('component', 'fish_meat', 'Рыбное мясо', 2),
                createIngredient('itemState', 'waterFlaskFull', 'Фляга кипячёной воды', 1, { gameplayItemId: 'flask_water_full' }),
                createIngredient('component', 'herb_paste', 'Травяная паста', 1),
                createIngredient('component', 'fuel_bundle', 'Топливная связка', 1)
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
                createIngredient('component', 'healing_base', 'Травяная база лечения', 1),
                createIngredient('component', 'herb_paste', 'Травяная паста', 1),
                createIngredient('itemState', 'waterFlaskAlchemy', 'Фляга алхимической воды', 1, { gameplayItemId: 'flask_water_alchemy' })
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
            stationLabel: 'Верстак',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'wood_plank_basic', 'Доска', 2),
                createIngredient('component', 'fiber_rope', 'Верёвка', 1, { gameplayItemId: 'fiber_rope' }),
                createIngredient('component', 'stone_block', 'Каменный блок', 1)
            ],
            result: createResult('item', 'bridge_kit', 'Мост-комплект', 1, {
                gameplayItemId: 'bridge_kit'
            }),
            tags: ['construction', 'movement', 'bridge', 'utility'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 4, to: 6, priority: 'critical', note: 'Главное окно первого маршрутного барьера.' },
                { from: 7, to: 15, priority: 'recommended', note: 'Полезен как запас под разломы и обходы.' }
            ]),
            notes: 'Ключевой ранний craft output для доступа к карте. Готовый переносной мост при этом может отдельно встречаться в луте и торговле как ready-made версия.'
        },
        {
            recipeId: 'portable-bridge-assembly',
            label: 'Собрать переносной мост',
            station: 'bench',
            stationLabel: 'Верстак',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('item', 'bridge_kit', 'Мост-комплект', 1)
            ],
            result: createResult('item', 'portableBridge', 'Переносной мост', 1, {
                gameplayItemId: 'portableBridge'
            }),
            tags: ['construction', 'movement', 'bridge', 'utility', 'ready-item'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 4, to: 9, priority: 'critical', note: 'Готовая компактная переправа под первые разломы и воду.' },
                { from: 10, to: 15, priority: 'recommended', note: 'Удобнее переносить, чем сырой мост-комплект.' }
            ]),
            notes: 'Переводит грубый мост-комплект в готовый переносной мост без изменения его базовой функции.'
        },
        {
            recipeId: 'reinforced-bridge-upgrade',
            label: 'Усилить переносной мост',
            station: 'workbench',
            stationLabel: 'Мастерская',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('item', 'portableBridge', 'Переносной мост', 1),
                createIngredient('component', 'stone_block', 'Каменный блок', 1),
                createIngredient('component', 'fiber_rope', 'Верёвка', 1, { gameplayItemId: 'fiber_rope' })
            ],
            result: createResult('item', 'reinforcedBridge', 'Усиленный мост', 1, {
                gameplayItemId: 'reinforcedBridge'
            }),
            tags: ['construction', 'movement', 'bridge', 'utility', 'advanced-upgrade'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 15, priority: 'recommended', note: 'Надёжная двухклеточная переправа для середины маршрута.' },
                { from: 16, to: 21, priority: 'recommended', note: 'Позволяет не срываться на поздних узких проходах.' }
            ]),
            notes: 'Системный апгрейд базового переносного моста через каменный и верёвочный пакет.'
        },
        {
            recipeId: 'field-bridge-upgrade',
            label: 'Собрать полевой мостик',
            station: 'bench',
            stationLabel: 'Верстак',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('item', 'portableBridge', 'Переносной мост', 1),
                createIngredient('component', 'wood_plank_basic', 'Доска', 1),
                createIngredient('component', 'fiber_rope', 'Верёвка', 1, { gameplayItemId: 'fiber_rope' })
            ],
            result: createResult('item', 'fieldBridge', 'Полевой мостик', 1, {
                gameplayItemId: 'fieldBridge'
            }),
            tags: ['construction', 'movement', 'bridge', 'utility', 'advanced-upgrade'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 10, to: 18, priority: 'recommended', note: 'Нужен, когда хочется держать мостовой запас легче и мобильнее.' },
                { from: 19, to: 24, priority: 'optional', note: 'Полезен как маршрутный запасной вариант.' }
            ]),
            notes: 'Полевая облегчённая переработка базового моста в более удобный походный вариант.'
        },
        {
            recipeId: 'absolute-bridge-upgrade',
            label: 'Собрать абсолютный мост',
            station: 'workbench',
            stationLabel: 'Мастерская',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('item', 'reinforcedBridge', 'Усиленный мост', 1),
                createIngredient('item', 'fieldBridge', 'Полевой мостик', 1),
                createIngredient('component', 'stone_block', 'Каменный блок', 1)
            ],
            result: createResult('item', 'absoluteBridge', 'Абсолютный мост', 1, {
                gameplayItemId: 'absoluteBridge'
            }),
            tags: ['construction', 'movement', 'bridge', 'utility', 'advanced-upgrade', 'legendary'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 25, to: 30, priority: 'recommended', note: 'Эндгейм-мост для маршрутов, где цена одной ошибки уже критична.' }
            ]),
            notes: 'Поздний апгрейд мостовой ветки, который сжимает несколько переправ в один мощный предмет.'
        },
        {
            recipeId: 'bridge-repair-kit',
            label: 'Ремкомплект моста',
            station: 'workbench',
            stationLabel: 'Мастерская',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'wood_plank_basic', 'Доска', 1),
                createIngredient('component', 'gravel_fill', 'Гравийная засыпка', 1, {
                    aliases: ['Заполнитель']
                }),
                createIngredient('component', 'fiber_rope', 'Верёвка', 1, { gameplayItemId: 'fiber_rope' })
            ],
            result: createResult('item', 'repair_kit_bridge', 'Ремкомплект моста', 1, {
                gameplayItemId: 'repair_kit_bridge'
            }),
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
                createIngredient('component', 'wood_frame_basic', 'Каркас', 1),
                createIngredient('component', 'wood_plank_basic', 'Доска', 2),
                createIngredient('component', 'fiber_rope', 'Верёвка', 2, { gameplayItemId: 'fiber_rope' })
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
                createIngredient('component', 'fish_oil', 'Рыбий жир', 1),
                createIngredient('component', 'fiber_rope', 'Верёвка', 1, { gameplayItemId: 'fiber_rope' })
            ],
            result: createResult('item', 'boat_ready', 'Готовая лодка', 1, {
                gameplayItemId: 'boat_ready'
            }),
            tags: ['construction', 'boat', 'water-access', 'utility'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 16, to: 18, priority: 'critical', note: 'Жёстко нужна к водной фазе.' }
            ]),
            notes: 'Финальный production-шаг лодочной ветки: рама, рыбий жир и верёвка собираются в готовую лодку как отдельный craft output.'
        },
        {
            recipeId: 'boat-repair-kit',
            label: 'Ремкомплект лодки',
            station: 'workbench',
            stationLabel: 'Мастерская',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'wood_plank_basic', 'Доска', 1),
                createIngredient('component', 'fish_oil', 'Рыбий жир', 1),
                createIngredient('component', 'fiber_rope', 'Верёвка', 1, { gameplayItemId: 'fiber_rope' })
            ],
            result: createResult('item', 'repair_kit_boat', 'Ремкомплект лодки', 1, {
                gameplayItemId: 'repair_kit_boat'
            }),
            tags: ['construction', 'repair', 'boat', 'utility'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 16, to: 30, priority: 'critical', note: 'После 16 острова нужен как постоянная страховка.' }
            ]),
            notes: 'Ремонтный комплект для поддержания лодки в рабочем состоянии.'
        },
        {
            recipeId: 'wood-plank-to-trade-papers',
            label: 'Торговые бумаги',
            station: 'scribe',
            stationLabel: 'Писарь',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'wood_plank_basic', 'Доска', 1)
            ],
            result: createResult('item', 'trade_papers', 'Торговые бумаги', 1, {
                gameplayItemId: 'trade_papers'
            }),
            tags: ['economy', 'trade', 'value', 'scribe'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 8, to: 18, priority: 'recommended', note: 'Дешёвая конверсия лишней древесины в переносимую ценность после открытия писаря.' },
                { from: 19, to: 24, priority: 'situational', note: 'Работает как безопасный нижний слой экономического крафта, не подменяя поздний лут.' }
            ]),
            notes: 'Контролируемый экономический крафт: один пакет древесины, уже сжатый из 5 дерева, превращается в дешёвые торговые бумаги. Это поддерживает экономику, не нарушая запрет на прямой крафт дорогих ценностей из raw-ресурсов.'
        },
        {
            recipeId: 'stone-block-to-market-seal',
            label: 'Рыночная печать',
            station: 'scribe',
            stationLabel: 'Писарь',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'stone_block', 'Каменный блок', 1)
            ],
            result: createResult('item', 'market_seal', 'Рыночная печать', 1, {
                gameplayItemId: 'market_seal'
            }),
            tags: ['economy', 'trade', 'value', 'scribe'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 8, to: 18, priority: 'recommended', note: 'Второй дешёвый выход для обмена, если лишний камень уже сжат в блок.' },
                { from: 19, to: 24, priority: 'situational', note: 'Помогает унести ценность, не конвертируя базовый камень напрямую в дорогой лут.' }
            ]),
            notes: 'Низкотирная экономическая ветка через писаря: каменный блок как эквивалент 5 камня превращается в дешёвую продаваемую ценность.'
        },
        {
            recipeId: 'road-chalk',
            label: 'Мел дорожника',
            station: 'bench',
            stationLabel: 'Верстак',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'stone_block', 'Каменный блок', 1)
            ],
            result: createResult('item', 'roadChalk', 'Мел дорожника', 1, {
                gameplayItemId: 'roadChalk'
            }),
            tags: ['utility', 'info', 'route', 'bench'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 12, priority: 'recommended', note: 'Простой маршрутный инструмент для первых дорогих развилок.' },
                { from: 13, to: 18, priority: 'situational', note: 'Полезен как дешёвая подсказка, если не хочется тратить более сильную утилиту.' }
            ]),
            notes: 'Базовый информационный инструмент из каменного пакета. Даёт маршрутную подсказку без поздних материалов.'
        },
        {
            recipeId: 'path-marker',
            label: 'Маркер пути',
            station: 'bench',
            stationLabel: 'Верстак',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('item', 'roadChalk', 'Мел дорожника', 1),
                createIngredient('component', 'fiber_rope', 'Верёвка', 1, { gameplayItemId: 'fiber_rope' })
            ],
            result: createResult('item', 'pathMarker', 'Маркер пути', 1, {
                gameplayItemId: 'pathMarker'
            }),
            tags: ['utility', 'info', 'route', 'bench'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 7, to: 15, priority: 'recommended', note: 'Сильнее обычного мела и уже реально экономит дорогие шаги.' },
                { from: 16, to: 21, priority: 'situational', note: 'Остаётся рабочим способом быстро прочитать маршрут в длинной логистике.' }
            ]),
            notes: 'Усиленная маршрутная утилита, которая собирается не из сырья напрямую, а из базового мела и верёвки.'
        },
        {
            recipeId: 'safe-house-seal',
            label: 'Печать безопасного дома',
            station: 'workbench',
            stationLabel: 'Мастерская',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'wood_plank_basic', 'Доска', 1),
                createIngredient('component', 'fish_oil', 'Рыбий жир', 1),
                createIngredient('component', 'healing_base', 'Травяная база лечения', 1)
            ],
            result: createResult('item', 'safeHouseSeal', 'Печать безопасного дома', 1, {
                gameplayItemId: 'safeHouseSeal'
            }),
            tags: ['utility', 'survival', 'protection', 'workbench'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 16, to: 18, priority: 'critical', note: 'Окно, где безопасный дом уже влияет на выживание сильнее обычной еды.' },
                { from: 19, to: 24, priority: 'recommended', note: 'Поддерживает стабильность, когда цена ошибки в логистике уже велика.' }
            ]),
            notes: 'Поздняя защитная утилита из дерева, рыбьего жира и лечебной базы: больше не живёт только как лут.'
        },
        {
            recipeId: 'fog-lantern',
            label: 'Фонарь тумана',
            station: 'workbench',
            stationLabel: 'Мастерская',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'wood_plank_basic', 'Доска', 1),
                createIngredient('component', 'fish_oil', 'Рыбий жир', 1),
                createIngredient('component', 'fiber_rope', 'Верёвка', 1, { gameplayItemId: 'fiber_rope' })
            ],
            result: createResult('item', 'fogLantern', 'Фонарь тумана', 1, {
                gameplayItemId: 'fogLantern'
            }),
            tags: ['utility', 'info', 'light', 'oil', 'workbench'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 10, to: 18, priority: 'critical', note: 'Даёт свет и чтение карты в туманных и дорогих маршрутах.' }
            ]),
            notes: 'Интерпретация item-list из craft-доков: рыбный жир здесь работает как честное масляное топливо фонаря.'
        },
        {
            recipeId: 'merchant-beacon',
            label: 'Маяк торговца',
            station: 'workbench',
            stationLabel: 'Мастерская',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'stone_block', 'Каменный блок', 1),
                createIngredient('component', 'fish_oil', 'Рыбий жир', 1),
                createIngredient('component', 'fiber_rope', 'Верёвка', 1, { gameplayItemId: 'fiber_rope' })
            ],
            result: createResult('item', 'merchantBeacon', 'Маяк торговца', 1, {
                gameplayItemId: 'merchantBeacon'
            }),
            tags: ['utility', 'info', 'trade', 'late', 'oil', 'workbench'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 16, to: 24, priority: 'recommended', note: 'Помогает искать торговца и не тратить поздние шаги вслепую.' }
            ]),
            notes: 'Поздняя сигнальная утилита на базе рыбьего жира: расширяет рыбий жир из просто еды в экономический и маршрутный ресурс.'
        },
        {
            recipeId: 'relic-case',
            label: 'Футляр реликвий',
            station: 'scribe',
            stationLabel: 'Писарь',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('item', 'trade_papers', 'Торговые бумаги', 1),
                createIngredient('item', 'market_seal', 'Рыночная печать', 1),
                createIngredient('component', 'wood_plank_basic', 'Доска', 1)
            ],
            result: createResult('item', 'relicCase', 'Футляр реликвий', 1, {
                gameplayItemId: 'relicCase'
            }),
            tags: ['utility', 'trade', 'collector_loadout', 'info', 'scribe'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 22, to: 24, priority: 'critical', note: 'Коллекционерское окно, где ценный лут имеет смысл только если его можно заранее прочитать и выгодно вывести.' }
            ]),
            notes: 'Поздняя экономическая сборка под коллекционерский стиль: не усиливает цифры напрямую, а меняет работу с дорогими домами и выводом ценностей.'
        },
        {
            recipeId: 'tool-holster',
            label: 'Кобура инструмента',
            station: 'workbench',
            stationLabel: 'Мастерская',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('item', 'pathMarker', 'Маркер пути', 1),
                createIngredient('component', 'fiber_rope', 'Верёвка', 1, { gameplayItemId: 'fiber_rope' }),
                createIngredient('component', 'wood_plank_basic', 'Доска', 1)
            ],
            result: createResult('item', 'toolHolster', 'Кобура инструмента', 1, {
                gameplayItemId: 'toolHolster'
            }),
            tags: ['utility', 'route', 'collector_loadout', 'workbench'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 21, to: 24, priority: 'recommended', note: 'Перестраивает late-mid сумку под инструментальные рывки и длинные связки шагов.' }
            ]),
            notes: 'Поздний переход от просто переноски вещей к инструментальному стилю маршрута: удобнее старт движения, длиннее связки, дешевле переправы.'
        },
        {
            recipeId: 'storm-boots',
            label: 'Штормовые сапоги',
            station: 'smithy',
            stationLabel: 'Кузница',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'stone_block', 'Каменный блок', 1),
                createIngredient('component', 'fish_oil', 'Рыбий жир', 1),
                createIngredient('component', 'fiber_rope', 'Верёвка', 1, { gameplayItemId: 'fiber_rope' }),
                createIngredient('material', 'metal', 'Металл', 1)
            ],
            result: createResult('item', 'stormBoots', 'Штормовые сапоги', 1, {
                gameplayItemId: 'stormBoots'
            }),
            tags: ['movement', 'route', 'endgame_route', 'smithy', 'risk'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 25, to: 27, priority: 'critical', note: 'Окно, где важнее не +цифра, а способность стабильно проходить плохие и узкие зоны.' }
            ]),
            notes: 'Поздняя маршрутная сборка под эндгейм-логистику: сапоги не просто удешевляют путь, а позволяют иначе выбирать сам маршрут.'
        },
        {
            recipeId: 'anchor-line',
            label: 'Якорная линия',
            station: 'smithy',
            stationLabel: 'Кузница',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'wood_frame_basic', 'Каркас', 1),
                createIngredient('component', 'fish_oil', 'Рыбий жир', 1),
                createIngredient('component', 'fiber_rope', 'Верёвка', 1, { gameplayItemId: 'fiber_rope' }),
                createIngredient('material', 'metal', 'Металл', 1)
            ],
            result: createResult('item', 'anchorLine', 'Якорная линия', 1, {
                gameplayItemId: 'anchorLine'
            }),
            tags: ['utility', 'route', 'water', 'endgame_route', 'smithy'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 25, to: 27, priority: 'critical', note: 'Эндгейм-маршрут, где нужна кнопка аварийного отката к безопасной точке, а не ещё один мелкий бонус.' }
            ]),
            notes: 'Поздняя страховочная ветка. Меняет стиль late-game с greed на контролируемый проход через одну сильную аварийную кнопку.'
        },
        {
            recipeId: 'island-drill',
            label: 'Островная дрель',
            station: 'smithy',
            stationLabel: 'Кузница',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'stone_block', 'Каменный блок', 2),
                createIngredient('component', 'wood_frame_basic', 'Каркас', 1),
                createIngredient('component', 'fish_oil', 'Рыбий жир', 1),
                createIngredient('material', 'metal', 'Металл', 1)
            ],
            result: createResult('item', 'islandDrill', 'Островная дрель', 1, {
                gameplayItemId: 'islandDrill'
            }),
            tags: ['construction', 'utility', 'endgame', 'smithy', 'heavy_utility', 'endgame_route'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 25, to: 27, priority: 'critical', note: 'Эндгейм-рецепт тяжёлой маршрутной утилиты.' }
            ]),
            notes: 'Поздний кузнечный рецепт на тяжёлый инструмент. В late-game это уже не просто ещё один предмет, а способ сбросить локальное давление маршрута.'
        },
        {
            recipeId: 'black-cup',
            label: 'Чёрный кубок',
            station: 'altar',
            stationLabel: 'Алтарь',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('component', 'healing_base', 'Травяная база лечения', 1),
                createIngredient('component', 'fish_oil', 'Рыбий жир', 1),
                createIngredient('itemState', 'waterFlaskAlchemy', 'Фляга алхимической воды', 1, { gameplayItemId: 'flask_water_alchemy' })
            ],
            result: createResult('item', 'blackCup', 'Чёрный кубок', 1, {
                gameplayItemId: 'blackCup'
            }),
            tags: ['ritual', 'survival', 'final_survival', 'altar', 'risk'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 28, to: 29, priority: 'situational', note: 'Сильный, но рискованный островной ритуал под финальную подготовку и только под проход.' }
            ]),
            notes: 'Финальный situational рецепт из воды, травы и рыбы. Даёт сильный островной бафф с ценой в повышенном drain, поэтому это не greedy кнопка, а сознательный выбор.'
        },
        {
            recipeId: 'last-vow',
            label: 'Последний обет',
            station: 'altar',
            stationLabel: 'Алтарь',
            tier: RECIPE_TIERS.buildWaterAndRepair,
            ingredients: [
                createIngredient('item', 'blackCup', 'Чёрный кубок', 1),
                createIngredient('item', 'secondWind', 'Второе дыхание', 1),
                createIngredient('itemState', 'waterFlaskAlchemy', 'Фляга алхимической воды', 1, { gameplayItemId: 'flask_water_alchemy' })
            ],
            result: createResult('item', 'lastVow', 'Последний обет', 1, {
                gameplayItemId: 'lastVow'
            }),
            tags: ['ritual', 'movement', 'final_survival', 'guaranteed_route', 'altar', 'risk'],
            islandNeedProfile: createIslandNeedProfile([
                { from: 28, to: 30, priority: 'critical', note: 'Финальный проход, где нужен короткий сильный рывок через тяжёлые зоны, а не ещё один обычный бафф.' }
            ]),
            notes: 'Финальная ритуальная сборка под закрытие острова. Сильно меняет style прохождения последних карт, потому что превращает предмет в кнопку решающего прорыва.'
        }
    ];

    const builtRecipeRegistry = createValidatedRecipeRegistry(recipeDefinitions, {
        devMode: isDevMode()
    });
    const recipes = builtRecipeRegistry.definitions;
    const recipeById = builtRecipeRegistry.byId;

    const recipeProfileDefinitions = [
        {
            profileId: RECIPE_PROFILE_IDS.allRecipes,
            label: 'Полный каталог',
            description: 'Все рецепты, включая позднюю утилиту и расширенные food-ветки.',
            recipeIds: recipes.map((recipe) => recipe.recipeId)
        },
        {
            profileId: RECIPE_PROFILE_IDS.wave1Minimal,
            label: 'Первая волна',
            description: 'Активный progression-набор: ранняя база плюс поздние style-рецепты, которые должны существовать в реальной игре, а не только в полном каталоге.',
            recipeIds: [
                'fill-water-flask',
                'boil-water',
                'prepare-alchemy-water',
                'grass-to-healing-base',
                'reeds-to-healing-base',
                'grass-to-herbal-paste',
                'grass-to-rope',
                'reeds-to-rope',
                'stone-to-stone-block',
                'rubble-to-gravel-fill',
                'stone-rubble-to-gravel-fill',
                'wood-to-board',
                'wood-to-frame',
                'wood-to-fuel-bundle',
                'fish-to-fish-meat',
                'fish-to-fish-oil',
                'healing-brew',
                'dried-ration',
                'second-wind',
                'portable-bridge',
                'portable-bridge-assembly',
                'bridge-repair-kit',
                'boat-frame',
                'boat',
                'boat-repair-kit',
                'relic-case',
                'tool-holster',
                'storm-boots',
                'anchor-line',
                'island-drill',
                'black-cup',
                'last-vow'
            ]
        }
    ];
    const builtRecipeProfiles = createValidatedRecipeProfiles(recipeProfileDefinitions, {
        recipeById
    });
    const recipeProfiles = builtRecipeProfiles.definitions;
    const recipeProfileById = builtRecipeProfiles.byId;

    function getConfiguredRecipeProfileId() {
        const configuredProfileId = game
            && game.config
            && typeof game.config.craftingRecipeProfile === 'string'
            ? game.config.craftingRecipeProfile.trim()
            : '';

        return recipeProfileById[configuredProfileId]
            ? configuredProfileId
            : DEFAULT_ACTIVE_RECIPE_PROFILE_ID;
    }

    function getRecipeProfile(profileId) {
        const resolvedProfileId = typeof profileId === 'string' && profileId.trim()
            ? profileId.trim()
            : getConfiguredRecipeProfileId();
        const profileDefinition = recipeProfileById[resolvedProfileId]
            || recipeProfileById[DEFAULT_ACTIVE_RECIPE_PROFILE_ID]
            || recipeProfileById[RECIPE_PROFILE_IDS.allRecipes];

        return profileDefinition ? cloneValue(profileDefinition) : null;
    }

    function getRecipeProfiles() {
        return recipeProfiles.map((profile) => cloneValue(profile));
    }

    function getRecipeDefinitionsForProfile(profileId) {
        const profileDefinition = getRecipeProfile(profileId);

        if (!profileDefinition) {
            return [];
        }

        return profileDefinition.recipeIds
            .map((recipeId) => recipeById[recipeId] ? cloneValue(recipeById[recipeId]) : null)
            .filter(Boolean);
    }

    function getActiveRecipeProfileId() {
        return getConfiguredRecipeProfileId();
    }

    function resolveRecipeUnlockWindow(recipe) {
        if (!recipe || !recipe.islandNeedProfile) {
            return { earliest: null, latest: null };
        }

        const earliest = Number.isFinite(recipe.islandNeedProfile.earliestIsland)
            ? recipe.islandNeedProfile.earliestIsland
            : null;
        const latest = Number.isFinite(recipe.islandNeedProfile.latestIsland)
            ? recipe.islandNeedProfile.latestIsland
            : null;

        return { earliest, latest };
    }

    function isRecipeUnlockedForIsland(recipe, islandIndex = game.state.currentIslandIndex || 1) {
        const normalizedIslandIndex = Math.max(1, Math.round(islandIndex || 1));
        const { earliest } = resolveRecipeUnlockWindow(recipe);

        if (!Number.isFinite(earliest)) {
            return true;
        }

        return normalizedIslandIndex >= earliest;
    }

    function getActiveRecipeDefinitions(options = {}) {
        const islandIndex = Number.isFinite(options.islandIndex)
            ? options.islandIndex
            : (game.state && Number.isFinite(game.state.currentIslandIndex) ? game.state.currentIslandIndex : 1);
        return getRecipeDefinitionsForProfile(getActiveRecipeProfileId())
            .filter((recipe) => isRecipeUnlockedForIsland(recipe, islandIndex));
    }

    function isRecipeActive(recipeId, profileId) {
        const normalizedRecipeId = typeof recipeId === 'string' ? recipeId.trim() : '';
        if (!normalizedRecipeId) {
            return false;
        }

        const profileDefinition = getRecipeProfile(profileId);
        return Boolean(profileDefinition && profileDefinition.recipeIds.includes(normalizedRecipeId));
    }

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

    function getRecipesByComponentTag(tag, options = {}) {
        const normalizedTag = normalizeIngredientComponentTags([tag])[0];
        const componentRegistry = getComponentRegistry();

        if (!normalizedTag || !componentRegistry || typeof componentRegistry.getComponentDefinition !== 'function') {
            return [];
        }

        const scope = options.scope === 'result'
            ? 'result'
            : (options.scope === 'ingredient' ? 'ingredient' : 'any');

        return recipes
            .filter((recipe) => {
                const ingredientMatch = (Array.isArray(recipe.ingredients) ? recipe.ingredients : []).some((ingredient) => {
                    if (!ingredient || ingredient.kind !== 'component') {
                        return false;
                    }

                    const componentDefinition = componentRegistry.getComponentDefinition(ingredient.id);
                    return Boolean(componentDefinition
                        && Array.isArray(componentDefinition.tags)
                        && componentDefinition.tags.includes(normalizedTag));
                });
                const resultMatch = recipe.result && recipe.result.kind === 'component'
                    ? (() => {
                        const componentDefinition = componentRegistry.getComponentDefinition(recipe.result.id);
                        return Boolean(componentDefinition
                            && Array.isArray(componentDefinition.tags)
                            && componentDefinition.tags.includes(normalizedTag));
                    })()
                    : false;

                if (scope === 'ingredient') {
                    return ingredientMatch;
                }

                if (scope === 'result') {
                    return resultMatch;
                }

                return ingredientMatch || resultMatch;
            })
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
        PRACTICAL_RAW_RESOURCE_EXCEPTION_TAG,
        RECIPE_CRAFT_TRACKS,
        RECIPE_TIERS,
        RECIPE_PROFILE_IDS,
        allowsPracticalRawShortcut,
        createValidatedRecipeProfiles,
        recipes,
        recipeProfiles,
        createValidatedRecipeRegistry,
        getActiveRecipeDefinitions,
        getActiveRecipeProfileId,
        getRecipeDefinitionsForProfile,
        getRecipeDefinition,
        getRecipeDefinitions,
        getRecipeProfile,
        getRecipeProfiles,
        getRawResourceIngredients,
        getRecipesByStation,
        getRecipesByTier,
        getRecipesByTag,
        getRecipesByComponentTag,
        getRecipesForIsland,
        getRecipesByResultId,
        isRecipeUnlockedForIsland,
        isRecipeActive,
        isPracticalRecipeTier,
        normalizeRecipeDefinition,
        validateRecipeDefinition
    });
})();
