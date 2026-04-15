(() => {
    const game = window.Game;
    const stationUi = game.systems.stationUi = game.systems.stationUi || {};
    const bridge = game.systems.uiBridge;
    let elements = null;
    let eventsBound = false;
    let lastStationPanelSignature = null;

    if (!bridge) {
        return;
    }

    const PANEL_MODES = Object.freeze({
        context: 'context',
        global: 'global'
    });
    const DEFAULT_FILTER_ID = 'all';
    const GLOBAL_CRAFT_PANEL_SOURCE_ID = '__global-craft-panel__';
    const CRAFT_ROLE_FILTERS = Object.freeze([
        { id: DEFAULT_FILTER_ID, label: 'Все' },
        { id: 'food', label: 'Еда' },
        { id: 'potions', label: 'Зелья' },
        { id: 'repair', label: 'Ремонт' },
        { id: 'bridge', label: 'Мосты' },
        { id: 'boat', label: 'Лодки' },
        { id: 'utility', label: 'Utility' }
    ]);

    function queryElements() {
        elements = {
            stationPanel: document.getElementById('stationPanel'),
            stationPanelKicker: document.getElementById('stationPanelKicker'),
            stationPanelTitle: document.getElementById('stationPanelTitle'),
            stationPanelSummary: document.getElementById('stationPanelSummary'),
            stationPanelMeta: document.getElementById('stationPanelMeta'),
            stationPanelContent: document.getElementById('stationPanelContent'),
            stationPanelClose: document.getElementById('stationPanelClose')
        };

        return elements;
    }

    function getElements() {
        return elements || queryElements();
    }

    function bindEvents() {
        if (eventsBound) {
            return;
        }

        const refs = getElements();

        if (refs.stationPanel) {
            refs.stationPanel.addEventListener('click', handleStationPanelClick);
        }

        if (refs.stationPanelClose) {
            refs.stationPanelClose.addEventListener('click', () => {
                closeStationPanel();
            });
        }

        eventsBound = true;
    }

    function getUiState() {
        const ui = bridge.getUi();
        ui.openStationSourceId = typeof ui.openStationSourceId === 'string' ? ui.openStationSourceId : null;
        ui.dismissedStationSourceId = typeof ui.dismissedStationSourceId === 'string' ? ui.dismissedStationSourceId : null;
        ui.stationPanelMode = ui.stationPanelMode === PANEL_MODES.global ? PANEL_MODES.global : PANEL_MODES.context;
        ui.stationPanelStationFilter = typeof ui.stationPanelStationFilter === 'string'
            ? ui.stationPanelStationFilter
            : DEFAULT_FILTER_ID;
        ui.stationPanelRoleFilter = typeof ui.stationPanelRoleFilter === 'string'
            ? ui.stationPanelRoleFilter
            : DEFAULT_FILTER_ID;
        return ui;
    }

    function getStationRuntime() {
        return game.systems.stationRuntime || null;
    }

    function getCraftingRuntime() {
        return game.systems.craftingRuntime || null;
    }

    function getInventoryRuntime() {
        return game.systems.inventoryRuntime || null;
    }

    function getInventoryUi() {
        return game.systems.inventoryUi || null;
    }

    function normalizeStationId(stationId) {
        const stationRuntime = getStationRuntime();
        if (stationRuntime && typeof stationRuntime.normalizeStationId === 'function') {
            return stationRuntime.normalizeStationId(stationId);
        }

        return typeof stationId === 'string' ? stationId.trim().toLowerCase() : '';
    }

    function normalizeRoleFilterId(roleFilterId) {
        const normalizedRoleFilterId = typeof roleFilterId === 'string'
            ? roleFilterId.trim().toLowerCase()
            : '';
        return CRAFT_ROLE_FILTERS.some((filter) => filter.id === normalizedRoleFilterId)
            ? normalizedRoleFilterId
            : DEFAULT_FILTER_ID;
    }

    function normalizeTagList(tags = []) {
        return (Array.isArray(tags) ? tags : [])
            .map((tag) => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
            .filter(Boolean);
    }

    function isSupportedEncounter(encounter) {
        return Boolean(encounter && (
            encounter.kind === 'camp'
            || encounter.kind === 'workbench'
            || encounter.kind === 'station_keeper'
        ));
    }

    function getEncounterForSource(source) {
        const encounter = bridge.getHouseEncounter(source);
        return isSupportedEncounter(encounter) ? encounter : null;
    }

    function getActiveSource(activeInteraction = game.state.activeInteraction) {
        const encounter = getEncounterForSource(activeInteraction);
        return encounter ? activeInteraction : null;
    }

    function getSourceContext(source) {
        const stationRuntime = getStationRuntime();
        return stationRuntime && typeof stationRuntime.buildStationSourceContext === 'function'
            ? stationRuntime.buildStationSourceContext(source)
            : null;
    }

    function getActiveStationContext(source) {
        const stationRuntime = getStationRuntime();

        if (!stationRuntime || typeof stationRuntime.getActiveStationContext !== 'function') {
            return {
                activeStationId: 'hand',
                activeStationLabel: 'Руки',
                activeSourceLabel: 'Руки',
                activeSourceSummary: 'Стартовая станция, доступная без привязки к объекту.',
                activeSourceName: 'Руки',
                contextStationIds: ['hand'],
                contextStationLabels: ['Руки'],
                availableStations: ['hand'],
                availableStationLabels: ['Руки']
            };
        }

        return stationRuntime.getActiveStationContext({
            activeInteraction: source || game.state.activeInteraction || null,
            activeHouse: source || game.state.activeHouse || null
        });
    }

    function getInventorySnapshot() {
        const inventoryRuntime = getInventoryRuntime();

        if (!inventoryRuntime || typeof inventoryRuntime.getInventory !== 'function') {
            return [];
        }

        const inventory = inventoryRuntime.getInventory();
        const slotCount = typeof inventoryRuntime.getUnlockedInventorySlots === 'function'
            ? inventoryRuntime.getUnlockedInventorySlots()
            : inventory.length;

        return inventory
            .slice(0, slotCount)
            .map((item) => item ? inventoryRuntime.normalizeInventoryItem(item) : null);
    }

    function countItemQuantityInSnapshot(snapshot, itemId) {
        return (Array.isArray(snapshot) ? snapshot : []).reduce((sum, item) => {
            if (!item || item.id !== itemId) {
                return sum;
            }

            return sum + Math.max(1, item.quantity || 1);
        }, 0);
    }

    function countIngredientAvailableUnits(ingredient, inventorySnapshot) {
        const bindings = ingredient && ingredient.gameplaySupport && Array.isArray(ingredient.gameplaySupport.bindings)
            ? ingredient.gameplaySupport.bindings
            : [];

        if (bindings.length > 0) {
            return bindings.reduce((sum, binding) => {
                const unitsPerItem = Number.isFinite(binding && binding.unitsPerItem) ? binding.unitsPerItem : 1;
                return sum + countItemQuantityInSnapshot(inventorySnapshot, binding.itemId) * unitsPerItem;
            }, 0);
        }

        if (ingredient && typeof ingredient.gameplayItemId === 'string' && ingredient.gameplayItemId.trim()) {
            return countItemQuantityInSnapshot(inventorySnapshot, ingredient.gameplayItemId.trim());
        }

        return 0;
    }

    function buildRequirementCounterLabel(requirement) {
        if (requirement.kind === 'environment') {
            return requirement.isSatisfied ? 'Рядом' : 'Не рядом';
        }

        return `${Math.max(0, requirement.available)}/${Math.max(1, requirement.required)}`;
    }

    function buildStationRequirementEntries(recipe, evaluation, inventorySnapshot) {
        const missingEnvironmentIds = new Set(
            Array.isArray(evaluation && evaluation.missingEnvironments)
                ? evaluation.missingEnvironments.map((entry) => entry && entry.id).filter(Boolean)
                : []
        );

        return (Array.isArray(recipe && recipe.ingredients) ? recipe.ingredients : []).map((ingredient) => {
            const required = Number.isFinite(ingredient && ingredient.quantity) ? Math.max(1, ingredient.quantity) : 1;

            if (ingredient && ingredient.kind === 'environment') {
                const isSatisfied = !missingEnvironmentIds.has(ingredient.id);
                return {
                    kind: 'environment',
                    id: ingredient.id,
                    label: ingredient.label || ingredient.id || 'Окружение',
                    required,
                    available: isSatisfied ? required : 0,
                    isSatisfied,
                    counterLabel: isSatisfied ? 'Рядом' : 'Не рядом'
                };
            }

            const available = countIngredientAvailableUnits(ingredient, inventorySnapshot);
            const isSatisfied = available >= required;

            return {
                kind: ingredient && ingredient.kind ? ingredient.kind : 'ingredient',
                id: ingredient && ingredient.id ? ingredient.id : '',
                label: ingredient && ingredient.label ? ingredient.label : (ingredient && ingredient.id ? ingredient.id : 'Ингредиент'),
                required,
                available,
                isSatisfied,
                counterLabel: `${available}/${required}`
            };
        });
    }

    function buildStationReasonLabel(evaluation) {
        if (!evaluation) {
            return 'Недоступно';
        }

        if (evaluation.success) {
            return 'Готово к сборке';
        }

        switch (evaluation.reason) {
        case 'missing-ingredients':
            return 'Не хватает ингредиентов';
        case 'wrong-station':
            return 'Нужна другая станция';
        case 'missing-environment':
            return 'Нет нужного окружения';
        case 'inventory-full':
            return evaluation.capacityType === 'bulk'
                ? 'Не хватает объёма'
                : 'В сумке нет места';
        default:
            return 'Сейчас недоступно';
        }
    }

    function buildStationReasonDetail(evaluation) {
        if (!evaluation) {
            return 'Рецепт сейчас недоступен.';
        }

        if (evaluation.success) {
            return 'Все ингредиенты и условия на месте.';
        }

        return evaluation.message || 'Рецепт сейчас недоступен.';
    }

    function formatIslandWindowLabel(window) {
        if (!window || !Number.isFinite(window.from) || !Number.isFinite(window.to)) {
            return '';
        }

        return window.from === window.to
            ? `${window.from}`
            : `${window.from}-${window.to}`;
    }

    function buildRecipeNeedWindowLabel(recipe) {
        const windows = recipe
            && recipe.islandNeedProfile
            && Array.isArray(recipe.islandNeedProfile.windows)
                ? recipe.islandNeedProfile.windows
                : [];
        const criticalWindows = windows.filter((window) => window && window.priority === 'critical');
        const preferredWindows = criticalWindows.length > 0 ? criticalWindows : windows;

        if (preferredWindows.length === 0) {
            return 'сейчас не привязан к отдельному островному окну';
        }

        const windowLabels = preferredWindows
            .map((window) => formatIslandWindowLabel(window))
            .filter(Boolean);
        const leadNote = preferredWindows.find((window) => window && typeof window.note === 'string' && window.note.trim());

        if (windowLabels.length === 0) {
            return leadNote && leadNote.note
                ? leadNote.note.trim()
                : 'сейчас не привязан к отдельному островному окну';
        }

        return leadNote && leadNote.note
            ? `острова ${windowLabels.join(', ')} - ${leadNote.note.trim()}`
            : `острова ${windowLabels.join(', ')}`;
    }

    function buildRecipeUseCaseLabel(recipe) {
        const tags = new Set(normalizeTagList(recipe && recipe.tags));

        if (tags.has('repair') && tags.has('bridge')) {
            return 'на повреждённых мостах и островах переправ';
        }

        if (tags.has('repair') && tags.has('boat')) {
            return 'в водной фазе, когда лодка уже получила износ';
        }

        if (tags.has('bridge')) {
            return 'на разломах, переправах и узких водных кромках';
        }

        if (tags.has('boat')) {
            return 'на обводнённых островах и в длинных обходах по воде';
        }

        if (tags.has('food')) {
            return 'в длинных переходах, на истощённых островах и после тяжёлых маршрутов';
        }

        if (tags.has('healing')) {
            return 'когда нужно быстро стабилизировать выживание и не сорвать забег';
        }

        if (tags.has('energy') || tags.has('movement')) {
            return 'в тяжёлых и длинных маршрутах, где важен темп';
        }

        if (tags.has('light') || tags.has('info') || tags.has('route')) {
            return 'на дорогих развилках, в тумане и перед длинным маршрутом';
        }

        if (tags.has('trade') || tags.has('value') || tags.has('economy')) {
            return 'на торговых островах и в ремесленных экономических цепочках';
        }

        if (tags.has('water')) {
            return 'в водной фазе, рядом с водой и для связанных рецептов снабжения';
        }

        if (tags.has('utility')) {
            return 'в ситуациях, где нужен доступ к карте, ремонту или безопасному пути';
        }

        if (recipe && typeof recipe.notes === 'string' && recipe.notes.trim()) {
            return recipe.notes.trim();
        }

        return 'в той фазе маршрута, где эта ветка открывает следующий стабильный шаг';
    }

    function buildRecipeFactEntries(option) {
        return [
            {
                label: 'Станция',
                value: option.stationLabel || 'Руки'
            },
            {
                label: 'Где применять',
                value: option.useCaseLabel || 'в текущей фазе маршрута'
            },
            {
                label: 'Особенно нужен',
                value: option.needWindowLabel || 'сейчас не привязан к отдельному островному окну'
            }
        ];
    }

    function hasAnyRecipeTag(option, tags = []) {
        const normalizedTags = new Set(Array.isArray(option && option.tags) ? option.tags : []);
        return (Array.isArray(tags) ? tags : []).some((tag) => normalizedTags.has(tag));
    }

    function isFoodRoleOption(option) {
        return hasAnyRecipeTag(option, ['food', 'ration', 'broth', 'preserved']);
    }

    function isPotionRoleOption(option) {
        if (isFoodRoleOption(option)) {
            return false;
        }

        return hasAnyRecipeTag(option, ['healing', 'energy', 'ritual', 'risk']);
    }

    function isRepairRoleOption(option) {
        return hasAnyRecipeTag(option, ['repair']);
    }

    function isBridgeRoleOption(option) {
        return hasAnyRecipeTag(option, ['bridge']);
    }

    function isBoatRoleOption(option) {
        return hasAnyRecipeTag(option, ['boat', 'water-access', 'water']);
    }

    function isUtilityRoleOption(option) {
        return hasAnyRecipeTag(option, [
            'utility',
            'info',
            'route',
            'movement',
            'light',
            'trade',
            'protection',
            'collector_loadout',
            'endgame_route'
        ]);
    }

    function optionMatchesRoleFilter(option, roleFilterId) {
        switch (normalizeRoleFilterId(roleFilterId)) {
        case 'food':
            return isFoodRoleOption(option);
        case 'potions':
            return isPotionRoleOption(option);
        case 'repair':
            return isRepairRoleOption(option);
        case 'bridge':
            return isBridgeRoleOption(option);
        case 'boat':
            return isBoatRoleOption(option);
        case 'utility':
            return isUtilityRoleOption(option);
        default:
            return true;
        }
    }

    function optionMatchesStationFilter(option, stationFilterId) {
        const normalizedStationFilterId = normalizeStationId(stationFilterId);
        if (!normalizedStationFilterId || normalizedStationFilterId === DEFAULT_FILTER_ID) {
            return true;
        }

        return Array.isArray(option && option.stationIds)
            ? option.stationIds.includes(normalizedStationFilterId)
            : false;
    }

    function buildCraftRecipeOptions(source, stationContext) {
        const craftingRuntime = getCraftingRuntime();
        const inventoryUi = getInventoryUi();

        if (
            !craftingRuntime
            || typeof craftingRuntime.getCompiledRecipes !== 'function'
            || typeof craftingRuntime.evaluateRecipeAgainstInventory !== 'function'
            || !inventoryUi
            || typeof inventoryUi.resolveRecipeStationDescriptor !== 'function'
            || typeof inventoryUi.buildOptionStatusFromEvaluation !== 'function'
        ) {
            return [];
        }

        const currentStationIds = new Set(
            (Array.isArray(stationContext && stationContext.contextStationIds)
                ? stationContext.contextStationIds
                : [stationContext && stationContext.activeStationId ? stationContext.activeStationId : 'hand'])
                .map((stationId) => normalizeStationId(stationId))
                .filter(Boolean)
        );
        const availableStationIds = new Set(
            (Array.isArray(stationContext && stationContext.availableStations)
                ? stationContext.availableStations
                : ['hand'])
                .map((stationId) => normalizeStationId(stationId))
                .filter(Boolean)
        );
        const inventorySnapshot = getInventorySnapshot();

        return craftingRuntime.getCompiledRecipes()
            .filter((recipe) => recipe && recipe.recipeId && recipe.supportsGameplayInventory)
            .map((recipe) => {
                const stationDescriptor = inventoryUi.resolveRecipeStationDescriptor(recipe);
                const stationIds = Array.isArray(stationDescriptor.stationIds)
                    ? stationDescriptor.stationIds.map((stationId) => normalizeStationId(stationId)).filter(Boolean)
                    : [];
                const evaluation = craftingRuntime.evaluateRecipeAgainstInventory(recipe.recipeId, {
                    activeInteraction: source || game.state.activeInteraction || null,
                    availableStations: stationContext && Array.isArray(stationContext.availableStations)
                        ? stationContext.availableStations
                        : undefined,
                    scanNearbyEnvironment: true
                });
                const optionStatus = inventoryUi.buildOptionStatusFromEvaluation(evaluation);
                const requirements = buildStationRequirementEntries(recipe, evaluation, inventorySnapshot);
                const normalizedTags = normalizeTagList(recipe.tags);

                return {
                    recipeId: recipe.recipeId,
                    actionType: 'crafting',
                    stationId: normalizeStationId(stationDescriptor.primaryStationId) || 'hand',
                    stationLabel: stationDescriptor.stationLabel,
                    stationIds,
                    title: recipe.label || (recipe.result && recipe.result.label) || recipe.recipeId,
                    subtitle: optionStatus.statusLabel || 'Рецепт готов к сборке',
                    disabled: optionStatus.disabled,
                    message: evaluation && evaluation.message ? evaluation.message : '',
                    evaluation,
                    requirements,
                    reasonLabel: buildStationReasonLabel(evaluation),
                    reasonDetail: buildStationReasonDetail(evaluation),
                    tags: normalizedTags,
                    useCaseLabel: buildRecipeUseCaseLabel(recipe),
                    needWindowLabel: buildRecipeNeedWindowLabel(recipe),
                    isCurrentStation: stationIds.some((stationId) => currentStationIds.has(stationId)),
                    isAvailableStation: stationIds.some((stationId) => availableStationIds.has(stationId))
                };
            })
            .sort((left, right) => {
                const leftPriority = left.disabled ? 1 : 0;
                const rightPriority = right.disabled ? 1 : 0;

                if (leftPriority !== rightPriority) {
                    return leftPriority - rightPriority;
                }

                const leftStationPriority = left.isCurrentStation ? 0 : (left.isAvailableStation ? 1 : 2);
                const rightStationPriority = right.isCurrentStation ? 0 : (right.isAvailableStation ? 1 : 2);

                if (leftStationPriority !== rightStationPriority) {
                    return leftStationPriority - rightStationPriority;
                }

                return left.title.localeCompare(right.title, 'ru');
            });
    }

    function buildStationFilterOptions(craftOptions, stationContext, roleFilterId, activeStationFilterId = DEFAULT_FILTER_ID) {
        const stationRuntime = getStationRuntime();
        const stationIds = new Set();
        const optionsAfterRoleFilter = (Array.isArray(craftOptions) ? craftOptions : [])
            .filter((option) => optionMatchesRoleFilter(option, roleFilterId));

        optionsAfterRoleFilter.forEach((option) => {
            (Array.isArray(option.stationIds) ? option.stationIds : []).forEach((stationId) => {
                if (stationId) {
                    stationIds.add(stationId);
                }
            });
        });

        (Array.isArray(stationContext && stationContext.contextStationIds) ? stationContext.contextStationIds : [])
            .map((stationId) => normalizeStationId(stationId))
            .filter(Boolean)
            .forEach((stationId) => stationIds.add(stationId));

        const currentStations = new Set(
            (Array.isArray(stationContext && stationContext.contextStationIds) ? stationContext.contextStationIds : [])
                .map((stationId) => normalizeStationId(stationId))
                .filter(Boolean)
        );
        const availableStations = new Set(
            (Array.isArray(stationContext && stationContext.availableStations) ? stationContext.availableStations : [])
                .map((stationId) => normalizeStationId(stationId))
                .filter(Boolean)
        );
        const stationDefinitions = stationRuntime && typeof stationRuntime.getStationDefinitions === 'function'
            ? stationRuntime.getStationDefinitions()
            : [];
        const stationOrder = new Map(stationDefinitions.map((station, index) => [station.id, index]));
        const filters = [
            {
                id: DEFAULT_FILTER_ID,
                label: 'Все станции',
                count: optionsAfterRoleFilter.length,
                isActive: activeStationFilterId === DEFAULT_FILTER_ID,
                isCurrent: false,
                isAvailable: true
            }
        ];

        [...stationIds]
            .sort((left, right) => {
                const leftOrder = stationOrder.has(left) ? stationOrder.get(left) : 999;
                const rightOrder = stationOrder.has(right) ? stationOrder.get(right) : 999;
                return leftOrder - rightOrder;
            })
            .forEach((stationId) => {
                filters.push({
                    id: stationId,
                    label: stationRuntime && typeof stationRuntime.getStationLabel === 'function'
                        ? stationRuntime.getStationLabel(stationId, stationId)
                        : stationId,
                    count: optionsAfterRoleFilter.filter((option) => optionMatchesStationFilter(option, stationId)).length,
                    isActive: activeStationFilterId === stationId,
                    isCurrent: currentStations.has(stationId),
                    isAvailable: availableStations.has(stationId)
                });
            });

        return filters;
    }

    function buildRoleFilterOptions(craftOptions, stationFilterId, activeRoleFilterId = DEFAULT_FILTER_ID) {
        const optionsAfterStationFilter = (Array.isArray(craftOptions) ? craftOptions : [])
            .filter((option) => optionMatchesStationFilter(option, stationFilterId));

        return CRAFT_ROLE_FILTERS.map((roleFilter) => ({
            ...roleFilter,
            count: roleFilter.id === DEFAULT_FILTER_ID
                ? optionsAfterStationFilter.length
                : optionsAfterStationFilter.filter((option) => optionMatchesRoleFilter(option, roleFilter.id)).length,
            isActive: activeRoleFilterId === roleFilter.id
        }));
    }

    function buildFilteredCraftOptions(craftOptions, stationFilterId, roleFilterId) {
        return (Array.isArray(craftOptions) ? craftOptions : [])
            .filter((option) => optionMatchesStationFilter(option, stationFilterId))
            .filter((option) => optionMatchesRoleFilter(option, roleFilterId));
    }

    function buildGroupedRecipeEntriesFromOptions(craftOptions, stationContext) {
        const inventoryUi = getInventoryUi();

        if (!inventoryUi || typeof inventoryUi.groupCraftOptionsByStation !== 'function') {
            return [];
        }

        return inventoryUi.groupCraftOptionsByStation(craftOptions, stationContext);
    }

    function buildStationGroupBadgeLabel(group) {
        if (group.stationId === 'hand') {
            return group.isCurrent ? 'Активна' : 'Всегда доступна';
        }

        if (group.isCurrent) {
            return 'Активна';
        }

        return group.isAvailable ? 'Рядом' : 'Недоступна';
    }

    function getDefaultStationFilterId(stationContext, panelMode = PANEL_MODES.context) {
        if (panelMode === PANEL_MODES.global) {
            return DEFAULT_FILTER_ID;
        }

        const candidates = [
            ...(Array.isArray(stationContext && stationContext.contextStationIds) ? stationContext.contextStationIds : []),
            stationContext && stationContext.activeStationId ? stationContext.activeStationId : 'hand'
        ];

        for (const candidate of candidates) {
            const normalizedStationId = normalizeStationId(candidate);
            if (normalizedStationId) {
                return normalizedStationId;
            }
        }

        return DEFAULT_FILTER_ID;
    }

    function buildFilterButton(filterType, filterOption) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'hud-button station-panel__filter-button';
        button.setAttribute('data-station-panel-filter-type', filterType);
        button.setAttribute('data-station-panel-filter-id', filterOption.id);
        button.setAttribute('aria-pressed', filterOption.isActive ? 'true' : 'false');
        button.disabled = filterOption.count <= 0 && !filterOption.isActive;

        if (filterOption.isActive) {
            button.classList.add('station-panel__filter-button--active');
        }

        if (filterOption.isCurrent) {
            button.classList.add('station-panel__filter-button--current');
        } else if (filterOption.isAvailable === false && filterOption.id !== DEFAULT_FILTER_ID) {
            button.classList.add('station-panel__filter-button--inactive');
        }

        const labelNode = document.createElement('span');
        labelNode.className = 'station-panel__filter-button-label';
        labelNode.textContent = filterOption.label;

        const countNode = document.createElement('span');
        countNode.className = 'station-panel__filter-button-count';
        countNode.textContent = String(Math.max(0, filterOption.count || 0));

        button.append(labelNode, countNode);
        return button;
    }

    function buildFilterSection(title, filterType, filters) {
        const section = document.createElement('section');
        section.className = 'station-panel__filter-section';

        const titleNode = document.createElement('p');
        titleNode.className = 'station-panel__filter-title';
        titleNode.textContent = title;

        const filtersNode = document.createElement('div');
        filtersNode.className = 'station-panel__filter-list';
        filtersNode.replaceChildren(...filters.map((filter) => buildFilterButton(filterType, filter)));

        section.append(titleNode, filtersNode);
        return section;
    }

    function buildStationActionButton(option) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'hud-button station-panel__recipe-button';
        button.setAttribute('data-crafting-recipe-id', option.recipeId);
        button.disabled = Boolean(option.disabled);
        button.textContent = option.disabled ? 'Пока недоступно' : 'Собрать';

        if (option.message) {
            button.title = option.message;
        }

        return button;
    }

    function buildStationRequirementNode(requirement) {
        const row = document.createElement('li');
        row.className = 'station-panel__requirement';
        row.classList.add(requirement.isSatisfied
            ? 'station-panel__requirement--ok'
            : 'station-panel__requirement--missing');

        const labelNode = document.createElement('span');
        labelNode.className = 'station-panel__requirement-label';
        labelNode.textContent = requirement.label;

        const counterNode = document.createElement('span');
        counterNode.className = 'station-panel__requirement-count';
        counterNode.textContent = buildRequirementCounterLabel(requirement);

        row.append(labelNode, counterNode);
        return row;
    }

    function buildStationRecipeFactNode(fact) {
        const row = document.createElement('div');
        row.className = 'station-panel__recipe-fact';

        const labelNode = document.createElement('span');
        labelNode.className = 'station-panel__recipe-fact-label';
        labelNode.textContent = fact.label;

        const valueNode = document.createElement('span');
        valueNode.className = 'station-panel__recipe-fact-value';
        valueNode.textContent = fact.value;

        row.append(labelNode, valueNode);
        return row;
    }

    function buildStationRecipeCard(option) {
        const card = document.createElement('article');
        card.className = 'station-panel__recipe-card';
        card.classList.add(option.disabled
            ? 'station-panel__recipe-card--locked'
            : 'station-panel__recipe-card--ready');

        const header = document.createElement('div');
        header.className = 'station-panel__recipe-header';

        const titleNode = document.createElement('h4');
        titleNode.className = 'station-panel__recipe-title';
        titleNode.textContent = option.title;

        const badgeNode = document.createElement('span');
        badgeNode.className = 'station-panel__recipe-badge';
        badgeNode.textContent = option.reasonLabel || option.subtitle || 'Рецепт';

        header.append(titleNode, badgeNode);

        const summaryNode = document.createElement('p');
        summaryNode.className = 'station-panel__recipe-summary';
        summaryNode.textContent = option.disabled
            ? (option.reasonDetail || 'Рецепт сейчас недоступен.')
            : 'Можно собрать прямо сейчас.';

        const factsNode = document.createElement('div');
        factsNode.className = 'station-panel__recipe-facts';
        factsNode.replaceChildren(...buildRecipeFactEntries(option).map((fact) => buildStationRecipeFactNode(fact)));

        const requirementsLabel = document.createElement('p');
        requirementsLabel.className = 'station-panel__recipe-requirements-label';
        requirementsLabel.textContent = 'Требования';

        const requirementsList = document.createElement('ul');
        requirementsList.className = 'station-panel__recipe-requirements';
        requirementsList.replaceChildren(...(Array.isArray(option.requirements) ? option.requirements : []).map((requirement) => (
            buildStationRequirementNode(requirement)
        )));

        card.append(header, summaryNode, factsNode, requirementsLabel, requirementsList, buildStationActionButton(option));
        return card;
    }

    function buildStationGroup(group) {
        const section = document.createElement('section');
        section.className = 'inventory-selection-panel__craft-group';

        if (group.isCurrent) {
            section.classList.add('inventory-selection-panel__craft-group--current');
        } else if (!group.isAvailable) {
            section.classList.add('inventory-selection-panel__craft-group--inactive');
        }

        const header = document.createElement('div');
        header.className = 'inventory-selection-panel__craft-group-header';

        const titleNode = document.createElement('p');
        titleNode.className = 'inventory-selection-panel__craft-group-title';
        titleNode.textContent = group.stationLabel;

        const badgeNode = document.createElement('span');
        badgeNode.className = 'inventory-selection-panel__craft-group-badge';
        badgeNode.textContent = buildStationGroupBadgeLabel(group);

        header.append(titleNode, badgeNode);

        const recipes = document.createElement('div');
        recipes.className = 'station-panel__recipe-list';
        recipes.replaceChildren(...group.options.map((option) => buildStationRecipeCard(option)));

        section.append(header, recipes);
        return section;
    }

    function buildStationContent(viewModel) {
        const contentRoot = document.createElement('section');
        contentRoot.className = 'inventory-selection-panel__craft station-panel__craft';

        const header = document.createElement('div');
        header.className = 'inventory-selection-panel__craft-header';

        const labelNode = document.createElement('p');
        labelNode.className = 'inventory-selection-panel__craft-label';
        labelNode.textContent = 'Панель крафта';

        const hintNode = document.createElement('p');
        hintNode.className = 'inventory-selection-panel__craft-hint';
        hintNode.textContent = viewModel.isGlobal
            ? 'Здесь собраны активные рецепты профиля. Фильтруй их по станциям и ролям, а на карточке всегда будет видно, почему рецепт пока закрыт.'
            : 'Это отдельная крафтовая панель станции. Можно быстро переключаться между станциями и ролями, не теряя список ингредиентов и причину блокировки.';

        header.append(labelNode, hintNode);

        const filters = document.createElement('div');
        filters.className = 'station-panel__filters';
        filters.append(
            buildFilterSection('Станции', 'station', viewModel.stationFilters),
            buildFilterSection('Роли', 'role', viewModel.roleFilters)
        );

        const resultsMeta = document.createElement('p');
        resultsMeta.className = 'station-panel__results-meta';
        resultsMeta.textContent = viewModel.filteredRecipeCount === viewModel.totalRecipeCount
            ? `Показано рецептов: ${viewModel.filteredRecipeCount}.`
            : `Показано рецептов: ${viewModel.filteredRecipeCount} из ${viewModel.totalRecipeCount}.`;

        const actions = document.createElement('div');
        actions.className = 'inventory-selection-panel__craft-actions';

        if (viewModel.groups.length > 0) {
            actions.replaceChildren(...viewModel.groups.map((group) => buildStationGroup(group)));
        } else {
            const emptyState = document.createElement('section');
            emptyState.className = 'inventory-selection-panel__craft-group inventory-selection-panel__craft-group--inactive';

            const emptyCopy = document.createElement('p');
            emptyCopy.className = 'panel-copy';
            emptyCopy.textContent = viewModel.totalRecipeCount > 0
                ? 'Для этих фильтров сейчас нет рецептов. Переключи станцию или роль, чтобы увидеть другие сборки.'
                : 'Активный профиль рецептов пока ничего не отдаёт в отдельную крафтовую панель.';

            emptyState.append(emptyCopy);
            actions.append(emptyState);
        }

        contentRoot.append(header, filters, resultsMeta, actions);
        return contentRoot;
    }

    function setPanelVisible(visible) {
        const refs = getElements();

        if (!refs.stationPanel) {
            return;
        }

        refs.stationPanel.hidden = !visible;
    }

    function clearPanelState(options = {}) {
        const ui = getUiState();

        ui.openStationSourceId = null;
        ui.stationPanelMode = PANEL_MODES.context;

        if (options.clearDismissal) {
            ui.dismissedStationSourceId = null;
        }

        lastStationPanelSignature = null;
        setPanelVisible(false);
    }

    function shouldHideForBlockingOverlay() {
        return Boolean(
            game.state.isPaused
            || game.state.isMapOpen
            || game.state.isGameOver
            || game.state.hasWon
        );
    }

    function buildPanelRenderContext(activeInteraction) {
        const ui = getUiState();
        const source = getActiveSource(activeInteraction);
        const sourceContext = source ? getSourceContext(source) : null;
        const isGlobalPanel = ui.stationPanelMode === PANEL_MODES.global
            && ui.openStationSourceId === GLOBAL_CRAFT_PANEL_SOURCE_ID;

        if (isGlobalPanel) {
            return {
                isGlobalPanel: true,
                source: null,
                sourceContext: null,
                sourceId: GLOBAL_CRAFT_PANEL_SOURCE_ID
            };
        }

        if (!source || !sourceContext) {
            return null;
        }

        return {
            isGlobalPanel: false,
            source,
            sourceContext,
            sourceId: sourceContext.sourceId
        };
    }

    function syncContextPanelState(ui, renderContext) {
        const sourceId = renderContext.sourceId;
        const stationContext = getActiveStationContext(renderContext.source);

        if (ui.dismissedStationSourceId && ui.dismissedStationSourceId !== sourceId) {
            ui.dismissedStationSourceId = null;
        }

        if (ui.openStationSourceId && ui.openStationSourceId !== sourceId) {
            ui.openStationSourceId = sourceId;
            ui.dismissedStationSourceId = null;
            ui.stationPanelStationFilter = getDefaultStationFilterId(stationContext, PANEL_MODES.context);
            ui.stationPanelRoleFilter = DEFAULT_FILTER_ID;
        }

        if (!ui.openStationSourceId && ui.dismissedStationSourceId !== sourceId) {
            ui.openStationSourceId = sourceId;
            if (!ui.stationPanelStationFilter || ui.stationPanelStationFilter === DEFAULT_FILTER_ID) {
                ui.stationPanelStationFilter = getDefaultStationFilterId(stationContext, PANEL_MODES.context);
            }
        }

        if (ui.openStationSourceId !== sourceId) {
            return null;
        }

        return stationContext;
    }

    function renderStationPanel(activeInteraction = game.state.activeInteraction) {
        bindEvents();

        const refs = getElements();
        const ui = getUiState();

        if (!refs.stationPanel || !refs.stationPanelContent) {
            return false;
        }

        if (shouldHideForBlockingOverlay()) {
            setPanelVisible(false);
            return false;
        }

        const renderContext = buildPanelRenderContext(activeInteraction);
        if (!renderContext) {
            clearPanelState({ clearDismissal: true });
            return false;
        }

        const stationContext = renderContext.isGlobalPanel
            ? getActiveStationContext(null)
            : syncContextPanelState(ui, renderContext);

        if (!stationContext) {
            setPanelVisible(false);
            return false;
        }

        const panelMode = renderContext.isGlobalPanel ? PANEL_MODES.global : PANEL_MODES.context;
        const craftOptions = buildCraftRecipeOptions(renderContext.source, stationContext);
        let requestedRoleFilterId = normalizeRoleFilterId(ui.stationPanelRoleFilter);
        let stationFilters = buildStationFilterOptions(craftOptions, stationContext, requestedRoleFilterId);
        const allowedStationFilterIds = new Set(stationFilters.map((filter) => filter.id));
        let stationFilterId = allowedStationFilterIds.has(ui.stationPanelStationFilter)
            ? ui.stationPanelStationFilter
            : getDefaultStationFilterId(stationContext, panelMode);

        if (!allowedStationFilterIds.has(stationFilterId)) {
            stationFilterId = DEFAULT_FILTER_ID;
        }

        ui.stationPanelStationFilter = stationFilterId;

        let roleFilters = buildRoleFilterOptions(craftOptions, stationFilterId);
        const allowedRoleFilterIds = new Set(roleFilters.map((filter) => filter.id));
        let roleFilterId = allowedRoleFilterIds.has(requestedRoleFilterId)
            ? requestedRoleFilterId
            : DEFAULT_FILTER_ID;

        if (!allowedRoleFilterIds.has(roleFilterId)) {
            roleFilterId = DEFAULT_FILTER_ID;
        }

        ui.stationPanelRoleFilter = roleFilterId;
        stationFilters = buildStationFilterOptions(craftOptions, stationContext, roleFilterId, stationFilterId);
        roleFilters = buildRoleFilterOptions(craftOptions, stationFilterId, roleFilterId);

        const filteredOptions = buildFilteredCraftOptions(craftOptions, stationFilterId, roleFilterId);
        const groups = buildGroupedRecipeEntriesFromOptions(filteredOptions, stationContext);
        const availableLabels = Array.isArray(stationContext.availableStationLabels) && stationContext.availableStationLabels.length > 0
            ? stationContext.availableStationLabels.join(', ')
            : 'Руки';
        const panelTitle = renderContext.isGlobalPanel
            ? 'Панель крафта'
            : (renderContext.sourceContext.sourceLabel || renderContext.sourceContext.contextLabel || 'Станция');
        const panelSummary = renderContext.isGlobalPanel
            ? 'Отдельный список активных рецептов текущего профиля. Можно заранее смотреть, где и зачем собирается нужная ветка.'
            : (renderContext.sourceContext.contextSummary || stationContext.activeSourceSummary || 'Станция готова к работе.');
        const panelMeta = renderContext.isGlobalPanel
            ? `Доступно сейчас: ${availableLabels}. Станционные фильтры показывают, где именно живёт нужная сборка, а роль помогает быстро отсечь лишнее.`
            : `Активно сейчас: ${availableLabels}. Если окно закрыто, нажми "Использовать", чтобы открыть его снова, или переключи фильтры прямо в панели.`;
        const panelKicker = renderContext.isGlobalPanel
            ? 'Крафт'
            : (renderContext.sourceContext.contextLabel || stationContext.activeSourceLabel || 'Станция');
        const panelSignature = JSON.stringify({
            sourceId: renderContext.sourceId,
            panelMode,
            panelTitle,
            panelSummary,
            panelMeta,
            panelKicker,
            stationFilterId,
            roleFilterId,
            totalRecipeCount: craftOptions.length,
            filteredRecipeCount: filteredOptions.length,
            groups: groups.map((group) => ({
                stationId: group.stationId,
                isCurrent: group.isCurrent,
                isAvailable: group.isAvailable,
                optionIds: (Array.isArray(group.options) ? group.options : []).map((option) => option.recipeId)
            }))
        });

        setPanelVisible(true);

        if (panelSignature === lastStationPanelSignature) {
            return true;
        }

        if (refs.stationPanelKicker) {
            refs.stationPanelKicker.textContent = panelKicker;
        }

        if (refs.stationPanelTitle) {
            refs.stationPanelTitle.textContent = panelTitle;
        }

        if (refs.stationPanelSummary) {
            refs.stationPanelSummary.textContent = panelSummary;
        }

        if (refs.stationPanelMeta) {
            refs.stationPanelMeta.textContent = panelMeta;
        }

        refs.stationPanelContent.replaceChildren(buildStationContent({
            groups,
            isGlobal: renderContext.isGlobalPanel,
            stationFilters,
            roleFilters,
            totalRecipeCount: craftOptions.length,
            filteredRecipeCount: filteredOptions.length
        }));
        lastStationPanelSignature = panelSignature;
        return true;
    }

    function openStationPanel(source, options = {}) {
        const ui = getUiState();

        if (options.mode === PANEL_MODES.global || options.global) {
            ui.dismissedStationSourceId = null;
            ui.openStationSourceId = GLOBAL_CRAFT_PANEL_SOURCE_ID;
            ui.stationPanelMode = PANEL_MODES.global;

            if (!options.keepFilters) {
                ui.stationPanelStationFilter = DEFAULT_FILTER_ID;
                ui.stationPanelRoleFilter = DEFAULT_FILTER_ID;
            }

            lastStationPanelSignature = null;

            if (!options.silent) {
                bridge.setActionMessage('Открыта отдельная панель крафта.');
                bridge.renderAfterStateChange(['actions', 'inventory', 'actionHint'], {
                    sceneChanged: false
                });
            }

            return true;
        }

        const resolvedSource = source || getActiveSource();
        const sourceContext = getSourceContext(resolvedSource);

        if (!sourceContext) {
            if (!options.silent) {
                bridge.setActionMessage('Рядом нет лагеря или станции с отдельным интерфейсом.');
                bridge.renderAfterStateChange(['actions', 'inventory', 'actionHint'], {
                    sceneChanged: false
                });
            }
            return false;
        }

        const stationContext = getActiveStationContext(resolvedSource);
        ui.dismissedStationSourceId = null;
        ui.openStationSourceId = sourceContext.sourceId;
        ui.stationPanelMode = PANEL_MODES.context;

        if (!options.keepFilters) {
            ui.stationPanelStationFilter = getDefaultStationFilterId(stationContext, PANEL_MODES.context);
            ui.stationPanelRoleFilter = DEFAULT_FILTER_ID;
        }

        lastStationPanelSignature = null;

        if (!options.silent) {
            bridge.setActionMessage(`${sourceContext.sourceLabel}: открыта отдельная крафтовая панель.`);
            bridge.renderAfterStateChange(['actions', 'inventory', 'actionHint'], {
                sceneChanged: false
            });
        }

        return true;
    }

    function openCraftPanel(options = {}) {
        return openStationPanel(null, {
            ...options,
            mode: PANEL_MODES.global
        });
    }

    function closeStationPanel(options = {}) {
        const ui = getUiState();
        const source = getActiveSource();
        const sourceContext = getSourceContext(source);

        if (ui.stationPanelMode !== PANEL_MODES.global && sourceContext && options.rememberDismissal !== false) {
            ui.dismissedStationSourceId = sourceContext.sourceId;
        } else if (options.clearDismissal) {
            ui.dismissedStationSourceId = null;
        }

        ui.openStationSourceId = null;
        ui.stationPanelMode = PANEL_MODES.context;
        lastStationPanelSignature = null;
        setPanelVisible(false);

        if (!options.silent) {
            bridge.renderAfterStateChange(['actions', 'inventory', 'actionHint'], {
                sceneChanged: false
            });
        }
    }

    function handleStationPanelClick(event) {
        const ui = getUiState();
        const filterButton = event.target.closest('[data-station-panel-filter-type]');
        if (filterButton) {
            const filterType = filterButton.getAttribute('data-station-panel-filter-type');
            const filterId = filterButton.getAttribute('data-station-panel-filter-id') || DEFAULT_FILTER_ID;

            if (filterType === 'station') {
                ui.stationPanelStationFilter = filterId;
            } else if (filterType === 'role') {
                ui.stationPanelRoleFilter = filterId;
            }

            lastStationPanelSignature = null;
            renderStationPanel();
            return;
        }

        const recipeButton = event.target.closest('[data-crafting-recipe-id]');
        const inventoryUi = getInventoryUi();

        if (!recipeButton || recipeButton.disabled || !inventoryUi || typeof inventoryUi.triggerCraftingRecipe !== 'function') {
            return;
        }

        inventoryUi.triggerCraftingRecipe(recipeButton.getAttribute('data-crafting-recipe-id'));
    }

    Object.assign(stationUi, {
        closeStationPanel,
        openCraftPanel,
        openStationPanel,
        renderCraftPanel: renderStationPanel,
        renderStationPanel
    });
})();
