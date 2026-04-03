(() => {
    const game = window.Game;
    const bagUpgradeRuntime = game.systems.bagUpgradeRuntime = game.systems.bagUpgradeRuntime || {};
    const BAG_SLOT_CAP = 10;

    function getBagUpgradeData() {
        return game.systems.bagUpgradeData || null;
    }

    function getInventoryRuntime() {
        return game.systems.inventoryRuntime || null;
    }

    function getItemRegistry() {
        return game.systems.itemRegistry || null;
    }

    function getQuestRuntime() {
        return game.systems.questRuntime || null;
    }

    function getStageList() {
        const data = getBagUpgradeData();
        const stages = data && Array.isArray(data.bagUpgradeStages)
            ? data.bagUpgradeStages
            : [];

        return stages
            .filter((stage) => stage && Number.isFinite(stage.targetSlots) && stage.targetSlots <= BAG_SLOT_CAP)
            .slice()
            .sort((left, right) => (left.islandIndex || 0) - (right.islandIndex || 0));
    }

    function getBagSlotCap() {
        return BAG_SLOT_CAP;
    }

    function getStageById(stageId) {
        const data = getBagUpgradeData();
        return data && typeof data.getBagUpgradeStage === 'function'
            ? data.getBagUpgradeStage(stageId)
            : (getStageList().find((stage) => stage.stageId === stageId) || null);
    }

    function getStageByIsland(islandIndex) {
        const data = getBagUpgradeData();
        return data && typeof data.getBagUpgradeStageForIsland === 'function'
            ? data.getBagUpgradeStageForIsland(islandIndex)
            : (getStageList().find((stage) => stage.islandIndex === islandIndex) || null);
    }

    function getUnlockedSlots() {
        const inventoryRuntime = getInventoryRuntime();
        return inventoryRuntime
            ? inventoryRuntime.getUnlockedInventorySlots()
            : Math.max(4, game.state.unlockedInventorySlots || 4);
    }

    function isStageAvailableForIsland(stage, islandIndex, currentSlots = getUnlockedSlots()) {
        if (!stage || stage.targetSlots > BAG_SLOT_CAP || currentSlots !== stage.sourceSlots) {
            return false;
        }

        const [minIsland, maxIsland] = Array.isArray(stage.appearanceWindow)
            ? stage.appearanceWindow
            : [stage.islandIndex, stage.islandIndex];

        return islandIndex >= minIsland && islandIndex <= maxIsland;
    }

    function getAvailableStageForIsland(islandIndex, options = {}) {
        const currentSlots = Number.isFinite(options.currentSlots)
            ? options.currentSlots
            : getUnlockedSlots();

        return getStageList().find((stage) => isStageAvailableForIsland(stage, islandIndex, currentSlots)) || null;
    }

    function getArtisanDefinition(npcKind) {
        const data = getBagUpgradeData();
        return data && typeof data.getArtisanDefinition === 'function'
            ? data.getArtisanDefinition(npcKind)
            : null;
    }

    function cloneRequirement(requirement) {
        return requirement
            ? {
                ...requirement,
                matchAny: Array.isArray(requirement.matchAny)
                    ? requirement.matchAny.map((rule) => ({ ...rule }))
                    : []
            }
            : null;
    }

    function cloneQuestItems(matches = [], inventoryItems = []) {
        return matches
            .filter((entry) => entry && entry.satisfied && entry.item)
            .map((entry) => {
                const item = inventoryItems[entry.itemIndex] || entry.item;
                return item ? { ...item } : null;
            })
            .filter(Boolean);
    }

    function getRequirementRules(requirement) {
        if (!requirement) {
            return [];
        }

        if (Array.isArray(requirement.matchAny) && requirement.matchAny.length > 0) {
            return requirement.matchAny.filter(Boolean);
        }

        return [requirement];
    }

    function getRequirementTagList(requirement) {
        const itemRegistry = getItemRegistry();
        const tags = [];
        const seen = new Set();

        function appendTag(label) {
            const normalized = String(label || '').trim();
            if (!normalized || seen.has(normalized)) {
                return;
            }

            seen.add(normalized);
            tags.push(normalized);
        }

        getRequirementRules(requirement).forEach((rule) => {
            (Array.isArray(rule.questCategories) ? rule.questCategories : []).forEach((category) => {
                appendTag(
                    itemRegistry && typeof itemRegistry.getQuestCategoryLabel === 'function'
                        ? itemRegistry.getQuestCategoryLabel(category)
                        : category
                );
            });

            if (Number.isFinite(rule.minTier)) {
                appendTag(`T${rule.minTier}+`);
            } else if (Number.isFinite(rule.maxTier)) {
                appendTag(`до T${rule.maxTier}`);
            }

            if (rule.uniqueOnly) {
                appendTag('уникальный');
            }

            if (rule.unusedOnly) {
                appendTag('неиспользованный');
            }

            if (Number.isFinite(rule.minCarriedIslands) && rule.minCarriedIslands > 0) {
                appendTag(`нести ${rule.minCarriedIslands}+ острова`);
            }
        });

        return tags;
    }

    function getRequirementPreferredCategories(requirement) {
        const categories = [];
        const seen = new Set();

        getRequirementRules(requirement).forEach((rule) => {
            (Array.isArray(rule.questCategories) ? rule.questCategories : []).forEach((category) => {
                if (seen.has(category)) {
                    return;
                }

                seen.add(category);
                categories.push(category);
            });
        });

        return categories;
    }

    function getSlotUnlockLabel(stage) {
        if (!stage || !Number.isFinite(stage.targetSlots)) {
            return 'Откроется новый слот';
        }

        return `Откроется слот ${stage.targetSlots}`;
    }

    function buildDisplayRequirement(entry) {
        const requirement = entry && entry.requirement ? entry.requirement : null;
        const item = entry && entry.item ? entry.item : null;

        return {
            requirementId: requirement && requirement.requirementId ? requirement.requirementId : '',
            label: requirement && requirement.label ? requirement.label : 'Требование',
            description: requirement && requirement.description ? requirement.description : '',
            optional: Boolean(entry && entry.optional),
            satisfied: Boolean(entry && entry.satisfied),
            itemId: item && item.id ? item.id : '',
            itemLabel: item && item.label ? item.label : '',
            tags: getRequirementTagList(requirement),
            statusLabel: entry && entry.satisfied
                ? 'Собрано'
                : (entry && entry.optional ? 'Опция' : 'Нужно')
        };
    }

    function buildQuestDisplayState(stage, evaluation) {
        const displayRequirements = evaluation.requirementMatches.matches.map(buildDisplayRequirement);
        const collectedRequirements = displayRequirements.filter((entry) => entry.satisfied && !entry.optional);
        const missingRequirements = displayRequirements.filter((entry) => !entry.satisfied && !entry.optional);
        const optionalRequirements = displayRequirements.filter((entry) => entry.optional);
        const questCategoryLabels = [];
        const seenLabels = new Set();

        displayRequirements.forEach((entry) => {
            entry.tags.forEach((tag) => {
                if (seenLabels.has(tag)) {
                    return;
                }

                seenLabels.add(tag);
                questCategoryLabels.push(tag);
            });
        });

        return {
            requirementMatches: displayRequirements,
            collectedRequirements,
            missingRequirements,
            optionalRequirements,
            questCategoryLabels,
            slotUnlockLabel: getSlotUnlockLabel(stage),
            slotProgressLabel: `Сумка ${stage.sourceSlots} → ${stage.targetSlots}`,
            occupancyStatusLabel: `Занято слотов: ${evaluation.occupiedSlots}/${evaluation.requiredOccupiedSlots}`,
            requirementStatusLabel: `Требования: ${evaluation.requirementMatches.matchedRequiredCount}/${evaluation.requirementMatches.requiredCount}`,
            occupancyMissingCount: Math.max(0, evaluation.requiredOccupiedSlots - evaluation.occupiedSlots),
            occupancyMissingLabel: evaluation.occupiedSlots < evaluation.requiredOccupiedSlots
                ? `Нужно занять ещё ${evaluation.requiredOccupiedSlots - evaluation.occupiedSlots} слот(а).`
                : ''
        };
    }

    function getActiveBagQuestGenerationBias(islandIndex = game.state.currentIslandIndex || 1) {
        const stage = getAvailableStageForIsland(islandIndex);

        if (!stage) {
            return null;
        }

        const evaluation = getStageEvaluation(stage, { currentIslandIndex: islandIndex });
        const missingRequirements = evaluation.requirementMatches.matches
            .filter((entry) => entry && !entry.satisfied && !entry.optional)
            .map((entry) => entry.requirement)
            .filter(Boolean);

        if (missingRequirements.length === 0) {
            return null;
        }

        const preferredCategories = [];
        const seenCategories = new Set();
        let minTier = null;

        missingRequirements.forEach((requirement) => {
            getRequirementPreferredCategories(requirement).forEach((category) => {
                if (seenCategories.has(category)) {
                    return;
                }

                seenCategories.add(category);
                preferredCategories.push(category);
            });

            getRequirementRules(requirement).forEach((rule) => {
                if (!Number.isFinite(rule.minTier)) {
                    return;
                }

                minTier = minTier === null ? rule.minTier : Math.min(minTier, rule.minTier);
            });
        });

        return preferredCategories.length > 0
            ? {
                stageId: stage.stageId,
                preferredCategories,
                minTier,
                missingRequirementCount: missingRequirements.length
            }
            : null;
    }

    function getRequiredMatchCount(stage) {
        return (stage && Array.isArray(stage.requirements) ? stage.requirements : [])
            .filter((requirement) => !requirement.optional)
            .length;
    }

    function getRequiredOccupiedSlots(stage) {
        const sourceSlots = Math.max(1, stage && stage.sourceSlots ? stage.sourceSlots : 4);
        return Math.max(getRequiredMatchCount(stage), Math.floor(sourceSlots * 0.75));
    }

    function getCurrentInventoryItems() {
        const inventoryRuntime = getInventoryRuntime();
        if (!inventoryRuntime) {
            return [];
        }

        return inventoryRuntime.getInventory()
            .slice(0, inventoryRuntime.getUnlockedInventorySlots())
            .map((item) => inventoryRuntime.normalizeInventoryItem(item))
            .filter(Boolean);
    }

    function getStageEvaluation(stage, options = {}) {
        const inventoryItems = Array.isArray(options.inventoryItems)
            ? options.inventoryItems
            : getCurrentInventoryItems();
        const itemRegistry = getItemRegistry();
        const unlockedSlots = Number.isFinite(options.unlockedSlots)
            ? options.unlockedSlots
            : (getInventoryRuntime() ? getInventoryRuntime().getUnlockedInventorySlots() : 4);
        const requirements = Array.isArray(stage && stage.requirements)
            ? stage.requirements.map(cloneRequirement).filter(Boolean)
            : [];
        const requirementMatches = itemRegistry && typeof itemRegistry.evaluateRequirementMatches === 'function'
            ? itemRegistry.evaluateRequirementMatches(inventoryItems, requirements, {
                currentIslandIndex: Number.isFinite(options.currentIslandIndex)
                    ? options.currentIslandIndex
                    : game.state.currentIslandIndex
            })
            : {
                matches: [],
                requiredCount: 0,
                matchedRequiredCount: 0,
                isComplete: false,
                missingRequirements: []
            };
        const occupiedSlots = inventoryItems.length;
        const requiredOccupiedSlots = getRequiredOccupiedSlots(stage);
        const occupancySatisfied = occupiedSlots >= requiredOccupiedSlots;
        const progressRequired = requirementMatches.requiredCount + 1;
        const progressCurrent = Math.min(
            progressRequired,
            requirementMatches.matchedRequiredCount + (occupancySatisfied ? 1 : 0)
        );

        return {
            stage,
            inventoryItems,
            unlockedSlots,
            occupiedSlots,
            requiredOccupiedSlots,
            occupancySatisfied,
            requirementMatches,
            progressRequired,
            progressCurrent,
            isComplete: requirementMatches.isComplete && occupancySatisfied,
            matchedItems: cloneQuestItems(requirementMatches.matches, inventoryItems)
        };
    }

    function getStageQuestLabel(stage) {
        if (!stage) {
            return 'Расширение сумки';
        }

        return `Расширение сумки ${stage.sourceSlots}→${stage.targetSlots}`;
    }

    function buildStageQuestDescription(stage) {
        if (!stage) {
            return 'Подготовь комплект снаряжения для следующего расширения сумки.';
        }

        return [
            stage.occupancyGoal || '',
            'Снаряжение будет передано ремесленнику в обмен на дополнительный слот.'
        ].filter(Boolean).join(' ');
    }

    function buildBagUpgradeQuest(stage, encounter = null) {
        if (!stage) {
            return null;
        }

        return {
            questType: 'bagUpgrade',
            objectiveType: 'bagLoadout',
            stageId: stage.stageId,
            label: getStageQuestLabel(stage),
            description: buildStageQuestDescription(stage),
            progressRequired: getRequiredMatchCount(stage) + 1,
            progressCurrent: 0,
            rewardGold: 0,
            rewardSlots: Math.max(1, (stage.targetSlots || 0) - (stage.sourceSlots || 0)),
            sourceSlots: stage.sourceSlots,
            targetSlots: stage.targetSlots,
            occupancyGoal: stage.occupancyGoal || '',
            appearanceWindow: Array.isArray(stage.appearanceWindow) ? stage.appearanceWindow.slice() : [],
            deadlineIslandIndex: Number.isFinite(stage.deadlineIslandIndex) ? stage.deadlineIslandIndex : null,
            requiredOccupiedSlots: getRequiredOccupiedSlots(stage),
            requirements: Array.isArray(stage.requirements)
                ? stage.requirements.map(cloneRequirement).filter(Boolean)
                : [],
            npcKind: stage.npcKind,
            npcId: encounter && encounter.npcId ? encounter.npcId : null,
            repeatable: false,
            status: 'available'
        };
    }

    function buildArtisanSummary(stage, evaluation = null) {
        const slotsLabel = stage
            ? `${stage.sourceSlots}→${stage.targetSlots}`
            : '';

        if (!stage) {
            return 'Ремесленник может расширить сумку, если принести подходящий комплект.';
        }

        if (!evaluation) {
            return `Нужен комплект для расширения сумки ${slotsLabel}.`;
        }

        return `Сумка ${slotsLabel}. Слоты заняты: ${evaluation.occupiedSlots}/${evaluation.requiredOccupiedSlots}. Совпадений: ${evaluation.requirementMatches.matchedRequiredCount}/${evaluation.requirementMatches.requiredCount}.`;
    }

    function createArtisanEncounterProfile(islandIndex, random) {
        const stage = getAvailableStageForIsland(islandIndex);
        if (!stage || stage.targetSlots > BAG_SLOT_CAP) {
            return null;
        }

        const artisan = getArtisanDefinition(stage.npcKind) || {};
        const houseStyle = islandIndex >= 18
            ? 'rich'
            : (islandIndex >= 8 ? 'ordinary' : 'poor');

        return {
            kind: 'artisan',
            npcKind: stage.npcKind,
            label: artisan.label || 'Ремесленник',
            summary: artisan.summary || 'Опытный мастер, который может расширить сумку.',
            dialogueId: artisan.dialogueId || 'artisanGreeting',
            bagStageId: stage.stageId,
            houseStyle,
            quest: buildBagUpgradeQuest(stage),
            islandIndex
        };
    }

    function prepareArtisanEncounter(source) {
        const encounter = source && source.expedition ? source.expedition : null;
        const questRuntime = getQuestRuntime();
        const stage = encounter && encounter.bagStageId
            ? getStageById(encounter.bagStageId)
            : null;

        if (!encounter || encounter.kind !== 'artisan' || !stage) {
            return null;
        }

        const currentSlots = getInventoryRuntime() ? getInventoryRuntime().getUnlockedInventorySlots() : (game.state.unlockedInventorySlots || 4);
        encounter.quest = encounter.quest || buildBagUpgradeQuest(stage, encounter);
        encounter.quest.stageId = stage.stageId;
        encounter.quest.sourceSlots = stage.sourceSlots;
        encounter.quest.targetSlots = stage.targetSlots;
        encounter.quest.appearanceWindow = Array.isArray(stage.appearanceWindow) ? stage.appearanceWindow.slice() : [];
        encounter.quest.deadlineIslandIndex = Number.isFinite(stage.deadlineIslandIndex) ? stage.deadlineIslandIndex : null;
        encounter.quest.requiredOccupiedSlots = getRequiredOccupiedSlots(stage);

        if (currentSlots >= Math.min(BAG_SLOT_CAP, stage.targetSlots)) {
            encounter.quest.status = 'completed';
            encounter.quest.completed = true;
            encounter.summary = `Этот мастер уже помог довести сумку до ${currentSlots} слотов.`;
            return encounter;
        }

        const evaluation = getStageEvaluation(stage, {
            currentIslandIndex: encounter.islandIndex || game.state.currentIslandIndex
        });

        encounter.summary = buildArtisanSummary(stage, evaluation);

        if (questRuntime && typeof questRuntime.acceptQuest === 'function') {
            questRuntime.acceptQuest(source, encounter.quest);
        }

        if (questRuntime && typeof questRuntime.getQuestProgress === 'function') {
            encounter.quest = questRuntime.getQuestProgress(source, encounter.quest) || encounter.quest;
        }

        return encounter;
    }

    function evaluateQuestProgress(questState) {
        const stage = questState && questState.stageId
            ? getStageById(questState.stageId)
            : null;

        if (!stage) {
            return null;
        }

        return getStageEvaluation(stage);
    }

    function consumeMatchedItems(evaluation) {
        const inventoryRuntime = getInventoryRuntime();
        const satisfiedRequiredEntries = evaluation && evaluation.requirementMatches
            ? evaluation.requirementMatches.matches.filter((entry) => entry && entry.satisfied && !entry.optional)
            : [];

        if (!inventoryRuntime || satisfiedRequiredEntries.length === 0) {
            return [];
        }

        const sortedEntries = satisfiedRequiredEntries
            .filter((entry) => Number.isFinite(entry.itemIndex))
            .slice()
            .sort((left, right) => right.itemIndex - left.itemIndex);
        const removedItems = [];

        sortedEntries.forEach((entry) => {
            const removed = inventoryRuntime.removeInventoryItemAtIndex(entry.itemIndex, 1);
            if (removed) {
                removedItems.push(inventoryRuntime.normalizeInventoryItem(removed));
            }
        });

        return removedItems.reverse();
    }

    function completeArtisanQuest(source, questState) {
        const encounter = source && source.expedition ? source.expedition : null;
        const stage = questState && questState.stageId
            ? getStageById(questState.stageId)
            : (encounter && encounter.bagStageId ? getStageById(encounter.bagStageId) : null);
        const inventoryRuntime = getInventoryRuntime();

        if (!stage || !inventoryRuntime) {
            return {
                success: false,
                reason: 'missing',
                message: 'Для этого расширения сумки нет активного ремесленного заказа.'
            };
        }

        const evaluation = getStageEvaluation(stage, {
            currentIslandIndex: encounter && encounter.islandIndex
                ? encounter.islandIndex
                : game.state.currentIslandIndex
        });

        if (!evaluation.isComplete) {
            return {
                success: false,
                reason: 'incomplete',
                evaluation,
                message: 'Комплект ещё не собран: не хватает нужных предметов или занятых слотов.'
            };
        }

        const removedItems = consumeMatchedItems(evaluation);
        game.state.unlockedInventorySlots = Math.max(
            inventoryRuntime.getUnlockedInventorySlots(),
            Math.min(BAG_SLOT_CAP, stage.targetSlots)
        );
        encounter.summary = `Сумка расширена до ${game.state.unlockedInventorySlots} слотов.`;

        return {
            success: true,
            stage,
            removedItems,
            slotsUnlocked: Math.max(1, stage.targetSlots - stage.sourceSlots),
            unlockedSlots: game.state.unlockedInventorySlots,
            message: `Ремесленник расширил сумку до ${game.state.unlockedInventorySlots} слотов.`
        };
    }

    function getCurrentStageForSlots(slots = game.state.unlockedInventorySlots || 4) {
        return getStageList().find((stage) => stage.sourceSlots === slots) || null;
    }

    Object.assign(bagUpgradeRuntime, {
        BAG_SLOT_CAP,
        getBagSlotCap,
        getStageList,
        getStageById,
        getStageByIsland,
        getAvailableStageForIsland,
        getCurrentStageForSlots,
        getRequiredOccupiedSlots,
        getStageEvaluation,
        buildQuestDisplayState,
        getActiveBagQuestGenerationBias,
        buildBagUpgradeQuest,
        createArtisanEncounterProfile,
        prepareArtisanEncounter,
        evaluateQuestProgress,
        completeArtisanQuest
    });
})();
