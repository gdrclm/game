(() => {
    const game = window.Game;
    const compressionRuntime = game.systems.compressionRuntime = game.systems.compressionRuntime || {};

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

    function getRecipeRegistry() {
        return game.systems.recipeRegistry || null;
    }

    function getCraftingRuntime() {
        return game.systems.craftingRuntime || null;
    }

    function getResourceRegistry() {
        return game.systems.resourceRegistry || null;
    }

    function getStationRuntime() {
        return game.systems.stationRuntime || null;
    }

    function normalizeStationId(stationId) {
        const stationRuntime = getStationRuntime();
        return stationRuntime && typeof stationRuntime.normalizeStationId === 'function'
            ? stationRuntime.normalizeStationId(stationId)
            : (typeof stationId === 'string' ? stationId.trim().toLowerCase() : '');
    }

    function resolveCompressionStations(options = {}) {
        if (Array.isArray(options.availableStations) && options.availableStations.length > 0) {
            return cloneValue(options.availableStations);
        }

        const stationRuntime = getStationRuntime();
        if (stationRuntime && typeof stationRuntime.resolveAvailableStations === 'function') {
            return stationRuntime.resolveAvailableStations(options);
        }

        return ['hand'];
    }

    function getConsumedCompressionIngredient(recipe) {
        if (!recipe || !Array.isArray(recipe.ingredients)) {
            return null;
        }

        const consumedIngredients = recipe.ingredients.filter((ingredient) => ingredient && ingredient.consumed !== false);
        return consumedIngredients.length === 1 ? consumedIngredients[0] : null;
    }

    function isCompressionRecipe(recipe) {
        if (!recipe || !recipe.result || !Array.isArray(recipe.tags) || !recipe.tags.includes('base-conversion')) {
            return false;
        }

        const ingredient = getConsumedCompressionIngredient(recipe);
        if (!ingredient || !['resource', 'item'].includes(ingredient.kind)) {
            return false;
        }

        if (!['component', 'item'].includes(recipe.result.kind)) {
            return false;
        }

        return !recipe.ingredients.some((entry) => entry && ['environment', 'itemState', 'structure'].includes(entry.kind));
    }

    function getCompressionSourceItemIds(recipe) {
        const ingredient = getConsumedCompressionIngredient(recipe);

        if (!ingredient) {
            return [];
        }

        if (ingredient.kind === 'item') {
            return [ingredient.id];
        }

        const resourceRegistry = getResourceRegistry();
        const definition = resourceRegistry && typeof resourceRegistry.getBaseResourceDefinition === 'function'
            ? resourceRegistry.getBaseResourceDefinition(ingredient.id)
            : null;

        return Array.isArray(definition && definition.currentInventoryItemIds)
            ? definition.currentInventoryItemIds.filter((itemId) => typeof itemId === 'string' && itemId.trim())
            : [];
    }

    function getCompressionRecipes(options = {}) {
        const recipeRegistry = getRecipeRegistry();
        const recipes = recipeRegistry && typeof recipeRegistry.getActiveRecipeDefinitions === 'function'
            ? recipeRegistry.getActiveRecipeDefinitions()
            : (recipeRegistry && typeof recipeRegistry.getRecipeDefinitions === 'function'
                ? recipeRegistry.getRecipeDefinitions()
                : []);
        const normalizedStation = normalizeStationId(options.station || '');

        return recipes
            .filter((recipe) => isCompressionRecipe(recipe))
            .filter((recipe) => {
                if (!normalizedStation) {
                    return true;
                }

                const stationOptions = Array.isArray(recipe.stationOptions) && recipe.stationOptions.length > 0
                    ? recipe.stationOptions
                    : [recipe.station];
                return stationOptions.some((stationId) => normalizeStationId(stationId) === normalizedStation);
            })
            .map((recipe) => cloneValue(recipe));
    }

    function getCompressionRecipesForSourceItem(itemId, options = {}) {
        const normalizedItemId = typeof itemId === 'string' ? itemId.trim() : '';

        if (!normalizedItemId) {
            return [];
        }

        return getCompressionRecipes(options)
            .filter((recipe) => getCompressionSourceItemIds(recipe).includes(normalizedItemId))
            .map((recipe) => cloneValue(recipe));
    }

    function evaluateCompressionForSourceItem(itemId, options = {}) {
        const craftingRuntime = getCraftingRuntime();

        if (!craftingRuntime || typeof craftingRuntime.evaluateRecipeAgainstInventory !== 'function') {
            return [];
        }

        const availableStations = resolveCompressionStations(options);

        return getCompressionRecipesForSourceItem(itemId, options).map((recipe) => craftingRuntime.evaluateRecipeAgainstInventory(
            recipe.recipeId,
            {
                ...options,
                availableStations
            }
        ));
    }

    function compressSourceItem(itemId, options = {}) {
        const craftingRuntime = getCraftingRuntime();

        if (!craftingRuntime || typeof craftingRuntime.craftRecipeAgainstInventory !== 'function') {
            return {
                success: false,
                reason: 'unavailable',
                message: 'Compression runtime сейчас недоступен.'
            };
        }

        const preferredRecipeId = typeof options.recipeId === 'string' ? options.recipeId.trim() : '';
        const evaluations = evaluateCompressionForSourceItem(itemId, options)
            .filter((entry) => !preferredRecipeId || (entry.recipe && entry.recipe.recipeId === preferredRecipeId));

        if (evaluations.length === 0) {
            return {
                success: false,
                reason: 'missing-compression-recipe',
                itemId,
                message: `Для "${itemId}" не найден compression-рецепт.`
            };
        }

        const craftableEvaluations = evaluations.filter((entry) => entry && entry.success);
        if (!preferredRecipeId && craftableEvaluations.length > 1) {
            return {
                success: false,
                reason: 'ambiguous-recipe',
                itemId,
                candidateRecipes: craftableEvaluations.map((entry) => ({
                    recipeId: entry.recipe.recipeId,
                    label: entry.recipe.label
                })),
                message: `Для "${itemId}" доступно несколько вариантов сжатия. Укажи recipeId явно.`
            };
        }

        const selectedEvaluation = craftableEvaluations[0] || evaluations[0];
        if (!selectedEvaluation.success) {
            return selectedEvaluation;
        }

        return craftingRuntime.craftRecipeAgainstInventory(selectedEvaluation.recipe.recipeId, {
            ...options,
            availableStations: resolveCompressionStations(options)
        });
    }

    Object.assign(compressionRuntime, {
        isCompressionRecipe,
        getCompressionRecipes,
        getCompressionRecipesForSourceItem,
        evaluateCompressionForSourceItem,
        compressSourceItem
    });
})();
