(() => {
    const game = window.Game;
    const craftBalanceRuntime = game.systems.craftBalanceRuntime = game.systems.craftBalanceRuntime || {};

    const REQUIRED_NEED_LEVELS = Object.freeze(['mandatory', 'recommended']);
    const CRAFT_PHASE_IDS = Object.freeze({
        survival: 'survival',
        bridge: 'bridge',
        advanced: 'advanced'
    });
    const BASELINE_COMPLETION_GROUPS = Object.freeze([
        {
            groupId: 'survival-core',
            label: 'Ранняя база выживания',
            phaseId: CRAFT_PHASE_IDS.survival,
            mode: 'all',
            branchIds: ['water_cycle', 'cheap_healing', 'survival_food']
        },
        {
            groupId: 'bridge-core',
            label: 'Базовый мостовой слой',
            phaseId: CRAFT_PHASE_IDS.bridge,
            mode: 'all',
            branchIds: ['fiber_rope', 'first_bridge', 'bridge_repair']
        },
        {
            groupId: 'water-core',
            label: 'Базовая водная логистика',
            phaseId: CRAFT_PHASE_IDS.advanced,
            mode: 'all',
            branchIds: ['boat_ready', 'repair_support']
        },
        {
            groupId: 'late-route-core',
            label: 'Поздний гарантированный маршрут',
            phaseId: CRAFT_PHASE_IDS.advanced,
            mode: 'any',
            branchIds: ['endgame_route', 'guaranteed_route']
        },
        {
            groupId: 'late-survival-core',
            label: 'Поздняя стабилизация',
            phaseId: CRAFT_PHASE_IDS.advanced,
            mode: 'any',
            branchIds: ['strong_survival', 'final_survival']
        }
    ]);

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

    function normalizeLookupValue(value) {
        return typeof value === 'string' ? value.trim().toLowerCase() : '';
    }

    function normalizeStringList(values) {
        return [...new Set((Array.isArray(values) ? values : [])
            .map((value) => typeof value === 'string' ? value.trim() : '')
            .filter(Boolean))];
    }

    function getIslandNeedProfile() {
        return game.systems.islandNeedProfile || null;
    }

    function getRecipeRegistry() {
        return game.systems.recipeRegistry || null;
    }

    function getBranchDefinitions(options = {}) {
        if (Array.isArray(options.branchDefinitions)) {
            return options.branchDefinitions.map((definition) => cloneValue(definition));
        }

        const islandNeedProfile = getIslandNeedProfile();
        return islandNeedProfile && Array.isArray(islandNeedProfile.craftBranchDefinitions)
            ? islandNeedProfile.craftBranchDefinitions.map((definition) => cloneValue(definition))
            : [];
    }

    function getNeedWindows(options = {}) {
        if (Array.isArray(options.needWindows)) {
            return options.needWindows.map((definition) => cloneValue(definition));
        }

        const islandNeedProfile = getIslandNeedProfile();
        return islandNeedProfile && Array.isArray(islandNeedProfile.islandNeedWindows)
            ? islandNeedProfile.islandNeedWindows.map((definition) => cloneValue(definition))
            : [];
    }

    function getActiveRecipeIds(options = {}) {
        if (Array.isArray(options.activeRecipeIds)) {
            return normalizeStringList(options.activeRecipeIds);
        }

        const recipeRegistry = getRecipeRegistry();
        const activeRecipes = recipeRegistry && typeof recipeRegistry.getActiveRecipeDefinitions === 'function'
            ? recipeRegistry.getActiveRecipeDefinitions()
            : [];

        return normalizeStringList(activeRecipes.map((recipe) => recipe && recipe.recipeId));
    }

    function getRequiredNeedLevels(options = {}) {
        if (Array.isArray(options.requiredNeedLevels) && options.requiredNeedLevels.length > 0) {
            return normalizeStringList(options.requiredNeedLevels);
        }

        return REQUIRED_NEED_LEVELS.slice();
    }

    function getBaselineCompletionGroups(options = {}) {
        if (Array.isArray(options.baselineCompletionGroups) && options.baselineCompletionGroups.length > 0) {
            return options.baselineCompletionGroups.map((group) => cloneValue(group));
        }

        return BASELINE_COMPLETION_GROUPS.map((group) => cloneValue(group));
    }

    function getCraftPhaseIdByIsland(islandIndex) {
        const normalizedIslandIndex = Math.max(1, Math.floor(Number(islandIndex) || 1));

        if (normalizedIslandIndex <= 3) {
            return CRAFT_PHASE_IDS.survival;
        }

        if (normalizedIslandIndex <= 15) {
            return CRAFT_PHASE_IDS.bridge;
        }

        return CRAFT_PHASE_IDS.advanced;
    }

    function windowTouchesPhase(windowDefinition, phaseId) {
        if (!windowDefinition || !phaseId) {
            return false;
        }

        const fromIsland = Math.max(1, Math.floor(Number(windowDefinition.islandFrom) || 1));
        const toIsland = Math.max(fromIsland, Math.floor(Number(windowDefinition.islandTo) || fromIsland));

        for (let islandIndex = fromIsland; islandIndex <= toIsland; islandIndex += 1) {
            if (getCraftPhaseIdByIsland(islandIndex) === phaseId) {
                return true;
            }
        }

        return false;
    }

    function buildBranchCoverageMap(needWindows) {
        const coverageMap = Object.create(null);

        (Array.isArray(needWindows) ? needWindows : []).forEach((windowDefinition) => {
            ['mandatory', 'recommended', 'optional'].forEach((needLevel) => {
                const bucket = windowDefinition && windowDefinition[needLevel];
                const branchIds = normalizeStringList(bucket && bucket.branches);

                branchIds.forEach((branchId) => {
                    if (!coverageMap[branchId]) {
                        coverageMap[branchId] = {
                            branchId,
                            entries: []
                        };
                    }

                    coverageMap[branchId].entries.push({
                        needLevel,
                        windowId: windowDefinition.windowId || '',
                        islandFrom: Number(windowDefinition.islandFrom) || 1,
                        islandTo: Number(windowDefinition.islandTo) || 1,
                        phaseId: getCraftPhaseIdByIsland(windowDefinition.islandFrom)
                    });
                });
            });
        });

        return coverageMap;
    }

    function getGroupBranchStatus(branchId, phaseId, coverageMap, activeRecipeIdSet, branchDefinitionById, requiredNeedLevels) {
        const coverageEntries = coverageMap[branchId] && Array.isArray(coverageMap[branchId].entries)
            ? coverageMap[branchId].entries
            : [];
        const relevantCoverage = coverageEntries.filter((entry) => (
            entry
            && entry.phaseId === phaseId
            && requiredNeedLevels.includes(entry.needLevel)
        ));
        const branchDefinition = branchDefinitionById[branchId] || null;
        const exampleRecipeIds = normalizeStringList(branchDefinition && branchDefinition.exampleRecipeIds);
        const activeRecipeIds = exampleRecipeIds.filter((recipeId) => activeRecipeIdSet.has(recipeId));

        return {
            branchId,
            label: branchDefinition && branchDefinition.label ? branchDefinition.label : branchId,
            coveredInPhase: relevantCoverage.length > 0,
            supportingNeedLevels: normalizeStringList(relevantCoverage.map((entry) => entry.needLevel)),
            supportingWindowIds: normalizeStringList(relevantCoverage.map((entry) => entry.windowId)),
            exampleRecipeIds,
            activeRecipeIds,
            hasActiveRecipeSupport: activeRecipeIds.length > 0
        };
    }

    function evaluateBaselineGroup(groupDefinition, coverageMap, activeRecipeIdSet, branchDefinitionById, requiredNeedLevels) {
        const branchStatuses = normalizeStringList(groupDefinition.branchIds)
            .map((branchId) => getGroupBranchStatus(
                branchId,
                groupDefinition.phaseId,
                coverageMap,
                activeRecipeIdSet,
                branchDefinitionById,
                requiredNeedLevels
            ));

        const coveredBranches = branchStatuses.filter((status) => status.coveredInPhase && status.hasActiveRecipeSupport);
        const missingCoverageBranchIds = branchStatuses
            .filter((status) => !status.coveredInPhase)
            .map((status) => status.branchId);
        const missingRecipeSupportBranchIds = branchStatuses
            .filter((status) => status.coveredInPhase && !status.hasActiveRecipeSupport)
            .map((status) => status.branchId);
        const isSatisfied = groupDefinition.mode === 'any'
            ? coveredBranches.length > 0
            : coveredBranches.length === branchStatuses.length;

        return {
            groupId: groupDefinition.groupId,
            label: groupDefinition.label,
            phaseId: groupDefinition.phaseId,
            mode: groupDefinition.mode,
            branchStatuses,
            coveredBranchIds: coveredBranches.map((status) => status.branchId),
            missingCoverageBranchIds,
            missingRecipeSupportBranchIds,
            satisfied: isSatisfied
        };
    }

    function buildCraftTreeBalanceAudit(options = {}) {
        const branchDefinitions = getBranchDefinitions(options);
        const needWindows = getNeedWindows(options);
        const baselineGroups = getBaselineCompletionGroups(options);
        const requiredNeedLevels = getRequiredNeedLevels(options);
        const activeRecipeIds = getActiveRecipeIds(options);
        const activeRecipeIdSet = new Set(activeRecipeIds);
        const branchDefinitionById = Object.fromEntries(
            branchDefinitions.map((definition) => [definition.id, cloneValue(definition)])
        );
        const allBranchIds = normalizeStringList(branchDefinitions.map((definition) => definition.id));
        const baselineBranchIds = normalizeStringList(baselineGroups.flatMap((group) => group.branchIds));
        const specializationBranchIds = allBranchIds.filter((branchId) => !baselineBranchIds.includes(branchId));
        const coverageMap = buildBranchCoverageMap(needWindows);
        const groupEvaluations = baselineGroups.map((group) => evaluateBaselineGroup(
            group,
            coverageMap,
            activeRecipeIdSet,
            branchDefinitionById,
            requiredNeedLevels
        ));
        const missingBaselineGroups = groupEvaluations.filter((group) => !group.satisfied);
        const specializationBranchCoverage = specializationBranchIds.filter((branchId) => (
            coverageMap[branchId]
            && Array.isArray(coverageMap[branchId].entries)
            && coverageMap[branchId].entries.length > 0
        ));
        const requiresFullCraftTree = specializationBranchIds.length === 0 || specializationBranchCoverage.length === 0;
        const baselineCompletionPossible = missingBaselineGroups.length === 0;
        const errors = [];

        missingBaselineGroups.forEach((group) => {
            if (group.missingCoverageBranchIds.length > 0) {
                errors.push(`Базовая группа "${group.label}" потеряла phase-cover по веткам: ${group.missingCoverageBranchIds.join(', ')}.`);
            }

            if (group.missingRecipeSupportBranchIds.length > 0) {
                errors.push(`Базовая группа "${group.label}" не имеет активных рецептов для веток: ${group.missingRecipeSupportBranchIds.join(', ')}.`);
            }
        });

        if (requiresFullCraftTree) {
            errors.push('Баланс схлопнулся в полный craft tree: не осталось явных специализационных веток вне базового completion-path.');
        }

        return {
            pass: baselineCompletionPossible && !requiresFullCraftTree,
            baselineCompletionPossible,
            requiresFullCraftTree,
            requiredNeedLevels: cloneValue(requiredNeedLevels),
            activeRecipeIds: cloneValue(activeRecipeIds),
            totalCraftBranchCount: allBranchIds.length,
            baselineBranchIds: cloneValue(baselineBranchIds),
            specializationBranchIds: cloneValue(specializationBranchIds),
            specializationBranchCoverage: cloneValue(specializationBranchCoverage),
            groupEvaluations,
            errors
        };
    }

    function validateCraftTreeBalance(options = {}) {
        const audit = buildCraftTreeBalanceAudit(options);

        if (!audit.pass && options.throwOnError) {
            throw new Error(`[craft-balance] ${audit.errors.join(' ')}`);
        }

        return audit;
    }

    Object.assign(craftBalanceRuntime, {
        CRAFT_PHASE_IDS,
        BASELINE_COMPLETION_GROUPS: BASELINE_COMPLETION_GROUPS.map((group) => cloneValue(group)),
        buildCraftTreeBalanceAudit,
        validateCraftTreeBalance
    });
})();
