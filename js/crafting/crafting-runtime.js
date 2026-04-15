(() => {
    const game = window.Game;
    const craftingRuntime = game.systems.craftingRuntime = game.systems.craftingRuntime || {};
    const compiledRecipeCache = new Map();

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

    function normalizeStationId(station) {
        const stationRuntime = getStationRuntime();
        return stationRuntime && typeof stationRuntime.normalizeStationId === 'function'
            ? stationRuntime.normalizeStationId(station)
            : (typeof station === 'string' ? station.trim().toLowerCase() : '');
    }

    function normalizeLookupValue(value) {
        return typeof value === 'string' ? value.trim().toLowerCase() : '';
    }

    function buildEntryKey(kind, id) {
        return `${kind}:${id}`;
    }

    function getRecipeRegistry() {
        return game.systems.recipeRegistry || null;
    }

    function getStationRuntime() {
        return game.systems.stationRuntime || null;
    }

    function getResourceRegistry() {
        return game.systems.resourceRegistry || null;
    }

    function getComponentRegistry() {
        return game.systems.componentRegistry || null;
    }

    function getContainerRegistry() {
        return game.systems.containerRegistry || null;
    }

    function getInventoryRuntime() {
        return game.systems.inventoryRuntime || null;
    }

    function getItemRegistry() {
        return game.systems.itemRegistry || null;
    }

    function getStateSchema() {
        return game.systems.stateSchema || null;
    }

    function getGameEvents() {
        return game.systems.gameEvents || null;
    }

    function getInteractionsRuntime() {
        return game.systems.interactions || null;
    }

    function getWorld() {
        return game.systems.world || null;
    }

    function emitGameEvent(helperName, eventType, payload) {
        const gameEvents = getGameEvents();

        if (!gameEvents) {
            return null;
        }

        const safePayload = cloneValue(payload);

        if (typeof gameEvents[helperName] === 'function') {
            return gameEvents[helperName](safePayload);
        }

        return typeof gameEvents.emit === 'function'
            ? gameEvents.emit(eventType, safePayload)
            : null;
    }

    function normalizeEnvironmentId(value) {
        return typeof value === 'string'
            ? value.trim()
            : '';
    }

    function addEnvironmentId(environmentIds, value) {
        const normalizedValue = normalizeEnvironmentId(value);
        if (normalizedValue) {
            environmentIds.add(normalizedValue);
        }
    }

    function addInteractionEnvironmentIds(environmentIds, interaction) {
        if (!interaction || typeof interaction !== 'object') {
            return;
        }

        addEnvironmentId(environmentIds, interaction.kind);
        addEnvironmentId(environmentIds, interaction.family);
        addEnvironmentId(environmentIds, interaction.resourceNodeKind);
        addEnvironmentId(environmentIds, interaction.resourceNodeFamily);
        addEnvironmentId(environmentIds, interaction.resourceId);

        if (interaction.expedition && typeof interaction.expedition === 'object') {
            addEnvironmentId(environmentIds, interaction.expedition.kind);
            addEnvironmentId(environmentIds, interaction.expedition.family);
            addEnvironmentId(environmentIds, interaction.expedition.resourceNodeKind);
            addEnvironmentId(environmentIds, interaction.expedition.resourceNodeFamily);
            addEnvironmentId(environmentIds, interaction.expedition.resourceId);
        }
    }

    function getInteractionAtWorld(x, y) {
        const world = getWorld();
        const interactions = getInteractionsRuntime();
        const tileInfo = world && typeof world.getTileInfo === 'function'
            ? world.getTileInfo(x, y, { generateIfMissing: false })
            : null;

        if (tileInfo && tileInfo.interaction) {
            return tileInfo.interaction;
        }

        return interactions && typeof interactions.getInteractionAtWorld === 'function'
            ? interactions.getInteractionAtWorld(x, y, { generateIfMissing: false })
            : null;
    }

    function collectNearbyEnvironmentIds(environmentIds) {
        const playerPos = game.state && game.state.playerPos ? game.state.playerPos : { x: 0, y: 0 };
        const selectedTile = game.state && game.state.selectedWorldTile ? game.state.selectedWorldTile : null;
        const positions = [
            { x: Math.round(playerPos.x), y: Math.round(playerPos.y) },
            { x: Math.round(playerPos.x) + 1, y: Math.round(playerPos.y) },
            { x: Math.round(playerPos.x) - 1, y: Math.round(playerPos.y) },
            { x: Math.round(playerPos.x), y: Math.round(playerPos.y) + 1 },
            { x: Math.round(playerPos.x), y: Math.round(playerPos.y) - 1 }
        ];
        const seen = new Set();

        if (selectedTile) {
            const selectedX = Math.round(selectedTile.x);
            const selectedY = Math.round(selectedTile.y);
            const selectedDistance = Math.abs(selectedX - Math.round(playerPos.x)) + Math.abs(selectedY - Math.round(playerPos.y));

            if (selectedDistance <= 1) {
                positions.unshift({ x: selectedX, y: selectedY });
            }
        }

        positions.forEach((position) => {
            const key = `${position.x},${position.y}`;
            if (seen.has(key)) {
                return;
            }

            seen.add(key);
            addInteractionEnvironmentIds(environmentIds, getInteractionAtWorld(position.x, position.y));
        });
    }

    function resolveAvailableEnvironmentIds(options = {}) {
        const environmentIds = new Set();
        const normalizedSources = [
            options.environmentId,
            options.environment,
            options.environmentIds,
            options.availableEnvironmentIds,
            options.environments
        ];

        normalizedSources.forEach((source) => {
            if (Array.isArray(source)) {
                source.forEach((value) => addEnvironmentId(environmentIds, value));
                return;
            }

            addEnvironmentId(environmentIds, source);
        });

        addInteractionEnvironmentIds(environmentIds, options.interaction || null);
        addInteractionEnvironmentIds(environmentIds, options.activeInteraction || game.state.activeInteraction || null);

        if (options.scanNearbyEnvironment !== false) {
            collectNearbyEnvironmentIds(environmentIds);
        }

        return [...environmentIds];
    }

    function getMissingRecipeEnvironments(recipe, availableEnvironmentIds = []) {
        const availableSet = new Set((Array.isArray(availableEnvironmentIds) ? availableEnvironmentIds : [])
            .map((environmentId) => normalizeEnvironmentId(environmentId))
            .filter(Boolean));

        return (Array.isArray(recipe && recipe.ingredients) ? recipe.ingredients : [])
            .filter((ingredient) => ingredient && ingredient.kind === 'environment')
            .filter((ingredient) => !availableSet.has(normalizeEnvironmentId(ingredient.id)))
            .map((ingredient) => ({
                kind: ingredient.kind,
                id: ingredient.id,
                label: ingredient.label || ingredient.id
            }));
    }

    function buildMissingEnvironmentSummary(missingEnvironments = []) {
        return missingEnvironments
            .map((entry) => entry.label || entry.id)
            .join(', ');
    }

    function buildMissingEnvironmentError(recipe, missingEnvironments = []) {
        const requiredSummary = buildMissingEnvironmentSummary(missingEnvironments);

        return {
            success: false,
            reason: 'missing-environment',
            recipe,
            missingEnvironments: cloneValue(missingEnvironments),
            message: requiredSummary
                ? `Для рецепта "${recipe.label}" рядом нужен источник: ${requiredSummary}.`
                : `Для рецепта "${recipe.label}" не хватает обязательного окружения.`
        };
    }

    function buildReturnedContainerSummary(returnedContainers = []) {
        return (Array.isArray(returnedContainers) ? returnedContainers : [])
            .map((entry) => {
                if (!entry) {
                    return '';
                }

                const quantity = Number.isFinite(entry.quantity) && entry.quantity > 1
                    ? ` x${entry.quantity}`
                    : '';
                return `${entry.label || entry.id || 'контейнер'}${quantity}`;
            })
            .filter(Boolean)
            .join(', ');
    }

    function getItemDefinition(itemId) {
        const itemRegistry = getItemRegistry();
        return itemRegistry && typeof itemRegistry.getItemDefinition === 'function'
            ? itemRegistry.getItemDefinition(itemId)
            : null;
    }

    function isItemStackable(itemId) {
        const itemRegistry = getItemRegistry();
        return itemRegistry && typeof itemRegistry.isItemStackable === 'function'
            ? itemRegistry.isItemStackable(itemId)
            : false;
    }

    function getCraftingStateStore() {
        if (!game.state || typeof game.state !== 'object') {
            return {};
        }

        if (!game.state.craftingState || typeof game.state.craftingState !== 'object') {
            const stateSchema = getStateSchema();
            const defaultCraftingState = stateSchema && typeof stateSchema.createDomainState === 'function'
                ? stateSchema.createDomainState().craftingState
                : {
                    resources: {},
                    containers: {},
                    knownRecipes: {},
                    stationUnlocks: {},
                    resourceNodesState: {},
                    resourceNodeIslandState: {}
                };

            game.state.craftingState = cloneValue(defaultCraftingState);
        }

        return game.state.craftingState;
    }

    function getKnownRecipesStore() {
        const craftingState = getCraftingStateStore();

        if (!craftingState.knownRecipes || typeof craftingState.knownRecipes !== 'object') {
            craftingState.knownRecipes = {};
        }

        return craftingState.knownRecipes;
    }

    function getStationUnlocksStore() {
        const craftingState = getCraftingStateStore();

        if (!craftingState.stationUnlocks || typeof craftingState.stationUnlocks !== 'object') {
            craftingState.stationUnlocks = {};
        }

        return craftingState.stationUnlocks;
    }

    function normalizeEntryQuantity(quantity) {
        return Math.max(1, Number.isFinite(quantity) ? quantity : 1);
    }

    function resolveEntryLabel(kind, id, fallbackLabel = '') {
        if (fallbackLabel) {
            return fallbackLabel;
        }

        if (kind === 'resource') {
            const resourceRegistry = getResourceRegistry();
            const definition = resourceRegistry && typeof resourceRegistry.getBaseResourceDefinition === 'function'
                ? resourceRegistry.getBaseResourceDefinition(id)
                : null;
            return definition && definition.label ? definition.label : id;
        }

        if (kind === 'component') {
            const componentRegistry = getComponentRegistry();
            const definition = componentRegistry && typeof componentRegistry.getComponentDefinition === 'function'
                ? componentRegistry.getComponentDefinition(id)
                : null;
            return definition && definition.label ? definition.label : id;
        }

        const itemDefinition = getItemDefinition(id);
        return itemDefinition && itemDefinition.label ? itemDefinition.label : (fallbackLabel || id);
    }

    function buildAbstractEntry(entry, defaultQuantity = 1) {
        if (!entry || !entry.kind || !entry.id) {
            return null;
        }

        const quantity = normalizeEntryQuantity(entry.quantity || defaultQuantity);
        return {
            ...cloneValue(entry),
            quantity,
            label: resolveEntryLabel(entry.kind, entry.id, entry.label || ''),
            key: buildEntryKey(entry.kind, entry.id)
        };
    }

    function buildStockEntry(kind, id, label, quantity, extra = {}) {
        return buildAbstractEntry({
            kind,
            id,
            label,
            quantity,
            ...cloneValue(extra)
        });
    }

    function normalizeCraftStockEntries(entries = []) {
        const mergedEntries = new Map();

        (Array.isArray(entries) ? entries : []).forEach((entry) => {
            const normalizedEntry = buildAbstractEntry(entry);
            if (!normalizedEntry) {
                return;
            }

            const existing = mergedEntries.get(normalizedEntry.key);
            if (existing) {
                existing.quantity += normalizedEntry.quantity;
                return;
            }

            mergedEntries.set(normalizedEntry.key, normalizedEntry);
        });

        return [...mergedEntries.values()].map((entry) => cloneValue(entry));
    }

    function countStockEntry(entries, targetEntry) {
        const stockEntries = normalizeCraftStockEntries(entries);
        const matchingComponentIds = getMatchingComponentIds(targetEntry);
        const usesFilteredComponentSelector = Boolean(
            targetEntry
            && targetEntry.kind === 'component'
            && (
                targetEntry.qualityLevel
                || (Array.isArray(targetEntry.componentTags) && targetEntry.componentTags.length > 0)
            )
        );

        if (targetEntry && targetEntry.kind === 'component' && matchingComponentIds.length > 0 && (matchingComponentIds.length > 1 || usesFilteredComponentSelector)) {
            return stockEntries.reduce((sum, entry) => (
                entry && entry.kind === 'component' && matchingComponentIds.includes(entry.id)
                    ? sum + Math.max(0, entry.quantity || 0)
                    : sum
            ), 0);
        }

        if (usesFilteredComponentSelector && matchingComponentIds.length === 0) {
            return 0;
        }

        const targetKey = targetEntry && targetEntry.key ? targetEntry.key : buildEntryKey(targetEntry.kind, targetEntry.id);
        const match = stockEntries.find((entry) => entry.key === targetKey);
        return match ? Math.max(0, match.quantity || 0) : 0;
    }

    function removeStockEntryQuantity(entries, targetEntry, quantity) {
        let remaining = normalizeEntryQuantity(quantity);
        const stockEntries = normalizeCraftStockEntries(entries);
        const removedEntries = [];
        const matchingComponentIds = getMatchingComponentIds(targetEntry);
        const usesFilteredComponentSelector = Boolean(
            targetEntry
            && targetEntry.kind === 'component'
            && (
                targetEntry.qualityLevel
                || (Array.isArray(targetEntry.componentTags) && targetEntry.componentTags.length > 0)
            )
        );

        stockEntries.forEach((entry) => {
            let matchesTarget = entry.key === targetEntry.key;

            if (targetEntry && targetEntry.kind === 'component' && usesFilteredComponentSelector) {
                matchesTarget = entry && entry.kind === 'component' && matchingComponentIds.includes(entry.id);
            } else if (targetEntry && targetEntry.kind === 'component' && matchingComponentIds.length > 1) {
                matchesTarget = entry && entry.kind === 'component' && matchingComponentIds.includes(entry.id);
            }

            if (remaining <= 0 || !matchesTarget) {
                return;
            }

            const removedQuantity = Math.min(entry.quantity, remaining);
            entry.quantity -= removedQuantity;
            remaining -= removedQuantity;

            removedEntries.push({
                ...cloneValue(entry),
                quantity: removedQuantity
            });
        });

        return {
            success: remaining <= 0,
            remaining,
            removedEntries,
            entries: stockEntries.filter((entry) => entry.quantity > 0)
        };
    }

    function addStockEntries(entries, additions = []) {
        const nextEntries = normalizeCraftStockEntries(entries);
        const mergedEntries = new Map(nextEntries.map((entry) => [entry.key, cloneValue(entry)]));

        (Array.isArray(additions) ? additions : []).forEach((addition) => {
            const normalizedAddition = buildAbstractEntry(addition);
            if (!normalizedAddition) {
                return;
            }

            const existing = mergedEntries.get(normalizedAddition.key);
            if (existing) {
                existing.quantity += normalizedAddition.quantity;
                return;
            }

            mergedEntries.set(normalizedAddition.key, normalizedAddition);
        });

        return [...mergedEntries.values()].map((entry) => cloneValue(entry));
    }

    function getCurrentActiveHouse(options = {}) {
        if (options.activeHouse) {
            return options.activeHouse;
        }

        return game.state && game.state.activeHouse ? game.state.activeHouse : null;
    }

    function resolveAvailableStations(options = {}) {
        const stationRuntime = getStationRuntime();
        if (stationRuntime && typeof stationRuntime.resolveAvailableStations === 'function') {
            return stationRuntime.resolveAvailableStations(options);
        }

        const explicitStations = Array.isArray(options.availableStations)
            ? options.availableStations
            : (typeof options.station === 'string' ? [options.station] : []);
        const stations = new Set(['hand']);

        explicitStations
            .map(normalizeStationId)
            .filter(Boolean)
            .forEach((station) => stations.add(station));

        if (stations.size > 1 || explicitStations.length > 0) {
            return [...stations];
        }

        const activeHouse = getCurrentActiveHouse(options);
        const expedition = activeHouse && activeHouse.expedition ? activeHouse.expedition : activeHouse;

        if (!expedition) {
            return [...stations];
        }

        const houseKind = normalizeStationId(expedition.kind);
        const buildingType = normalizeStationId(expedition.buildingType);

        if (houseKind === 'shelter') {
            stations.add('camp');
        }

        if (houseKind === 'artisan' || houseKind === 'station_keeper') {
            stations.add('bench');
        }

        if (buildingType === 'workbench') {
            stations.add('bench');
        }

        if (buildingType === 'workshop' || buildingType === 'bridgehouse') {
            stations.add('workbench');
        }

        return [...stations];
    }

    function canUseRecipeAtStations(recipe, availableStations) {
        if (!recipe) {
            return false;
        }

        const stationOptions = Array.isArray(recipe.stationOptions) && recipe.stationOptions.length > 0
            ? recipe.stationOptions
            : [recipe.station];
        const normalizedAvailableStations = new Set((Array.isArray(availableStations) ? availableStations : [])
            .map(normalizeStationId)
            .filter(Boolean));

        return stationOptions.some((station) => normalizedAvailableStations.has(normalizeStationId(station)));
    }

    function inferContainerReturn(ingredient) {
        if (!ingredient || ingredient.consumed === false) {
            return null;
        }

        if (ingredient.containerReturn === false) {
            return null;
        }

        if (ingredient.containerReturn && ingredient.containerReturn.kind && ingredient.containerReturn.id) {
            return buildAbstractEntry(ingredient.containerReturn, ingredient.quantity);
        }

        if (ingredient.kind === 'itemState') {
            const containerRegistry = getContainerRegistry();
            const stateDefinition = containerRegistry && typeof containerRegistry.getContainerStateDefinition === 'function'
                ? containerRegistry.getContainerStateDefinition(ingredient.id)
                : null;
            const returnStateId = stateDefinition && typeof stateDefinition.craftIngredientReturnStateId === 'string'
                ? stateDefinition.craftIngredientReturnStateId.trim()
                : '';
            const returnState = returnStateId && containerRegistry && typeof containerRegistry.getContainerStateDefinition === 'function'
                ? containerRegistry.getContainerStateDefinition(returnStateId)
                : null;

            if (returnState && returnState.id) {
                return buildStockEntry('itemState', returnState.id, returnState.label || ingredient.label, ingredient.quantity, {
                    gameplayItemId: returnState.itemId || ''
                });
            }
        }

        return null;
    }

    function buildDirectGameplayBinding(itemId, unitsPerItem = 1) {
        const definition = getItemDefinition(itemId);

        if (!definition) {
            return null;
        }

        return {
            itemId,
            itemLabel: definition.label || itemId,
            unitsPerItem: Math.max(1, unitsPerItem)
        };
    }

    function getResourceGameplayBindings(resourceId) {
        const resourceRegistry = getResourceRegistry();
        const definition = resourceRegistry && typeof resourceRegistry.getBaseResourceDefinition === 'function'
            ? resourceRegistry.getBaseResourceDefinition(resourceId)
            : null;
        const rawBindings = Array.isArray(definition && definition.currentInventoryItemIds)
            ? definition.currentInventoryItemIds
            : [];
        const seenBindings = new Set();

        return rawBindings.map((itemId) => {
            const unitsPerItem = /Resource$/i.test(itemId) ? 5 : 1;
            const binding = buildDirectGameplayBinding(itemId, unitsPerItem);
            const bindingKey = binding ? `${binding.itemId}:${binding.unitsPerItem}` : '';

            if (!binding || seenBindings.has(bindingKey)) {
                return null;
            }

            seenBindings.add(bindingKey);
            return binding;
        }).filter(Boolean);
    }

    function getItemStateGameplayBindings(stateId, fallbackItemId = '') {
        const containerRegistry = getContainerRegistry();
        const stateDefinition = containerRegistry && typeof containerRegistry.getContainerStateDefinition === 'function'
            ? containerRegistry.getContainerStateDefinition(stateId)
            : null;
        const itemIds = [...new Set([
            stateDefinition && stateDefinition.itemId ? stateDefinition.itemId : '',
            typeof fallbackItemId === 'string' ? fallbackItemId.trim() : ''
        ].filter(Boolean))];
        const seenBindings = new Set();

        return itemIds.map((itemId) => {
            const binding = buildDirectGameplayBinding(itemId, 1);
            const bindingKey = binding ? binding.itemId : '';

            if (!binding || seenBindings.has(bindingKey)) {
                return null;
            }

            seenBindings.add(bindingKey);
            return binding;
        }).filter(Boolean);
    }

    function getMatchingComponentDefinitions(selector) {
        const componentRegistry = getComponentRegistry();
        const componentDefinitions = componentRegistry && typeof componentRegistry.getComponentDefinitions === 'function'
            ? componentRegistry.getComponentDefinitions()
            : [];
        const selectorObject = selector && typeof selector === 'object'
            ? selector
            : { id: selector };
        const requestedId = typeof selectorObject.id === 'string' && selectorObject.id.trim()
            ? selectorObject.id.trim()
            : '';
        const requestedQualityLevel = componentRegistry && typeof componentRegistry.normalizeComponentQualityLevel === 'function'
            ? componentRegistry.normalizeComponentQualityLevel(selectorObject.qualityLevel)
            : normalizeLookupValue(selectorObject.qualityLevel);
        const requestedTags = componentRegistry && typeof componentRegistry.normalizeComponentTags === 'function'
            ? componentRegistry.normalizeComponentTags(selectorObject.componentTags)
            : (Array.isArray(selectorObject.componentTags) ? selectorObject.componentTags : []);

        let candidates = requestedId
            ? componentDefinitions.filter((definition) => definition && definition.id === requestedId)
            : componentDefinitions.slice();

        if (!requestedId && requestedTags.length === 0 && !requestedQualityLevel) {
            return [];
        }

        if (requestedTags.length > 0) {
            candidates = candidates.filter((definition) => {
                const definitionTags = Array.isArray(definition && definition.tags) ? definition.tags : [];
                return requestedTags.every((tag) => definitionTags.includes(tag));
            });
        }

        if (requestedQualityLevel) {
            candidates = candidates.filter((definition) => definition && definition.qualityLevel === requestedQualityLevel);
        }

        return candidates;
    }

    function getMatchingComponentIds(selector) {
        return getMatchingComponentDefinitions(selector)
            .map((definition) => definition && definition.id)
            .filter(Boolean);
    }

    function getComponentGameplayBindings(componentSelector) {
        const componentRegistry = getComponentRegistry();
        const matchingDefinitions = getMatchingComponentDefinitions(componentSelector);
        const seenBindings = new Set();

        return matchingDefinitions.flatMap((definition) => (
            Array.isArray(definition && definition.currentInventoryItemIds)
                ? definition.currentInventoryItemIds
                : []
        )).map((itemId) => {
            const binding = buildDirectGameplayBinding(itemId, 1);
            const bindingKey = binding ? binding.itemId : '';

            if (!binding || seenBindings.has(bindingKey)) {
                return null;
            }

            seenBindings.add(bindingKey);
            return binding;
        }).filter(Boolean);
    }

    function buildGameplayInputSupport(entry) {
        if (!entry) {
            return {
                supported: false,
                bindings: [],
                reason: 'missing-entry'
            };
        }

        if (entry.kind === 'environment') {
            return {
                supported: true,
                bindings: [],
                reason: null
            };
        }

        if (entry.kind === 'itemState') {
            const bindings = getItemStateGameplayBindings(entry.id, entry.gameplayItemId);
            return bindings.length > 0
                ? { supported: true, bindings, reason: null }
                : { supported: false, bindings: [], reason: 'state-unmodeled' };
        }

        if (entry.gameplayItemId) {
            const binding = buildDirectGameplayBinding(entry.gameplayItemId, 1);
            return binding
                ? { supported: true, bindings: [binding], reason: null }
                : { supported: false, bindings: [], reason: 'unknown-item' };
        }

        if (entry.kind === 'item') {
            const binding = buildDirectGameplayBinding(entry.id, 1);
            return binding
                ? { supported: true, bindings: [binding], reason: null }
                : { supported: false, bindings: [], reason: 'unknown-item' };
        }

        if (entry.kind === 'resource') {
            const bindings = getResourceGameplayBindings(entry.id);
            return bindings.length > 0
                ? { supported: true, bindings, reason: null }
                : { supported: false, bindings: [], reason: 'resource-unmapped' };
        }

        if (entry.kind === 'component') {
            const bindings = getComponentGameplayBindings(entry);
            return bindings.length > 0
                ? { supported: true, bindings, reason: null }
                : { supported: false, bindings: [], reason: 'component-unmapped' };
        }

        return {
            supported: false,
            bindings: [],
            reason: 'unmapped'
        };
    }

    function buildGameplayOutputSupport(entry) {
        if (!entry) {
            return {
                supported: false,
                binding: null,
                reason: 'missing-entry'
            };
        }

        if (entry.kind === 'itemState') {
            const bindings = getItemStateGameplayBindings(entry.id, entry.gameplayItemId);
            return bindings.length === 1
                ? { supported: true, binding: bindings[0], reason: null }
                : { supported: false, binding: null, reason: bindings.length > 1 ? 'ambiguous-state' : 'state-unmodeled' };
        }

        if (entry.kind === 'structure') {
            return {
                supported: false,
                binding: null,
                reason: 'structure-unmodeled'
            };
        }

        if (entry.gameplayItemId) {
            const binding = buildDirectGameplayBinding(entry.gameplayItemId, 1);
            return binding
                ? { supported: true, binding, reason: null }
                : { supported: false, binding: null, reason: 'unknown-item' };
        }

        if (entry.kind === 'item') {
            const binding = buildDirectGameplayBinding(entry.id, 1);
            return binding
                ? { supported: true, binding, reason: null }
                : { supported: false, binding: null, reason: 'unknown-item' };
        }

        if (entry.kind === 'component') {
            const bindings = getComponentGameplayBindings(entry.id);
            return bindings.length === 1
                ? { supported: true, binding: bindings[0], reason: null }
                : { supported: false, binding: null, reason: bindings.length > 1 ? 'ambiguous-component' : 'component-unmapped' };
        }

        if (entry.kind === 'resource') {
            const bindings = getResourceGameplayBindings(entry.id);
            return bindings.length === 1
                ? { supported: true, binding: bindings[0], reason: null }
                : { supported: false, binding: null, reason: bindings.length > 1 ? 'ambiguous-resource' : 'resource-unmapped' };
        }

        return {
            supported: false,
            binding: null,
            reason: 'unmapped'
        };
    }

    function buildCompiledRecipe(recipeId) {
        if (compiledRecipeCache.has(recipeId)) {
            return cloneValue(compiledRecipeCache.get(recipeId));
        }

        const recipeRegistry = getRecipeRegistry();
        const definition = recipeRegistry && typeof recipeRegistry.getRecipeDefinition === 'function'
            ? recipeRegistry.getRecipeDefinition(recipeId)
            : null;

        if (!definition) {
            return null;
        }

        const ingredients = (Array.isArray(definition.ingredients) ? definition.ingredients : [])
            .map((ingredient) => {
                const abstractIngredient = buildAbstractEntry(ingredient);
                if (!abstractIngredient) {
                    return null;
                }

                return {
                    ...abstractIngredient,
                    consumed: ingredient.consumed !== false,
                    gameplaySupport: buildGameplayInputSupport(abstractIngredient),
                    containerReturn: inferContainerReturn(ingredient)
                };
            })
            .filter(Boolean);

        const result = buildAbstractEntry(definition.result);
        const containerReturns = ingredients
            .filter((ingredient) => ingredient.containerReturn)
            .map((ingredient) => ({
                ...buildAbstractEntry(ingredient.containerReturn),
                gameplaySupport: buildGameplayOutputSupport(ingredient.containerReturn)
            }));
        const missingGameplayBindings = [
            ...ingredients
                .filter((ingredient) => ingredient.consumed !== false && ingredient.kind !== 'environment' && !ingredient.gameplaySupport.supported)
                .map((ingredient) => ({ scope: 'ingredient', entry: ingredient })),
            ...(result && !buildGameplayOutputSupport(result).supported
                ? [{ scope: 'result', entry: result }]
                : []),
            ...containerReturns
                .filter((entry) => !entry.gameplaySupport.supported)
                .map((entry) => ({ scope: 'container', entry }))
        ];

        const compiledRecipe = {
            ...cloneValue(definition),
            ingredients,
            result,
            resultGameplaySupport: buildGameplayOutputSupport(result),
            containerReturns,
            missingGameplayBindings,
            supportsGameplayInventory: missingGameplayBindings.length === 0
        };

        compiledRecipeCache.set(recipeId, compiledRecipe);
        return cloneValue(compiledRecipe);
    }

    function getCompiledRecipe(recipeId) {
        return buildCompiledRecipe(recipeId);
    }

    function getCompiledRecipes() {
        const recipeRegistry = getRecipeRegistry();
        const recipeDefinitions = recipeRegistry && typeof recipeRegistry.getActiveRecipeDefinitions === 'function'
            ? recipeRegistry.getActiveRecipeDefinitions()
            : (recipeRegistry && typeof recipeRegistry.getRecipeDefinitions === 'function'
                ? recipeRegistry.getRecipeDefinitions()
                : []);

        return recipeDefinitions
            .map((recipe) => buildCompiledRecipe(recipe.recipeId))
            .filter(Boolean);
    }

    function buildStationError(recipe, availableStations) {
        const stationRuntime = getStationRuntime();
        const stationOptions = Array.isArray(recipe && recipe.stationOptions) && recipe.stationOptions.length > 0
            ? recipe.stationOptions
            : [recipe && recipe.station];
        const stationLabels = (Array.isArray(availableStations) ? availableStations : [])
            .map((station) => normalizeStationId(station))
            .filter(Boolean)
            .map((station) => stationRuntime && typeof stationRuntime.getStationLabel === 'function'
                ? stationRuntime.getStationLabel(station, station)
                : station)
            .join(', ');
        const progressionLock = stationRuntime && typeof stationRuntime.buildStationProgressionStatus === 'function'
            ? stationOptions
                .map((stationId) => stationRuntime.buildStationProgressionStatus(stationId))
                .find((entry) => entry && entry.reason === 'progression-locked')
            : null;
        const message = progressionLock
            ? (stationLabels
                ? `${progressionLock.message} Сейчас доступны: ${stationLabels}.`
                : progressionLock.message)
            : (stationLabels
                ? `Здесь нельзя собрать "${recipe.label}". Нужна станция: ${recipe.stationLabel}. Сейчас доступны: ${stationLabels}.`
                : `Здесь нельзя собрать "${recipe.label}". Нужна станция: ${recipe.stationLabel}.`);

        return {
            success: false,
            reason: 'wrong-station',
            recipe,
            progressionLockedStationId: progressionLock ? progressionLock.stationId : '',
            message
        };
    }

    function buildMissingIngredientSummary(missingIngredients = []) {
        return missingIngredients
            .map((entry) => `${entry.label}: нужно ${entry.required}, есть ${entry.available}`)
            .join('; ');
    }

    function buildUnsupportedInventoryError(recipe) {
        const missingLabels = [...new Set(recipe.missingGameplayBindings
            .map((entry) => entry && entry.entry && entry.entry.label ? entry.entry.label : null)
            .filter(Boolean))];

        return {
            success: false,
            reason: 'unavailable',
            recipe,
            unsupportedEntries: cloneValue(recipe.missingGameplayBindings),
            message: missingLabels.length > 0
                ? `Рецепт "${recipe.label}" пока не привязан к текущему инвентарю: нет runtime-представления для ${missingLabels.join(', ')}.`
                : `Рецепт "${recipe.label}" пока нельзя выполнить через текущий инвентарь.`
        };
    }

    function getStationLabel(stationId) {
        const normalizedStationId = normalizeStationId(stationId);
        const stationRuntime = getStationRuntime();

        return stationRuntime && typeof stationRuntime.getStationLabel === 'function'
            ? stationRuntime.getStationLabel(normalizedStationId, normalizedStationId)
            : normalizedStationId;
    }

    function resolveUsedStationForRecipe(recipe, options = {}) {
        const availableStations = [...new Set(resolveAvailableStations(options)
            .map((station) => normalizeStationId(station))
            .filter(Boolean))];
        const availableStationSet = new Set(availableStations);
        const stationOptions = [...new Set(((Array.isArray(recipe && recipe.stationOptions) && recipe.stationOptions.length > 0)
            ? recipe.stationOptions
            : [recipe && recipe.station])
            .map((station) => normalizeStationId(station))
            .filter(Boolean))];
        const usedStationId = stationOptions.find((station) => availableStationSet.has(station))
            || stationOptions[0]
            || availableStations[0]
            || '';

        return {
            usedStationId,
            usedStationLabel: getStationLabel(usedStationId),
            stationOptions,
            stationOptionLabels: stationOptions.map((station) => getStationLabel(station)),
            availableStations,
            availableStationLabels: availableStations.map((station) => getStationLabel(station))
        };
    }

    function buildConsumedContainerEntries(recipe) {
        return (Array.isArray(recipe && recipe.ingredients) ? recipe.ingredients : [])
            .filter((ingredient) => ingredient && ingredient.containerReturn)
            .map((ingredient) => ({
                kind: ingredient.kind,
                id: ingredient.id,
                label: ingredient.label,
                quantity: ingredient.quantity,
                returnedAs: ingredient.containerReturn
                    ? {
                        kind: ingredient.containerReturn.kind,
                        id: ingredient.containerReturn.id,
                        label: ingredient.containerReturn.label
                    }
                    : null
            }));
    }

    function buildCraftEventPayload(outcome, options = {}) {
        const recipe = outcome && outcome.recipe ? outcome.recipe : null;
        const station = resolveUsedStationForRecipe(recipe, options);

        return {
            recipeId: recipe && recipe.recipeId ? recipe.recipeId : '',
            recipeLabel: recipe && recipe.label ? recipe.label : '',
            tier: recipe && recipe.tier ? recipe.tier : null,
            tags: Array.isArray(recipe && recipe.tags) ? cloneValue(recipe.tags) : [],
            mode: outcome && outcome.mode ? outcome.mode : null,
            station: station.usedStationId,
            stationLabel: station.usedStationLabel,
            stationOptions: station.stationOptions,
            stationOptionLabels: station.stationOptionLabels,
            availableStations: station.availableStations,
            availableStationLabels: station.availableStationLabels
        };
    }

    function emitCraftingOutcomeEvents(outcome, options = {}) {
        if (!outcome || !outcome.success || !outcome.recipe) {
            return;
        }

        const basePayload = buildCraftEventPayload(outcome, options);
        emitGameEvent('emitStationUsed', 'station:used', basePayload);
        emitGameEvent('emitCraftCompleted', 'craft:completed', {
            ...basePayload,
            consumedEntries: cloneValue(outcome.consumedEntries || []),
            result: cloneValue(outcome.result || null),
            returnedContainers: cloneValue(outcome.returnedContainers || []),
            producedEntries: cloneValue(outcome.producedEntries || []),
            addedEntries: cloneValue(outcome.addedEntries || []),
            conversions: cloneValue(outcome.conversions || [])
        });

        const consumedContainers = buildConsumedContainerEntries(outcome.recipe);
        const returnedContainers = Array.isArray(outcome.returnedContainers) && outcome.returnedContainers.length > 0
            ? outcome.returnedContainers
            : (Array.isArray(outcome.recipe.containerReturns) ? outcome.recipe.containerReturns : []);

        if (consumedContainers.length > 0 || returnedContainers.length > 0) {
            emitGameEvent('emitContainerChanged', 'container:changed', {
                ...basePayload,
                consumedContainers: cloneValue(consumedContainers),
                returnedContainers: cloneValue(returnedContainers)
            });
        }
    }

    function evaluateRecipeAgainstStock(recipeId, options = {}) {
        const recipe = getCompiledRecipe(recipeId);

        if (!recipe) {
            return {
                success: false,
                reason: 'missing-recipe',
                recipe: null,
                message: `Рецепт "${recipeId}" не найден.`
            };
        }

        const availableStations = resolveAvailableStations(options);
        if (!options.ignoreStationCheck && !canUseRecipeAtStations(recipe, availableStations)) {
            return buildStationError(recipe, availableStations);
        }

        const availableEnvironmentIds = resolveAvailableEnvironmentIds(options);
        const missingEnvironments = getMissingRecipeEnvironments(recipe, availableEnvironmentIds);
        if (missingEnvironments.length > 0) {
            return buildMissingEnvironmentError(recipe, missingEnvironments);
        }

        const stockEntries = normalizeCraftStockEntries(options.stockEntries || []);
        const missingIngredients = recipe.ingredients
            .filter((ingredient) => ingredient.consumed !== false && ingredient.kind !== 'environment')
            .map((ingredient) => ({
                ...ingredient,
                available: countStockEntry(stockEntries, ingredient),
                required: ingredient.quantity
            }))
            .filter((ingredient) => ingredient.available < ingredient.required)
            .map((ingredient) => ({
                kind: ingredient.kind,
                id: ingredient.id,
                label: ingredient.label,
                required: ingredient.required,
                available: ingredient.available
            }));

        if (missingIngredients.length > 0) {
            return {
                success: false,
                reason: 'missing-ingredients',
                recipe,
                missingIngredients,
                message: `Не хватает ингредиентов для "${recipe.label}": ${buildMissingIngredientSummary(missingIngredients)}.`
            };
        }

        return {
            success: true,
            mode: 'abstract',
            recipe,
            stockEntries
        };
    }

    function craftRecipeAgainstStock(recipeId, options = {}) {
        const evaluation = evaluateRecipeAgainstStock(recipeId, options);

        if (!evaluation.success) {
            return evaluation;
        }

        let nextStockEntries = normalizeCraftStockEntries(evaluation.stockEntries);
        const consumedEntries = [];

        evaluation.recipe.ingredients
            .filter((ingredient) => ingredient.consumed !== false && ingredient.kind !== 'environment')
            .forEach((ingredient) => {
                const removed = removeStockEntryQuantity(nextStockEntries, ingredient, ingredient.quantity);

                if (removed.success) {
                    nextStockEntries = removed.entries;
                    consumedEntries.push(...removed.removedEntries);
                }
            });

        const producedEntries = addStockEntries([], [
            evaluation.recipe.result,
            ...evaluation.recipe.containerReturns
        ].filter(Boolean));
        nextStockEntries = addStockEntries(nextStockEntries, producedEntries);
        const returnedContainers = normalizeCraftStockEntries(evaluation.recipe.containerReturns);
        const returnedContainerSummary = buildReturnedContainerSummary(returnedContainers);

        const craftResult = {
            success: true,
            mode: 'abstract',
            recipe: evaluation.recipe,
            consumedEntries: normalizeCraftStockEntries(consumedEntries),
            result: cloneValue(evaluation.recipe.result),
            returnedContainers,
            producedEntries,
            stockEntries: nextStockEntries,
            message: returnedContainerSummary
                ? `Собрано: "${evaluation.recipe.result.label}". Возвращено: ${returnedContainerSummary}.`
                : `Собрано: "${evaluation.recipe.result.label}".`
        };

        emitCraftingOutcomeEvents(craftResult, options);
        return craftResult;
    }

    function getCurrentInventorySnapshot() {
        const inventoryRuntime = getInventoryRuntime();
        if (!inventoryRuntime || typeof inventoryRuntime.getInventory !== 'function') {
            return [];
        }

        return inventoryRuntime.getInventory()
            .slice(0, inventoryRuntime.getUnlockedInventorySlots())
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

    function removeItemQuantityFromSnapshot(snapshot, itemId, quantity) {
        let remaining = normalizeEntryQuantity(quantity);

        for (let index = 0; index < snapshot.length && remaining > 0; index++) {
            const item = snapshot[index];

            if (!item || item.id !== itemId) {
                continue;
            }

            const available = Math.max(1, item.quantity || 1);
            const removedQuantity = Math.min(available, remaining);
            const nextQuantity = available - removedQuantity;

            if (nextQuantity > 0) {
                snapshot[index] = {
                    ...item,
                    quantity: nextQuantity
                };
            } else {
                snapshot[index] = null;
            }

            remaining -= removedQuantity;
        }

        return remaining <= 0;
    }

    function addItemQuantityToSnapshot(snapshot, itemId, quantity) {
        const definition = getItemDefinition(itemId);

        if (!definition) {
            return {
                added: false,
                reason: 'unknown-item'
            };
        }

        const inventoryRuntime = getInventoryRuntime();
        const normalizedQuantity = normalizeEntryQuantity(quantity);
        const bulkCapacity = inventoryRuntime && typeof inventoryRuntime.getInventoryBulkCapacity === 'function'
            ? inventoryRuntime.getInventoryBulkCapacity(snapshot.length)
            : 0;
        const bulkUsage = inventoryRuntime && typeof inventoryRuntime.getInventoryBulkUsage === 'function'
            ? inventoryRuntime.getInventoryBulkUsage(snapshot, { slotCount: snapshot.length })
            : 0;
        const addedBulk = inventoryRuntime && typeof inventoryRuntime.getItemBulk === 'function'
            ? inventoryRuntime.getItemBulk(itemId, normalizedQuantity)
            : 0;

        if (bulkCapacity > 0 && addedBulk > 0 && bulkUsage + addedBulk > bulkCapacity) {
            return {
                added: false,
                reason: 'bulk-full'
            };
        }

        if (isItemStackable(itemId)) {
            const existingIndex = snapshot.findIndex((item) => item && item.id === itemId);

            if (existingIndex >= 0) {
                snapshot[existingIndex] = {
                    ...snapshot[existingIndex],
                    quantity: Math.max(1, (snapshot[existingIndex].quantity || 1) + normalizedQuantity)
                };
                return {
                    added: true,
                    reason: 'stacked'
                };
            }
        }

        let remaining = normalizedQuantity;

        while (remaining > 0) {
            const emptyIndex = snapshot.findIndex((item) => !item);

            if (emptyIndex === -1) {
                return {
                    added: false,
                    reason: 'slot-full'
                };
            }

            const stackQuantity = isItemStackable(itemId) ? remaining : 1;
            snapshot[emptyIndex] = {
                id: itemId,
                icon: definition.icon || '?',
                label: definition.label || itemId,
                quantity: stackQuantity,
                obtainedIslandIndex: Math.max(1, game.state.currentIslandIndex || 1),
                useCount: 0
            };
            remaining -= stackQuantity;
        }

        return {
            added: true,
            reason: 'new'
        };
    }

    function buildGameplayMissingIngredient(ingredient, snapshotBeforePlanning) {
        const bindings = ingredient && ingredient.gameplaySupport && Array.isArray(ingredient.gameplaySupport.bindings)
            ? ingredient.gameplaySupport.bindings
            : [];
        const available = bindings.reduce((sum, binding) => sum + countItemQuantityInSnapshot(snapshotBeforePlanning, binding.itemId) * binding.unitsPerItem, 0);

        return {
            kind: ingredient.kind,
            id: ingredient.id,
            label: ingredient.label,
            required: ingredient.quantity,
            available
        };
    }

    function planGameplayIngredientConsumption(ingredient, snapshot) {
        const bindings = ingredient && ingredient.gameplaySupport && Array.isArray(ingredient.gameplaySupport.bindings)
            ? ingredient.gameplaySupport.bindings
            : [];
        const remainingSnapshot = snapshot;
        let remainingUnits = ingredient.quantity;
        const consumptionPlan = [];

        const candidates = bindings
            .map((binding) => ({
                ...binding,
                availableQuantity: countItemQuantityInSnapshot(remainingSnapshot, binding.itemId)
            }))
            .filter((binding) => binding.availableQuantity > 0)
            .sort((left, right) => {
                if (left.unitsPerItem !== right.unitsPerItem) {
                    return right.unitsPerItem - left.unitsPerItem;
                }

                return left.itemId.localeCompare(right.itemId);
            });

        candidates.forEach((binding) => {
            if (remainingUnits <= 0 || binding.unitsPerItem > remainingUnits) {
                return;
            }

            const maxFittableQuantity = Math.floor(remainingUnits / binding.unitsPerItem);
            const quantityToUse = Math.min(binding.availableQuantity, maxFittableQuantity);

            if (quantityToUse <= 0) {
                return;
            }

            removeItemQuantityFromSnapshot(remainingSnapshot, binding.itemId, quantityToUse);
            consumptionPlan.push({
                itemId: binding.itemId,
                itemLabel: binding.itemLabel,
                quantity: quantityToUse,
                unitsPerItem: binding.unitsPerItem,
                unitsConsumed: quantityToUse * binding.unitsPerItem
            });
            remainingUnits -= quantityToUse * binding.unitsPerItem;
        });

        return {
            success: remainingUnits <= 0,
            remainingUnits,
            consumptionPlan
        };
    }

    function buildGameplayAdditions(recipe) {
        const additions = [];

        if (recipe.result && recipe.resultGameplaySupport && recipe.resultGameplaySupport.supported) {
            additions.push({
                entry: recipe.result,
                itemId: recipe.resultGameplaySupport.binding.itemId,
                quantity: recipe.result.quantity
            });
        }

        recipe.containerReturns.forEach((entry) => {
            if (entry && entry.gameplaySupport && entry.gameplaySupport.supported) {
                additions.push({
                    entry,
                    itemId: entry.gameplaySupport.binding.itemId,
                    quantity: entry.quantity
                });
            }
        });

        return additions;
    }

    function evaluateRecipeAgainstInventory(recipeId, options = {}) {
        const recipe = getCompiledRecipe(recipeId);

        if (!recipe) {
            return {
                success: false,
                reason: 'missing-recipe',
                recipe: null,
                message: `Рецепт "${recipeId}" не найден.`
            };
        }

        const availableStations = resolveAvailableStations(options);
        if (!options.ignoreStationCheck && !canUseRecipeAtStations(recipe, availableStations)) {
            return buildStationError(recipe, availableStations);
        }

        const availableEnvironmentIds = resolveAvailableEnvironmentIds(options);
        const missingEnvironments = getMissingRecipeEnvironments(recipe, availableEnvironmentIds);
        if (missingEnvironments.length > 0) {
            return buildMissingEnvironmentError(recipe, missingEnvironments);
        }

        if (!recipe.supportsGameplayInventory) {
            return buildUnsupportedInventoryError(recipe);
        }

        const inventoryRuntime = getInventoryRuntime();
        if (!inventoryRuntime || typeof inventoryRuntime.consumeInventoryItemById !== 'function' || typeof inventoryRuntime.addInventoryItem !== 'function') {
            return {
                success: false,
                reason: 'unavailable',
                recipe,
                message: 'Инвентарь сейчас недоступен для крафта.'
            };
        }

        const snapshotBeforePlanning = getCurrentInventorySnapshot();
        const workingSnapshot = snapshotBeforePlanning.map((item) => item ? cloneValue(item) : null);
        const missingIngredients = [];
        const consumptionPlan = [];

        recipe.ingredients
            .filter((ingredient) => ingredient.consumed !== false && ingredient.kind !== 'environment')
            .forEach((ingredient) => {
                if (missingIngredients.length > 0) {
                    return;
                }

                const planning = planGameplayIngredientConsumption(ingredient, workingSnapshot);

                if (!planning.success) {
                    missingIngredients.push(buildGameplayMissingIngredient(ingredient, snapshotBeforePlanning));
                    return;
                }

                consumptionPlan.push(...planning.consumptionPlan);
            });

        if (missingIngredients.length > 0) {
            return {
                success: false,
                reason: 'missing-ingredients',
                recipe,
                missingIngredients,
                message: `Не хватает ингредиентов для "${recipe.label}": ${buildMissingIngredientSummary(missingIngredients)}.`
            };
        }

        const additions = buildGameplayAdditions(recipe);
        const projectedSnapshot = workingSnapshot.map((item) => item ? cloneValue(item) : null);
        let fitFailure = null;
        additions.forEach((addition) => {
            if (fitFailure) {
                return;
            }

            const addOutcome = addItemQuantityToSnapshot(projectedSnapshot, addition.itemId, addition.quantity);
            if (!addOutcome || !addOutcome.added) {
                fitFailure = addOutcome || {
                    added: false,
                    reason: 'slot-full'
                };
            }
        });

        if (fitFailure) {
            return {
                success: false,
                reason: 'inventory-full',
                capacityType: fitFailure.reason === 'bulk-full' ? 'bulk' : 'slots',
                recipe,
                message: fitFailure.reason === 'bulk-full'
                    ? `После крафта "${recipe.label}" сумка окажется перегружена по объёму.`
                    : `После крафта "${recipe.label}" в сумке не хватит места для результата или контейнеров.`
            };
        }

        return {
            success: true,
            mode: 'gameInventory',
            recipe,
            consumptionPlan,
            additions
        };
    }

    function craftRecipeAgainstInventory(recipeId, options = {}) {
        const evaluation = evaluateRecipeAgainstInventory(recipeId, options);

        if (!evaluation.success) {
            return evaluation;
        }

        const inventoryRuntime = getInventoryRuntime();
        const consumedEntries = [];
        let operationFailed = false;

        evaluation.consumptionPlan.forEach((operation) => {
            if (operationFailed) {
                return;
            }

            const removed = inventoryRuntime.consumeInventoryItemById(operation.itemId, operation.quantity);

            if (!removed || !removed.success) {
                operationFailed = true;
                return;
            }

            consumedEntries.push(...(removed.removed || []).map((item) => cloneValue(item)));
        });

        if (operationFailed) {
            return {
                success: false,
                reason: 'inventory-changed',
                recipe: evaluation.recipe,
                message: `Не удалось израсходовать ингредиенты для "${evaluation.recipe.label}": содержимое сумки изменилось.`
            };
        }

        const addedEntries = [];
        const conversions = [];

        evaluation.additions.forEach((addition) => {
            if (operationFailed) {
                return;
            }

            const outcome = inventoryRuntime.addInventoryItem(addition.itemId, addition.quantity);

            if (!outcome || !outcome.added) {
                operationFailed = true;
                return;
            }

            if (outcome.item) {
                addedEntries.push(cloneValue(outcome.item));
            }

            if (Array.isArray(outcome.conversions) && outcome.conversions.length > 0) {
                conversions.push(...outcome.conversions.map((entry) => cloneValue(entry)));
            }
        });

        if (operationFailed) {
            return {
                success: false,
                reason: 'inventory-changed',
                recipe: evaluation.recipe,
                message: `Не удалось выдать результат "${evaluation.recipe.result.label}": содержимое сумки изменилось во время крафта.`
            };
        }

        const returnedContainers = evaluation.additions
            .filter((entry) => evaluation.recipe.containerReturns.some((containerEntry) => containerEntry.key === entry.entry.key))
            .map((entry) => ({
                kind: entry.entry.kind,
                id: entry.entry.id,
                label: entry.entry.label,
                quantity: entry.quantity,
                itemId: entry.itemId
            }));
        const returnedContainerSummary = buildReturnedContainerSummary(returnedContainers);

        const craftResult = {
            success: true,
            mode: 'gameInventory',
            recipe: evaluation.recipe,
            consumedEntries: normalizeCraftStockEntries(consumedEntries.map((item) => ({
                kind: 'item',
                id: item.id,
                label: item.label,
                quantity: item.quantity
            }))),
            result: {
                kind: evaluation.recipe.result.kind,
                id: evaluation.recipe.result.id,
                label: evaluation.recipe.result.label,
                quantity: evaluation.recipe.result.quantity,
                itemId: evaluation.recipe.resultGameplaySupport.binding.itemId
            },
            returnedContainers,
            addedEntries,
            conversions,
            message: returnedContainerSummary
                ? `Собрано: "${evaluation.recipe.result.label}". Возвращено: ${returnedContainerSummary}.`
                : `Собрано: "${evaluation.recipe.result.label}".`
        };

        emitCraftingOutcomeEvents(craftResult, options);
        return craftResult;
    }

    function evaluateRecipe(recipeId, options = {}) {
        return Array.isArray(options.stockEntries) || options.mode === 'abstract'
            ? evaluateRecipeAgainstStock(recipeId, options)
            : evaluateRecipeAgainstInventory(recipeId, options);
    }

    function craftRecipe(recipeId, options = {}) {
        return Array.isArray(options.stockEntries) || options.mode === 'abstract'
            ? craftRecipeAgainstStock(recipeId, options)
            : craftRecipeAgainstInventory(recipeId, options);
    }

    function getRecipesForStation(station) {
        const normalizedStation = normalizeStationId(station);

        return getCompiledRecipes().filter((recipe) => {
            const stationOptions = Array.isArray(recipe.stationOptions) && recipe.stationOptions.length > 0
                ? recipe.stationOptions
                    : [recipe.station];

            return stationOptions.some((entryStation) => normalizeStationId(entryStation) === normalizedStation);
        });
    }

    function isRecipeUnlocked(recipeId) {
        return Boolean(getKnownRecipesStore()[recipeId]);
    }

    function getUnlockedRecipeIds() {
        return Object.keys(getKnownRecipesStore());
    }

    function isStationUnlocked(stationId) {
        const normalizedStationId = normalizeStationId(stationId);
        return Boolean(normalizedStationId && getStationUnlocksStore()[normalizedStationId]);
    }

    function getUnlockedStationIds() {
        return Object.keys(getStationUnlocksStore());
    }

    function unlockRecipe(recipeId, options = {}) {
        const recipe = getCompiledRecipe(recipeId);

        if (!recipe) {
            return {
                success: false,
                reason: 'missing-recipe',
                recipeId
            };
        }

        const knownRecipes = getKnownRecipesStore();
        if (knownRecipes[recipeId]) {
            return {
                success: true,
                recipeId,
                alreadyUnlocked: true,
                entry: cloneValue(knownRecipes[recipeId])
            };
        }

        const entry = {
            recipeId,
            unlockedAtIslandIndex: Math.max(1, options.islandIndex || game.state.currentIslandIndex || 1)
        };

        knownRecipes[recipeId] = entry;
        emitGameEvent('emitRecipeUnlocked', 'recipe:unlocked', {
            recipeId,
            recipeLabel: recipe.label,
            tier: recipe.tier,
            tags: cloneValue(recipe.tags || []),
            unlockedAtIslandIndex: entry.unlockedAtIslandIndex
        });

        return {
            success: true,
            recipeId,
            alreadyUnlocked: false,
            entry: cloneValue(entry)
        };
    }

    function unlockStation(stationId, options = {}) {
        const stationRuntime = getStationRuntime();
        const normalizedStationId = normalizeStationId(stationId);
        const station = stationRuntime && typeof stationRuntime.getStationDefinition === 'function'
            ? stationRuntime.getStationDefinition(normalizedStationId)
            : null;

        if (!station || !normalizedStationId) {
            return {
                success: false,
                reason: 'missing-station',
                stationId: normalizedStationId || stationId || ''
            };
        }

        const stationUnlocks = getStationUnlocksStore();
        if (stationUnlocks[normalizedStationId]) {
            return {
                success: true,
                stationId: normalizedStationId,
                alreadyUnlocked: true,
                entry: cloneValue(stationUnlocks[normalizedStationId])
            };
        }

        const entry = {
            stationId: normalizedStationId,
            unlockedAtIslandIndex: Math.max(1, options.islandIndex || game.state.currentIslandIndex || 1)
        };

        stationUnlocks[normalizedStationId] = entry;
        return {
            success: true,
            stationId: normalizedStationId,
            alreadyUnlocked: false,
            entry: cloneValue(entry)
        };
    }

    Object.assign(craftingRuntime, {
        buildStockEntry,
        normalizeCraftStockEntries,
        countStockEntry,
        resolveAvailableStations,
        getCompiledRecipe,
        getCompiledRecipes,
        getRecipesForStation,
        evaluateRecipeAgainstStock,
        craftRecipeAgainstStock,
        evaluateRecipeAgainstInventory,
        craftRecipeAgainstInventory,
        evaluateRecipe,
        craftRecipe,
        getUnlockedRecipeIds,
        getUnlockedStationIds,
        isRecipeUnlocked,
        isStationUnlocked,
        unlockRecipe,
        unlockStation
    });
})();
