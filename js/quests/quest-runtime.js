(() => {
    const game = window.Game;
    const questRuntime = game.systems.questRuntime = game.systems.questRuntime || {};

    function getQuestRegistry() {
        return game.systems.questRegistry || null;
    }

    function getInventoryRuntime() {
        return game.systems.inventoryRuntime || null;
    }

    function getBagUpgradeRuntime() {
        return game.systems.bagUpgradeRuntime || null;
    }

    function ensureQuestCollections() {
        game.state.activeQuestIds = Array.isArray(game.state.activeQuestIds) ? game.state.activeQuestIds : [];
        game.state.completedQuestIds = Array.isArray(game.state.completedQuestIds) ? game.state.completedQuestIds : [];
        game.state.questStateById = game.state.questStateById || {};

        return {
            activeQuestIds: game.state.activeQuestIds,
            completedQuestIds: game.state.completedQuestIds,
            questStateById: game.state.questStateById
        };
    }

    function clampProgress(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function buildQuestId(source, quest = {}) {
        if (quest.questId) {
            return quest.questId;
        }

        if (source && source.houseId) {
            return `${quest.questType || 'quest'}:${source.houseId}`;
        }

        if (source && source.id) {
            return `${quest.questType || 'quest'}:${source.id}`;
        }

        if (quest.itemId) {
            return `${quest.questType || 'quest'}:${quest.itemId}`;
        }

        return `${quest.questType || 'quest'}:default`;
    }

    function buildQuestSourceMeta(source, quest = {}) {
        const encounter = source && source.expedition ? source.expedition : null;
        const npcStateByNpcId = game.state.npcStateByNpcId || {};
        const npcState = quest.npcId && npcStateByNpcId[quest.npcId]
            ? npcStateByNpcId[quest.npcId]
            : null;

        return {
            sourceId: source && source.id ? source.id : null,
            sourceHouseId: source && source.houseId ? source.houseId : null,
            sourceKind: encounter && encounter.kind ? encounter.kind : (quest.sourceKind || 'npc'),
            sourceLabel: encounter && encounter.label
                ? encounter.label
                : (quest.sourceLabel || (npcState && npcState.label ? npcState.label : 'Неизвестный NPC')),
            sourceIslandIndex: encounter && Number.isFinite(encounter.islandIndex)
                ? encounter.islandIndex
                : (Number.isFinite(game.state.currentIslandIndex) ? game.state.currentIslandIndex : 1),
            npcId: quest.npcId || null,
            npcLabel: npcState && npcState.label ? npcState.label : null
        };
    }

    function normalizeQuest(source, quest = {}) {
        const registry = getQuestRegistry();
        const questType = quest.questType || quest.templateId || 'merchantDelivery';
        const baseQuest = registry && typeof registry.createQuestFromTemplate === 'function'
            ? registry.createQuestFromTemplate(questType, quest)
            : { ...quest, questType };
        const progressRequired = Math.max(1, Math.round(baseQuest.progressRequired || baseQuest.quantity || 1));
        const sourceMeta = buildQuestSourceMeta(source, baseQuest);

        return {
            ...baseQuest,
            questId: buildQuestId(source, baseQuest),
            questType,
            objectiveType: baseQuest.objectiveType || 'generic',
            progressRequired,
            quantity: progressRequired,
            progressCurrent: Math.max(0, Math.round(baseQuest.progressCurrent || 0)),
            rewardGold: Math.max(0, Math.round(baseQuest.rewardGold || 0)),
            status: baseQuest.status || (baseQuest.completed ? 'completed' : 'available'),
            repeatable: Boolean(baseQuest.repeatable),
            completed: Boolean(baseQuest.completed),
            ...sourceMeta
        };
    }

    function syncQuestCollections(questState) {
        const collections = ensureQuestCollections();
        collections.activeQuestIds = collections.activeQuestIds.filter((questId) => questId !== questState.questId);
        collections.completedQuestIds = collections.completedQuestIds.filter((questId) => questId !== questState.questId);

        if (questState.status === 'completed') {
            collections.completedQuestIds.push(questState.questId);
        } else if (questState.status === 'active') {
            collections.activeQuestIds.push(questState.questId);
        }

        game.state.activeQuestIds = collections.activeQuestIds;
        game.state.completedQuestIds = collections.completedQuestIds;
    }

    function applyQuestState(source, quest, questState) {
        const collections = ensureQuestCollections();
        collections.questStateById[questState.questId] = { ...questState };
        syncQuestCollections(questState);

        if (quest && typeof quest === 'object') {
            Object.assign(quest, questState);
        }

        const encounter = source && source.expedition ? source.expedition : null;
        if (encounter && encounter.quest === quest) {
            encounter.quest = quest;
        }

        return questState;
    }

    function syncQuestState(source, quest) {
        if (!quest) {
            return null;
        }

        const normalizedQuest = normalizeQuest(source, quest);
        const collections = ensureQuestCollections();
        const savedQuest = collections.questStateById[normalizedQuest.questId] || {};
        const mergedQuest = {
            ...normalizedQuest,
            ...savedQuest,
            questId: normalizedQuest.questId,
            questType: normalizedQuest.questType,
            objectiveType: normalizedQuest.objectiveType,
            progressRequired: normalizedQuest.progressRequired,
            quantity: normalizedQuest.quantity,
            itemId: normalizedQuest.itemId,
            rewardGold: normalizedQuest.rewardGold,
            repeatable: normalizedQuest.repeatable,
            label: normalizedQuest.label,
            description: normalizedQuest.description,
            sourceId: normalizedQuest.sourceId,
            sourceHouseId: normalizedQuest.sourceHouseId,
            sourceKind: normalizedQuest.sourceKind,
            sourceLabel: normalizedQuest.sourceLabel,
            sourceIslandIndex: normalizedQuest.sourceIslandIndex,
            npcId: normalizedQuest.npcId,
            npcLabel: normalizedQuest.npcLabel
        };

        if (mergedQuest.status === 'completed') {
            mergedQuest.completed = true;
            mergedQuest.progressCurrent = mergedQuest.progressRequired;
        } else {
            mergedQuest.completed = false;
            mergedQuest.progressCurrent = clampProgress(
                Math.round(mergedQuest.progressCurrent || 0),
                0,
                mergedQuest.progressRequired
            );
        }

        return applyQuestState(source, quest, mergedQuest);
    }

    function acceptQuest(source, quest) {
        const questState = syncQuestState(source, quest);

        if (!questState) {
            return null;
        }

        if (questState.status === 'completed' && !questState.repeatable) {
            return questState;
        }

        if (questState.status !== 'completed') {
            questState.status = 'active';
        }

        return applyQuestState(source, quest, questState);
    }

    function getQuestProgress(source, quest) {
        const questState = syncQuestState(source, quest);

        if (!questState) {
            return null;
        }

        if (questState.objectiveType === 'deliverItem' && questState.itemId) {
            const inventoryRuntime = getInventoryRuntime();
            const currentAmount = inventoryRuntime && typeof inventoryRuntime.countInventoryItem === 'function'
                ? inventoryRuntime.countInventoryItem(questState.itemId)
                : 0;

            questState.progressCurrent = clampProgress(currentAmount, 0, questState.progressRequired);
        } else if (questState.objectiveType === 'bagLoadout' && questState.stageId) {
            const bagUpgradeRuntime = getBagUpgradeRuntime();
            const evaluation = bagUpgradeRuntime && typeof bagUpgradeRuntime.evaluateQuestProgress === 'function'
                ? bagUpgradeRuntime.evaluateQuestProgress(questState)
                : null;

            if (evaluation) {
                questState.progressRequired = evaluation.progressRequired;
                questState.progressCurrent = evaluation.progressCurrent;
                questState.requiredOccupiedSlots = evaluation.requiredOccupiedSlots;
                questState.occupiedSlots = evaluation.occupiedSlots;
                questState.requirementMatches = evaluation.requirementMatches.matches.map((entry) => ({
                    requirementId: entry.requirement && entry.requirement.requirementId ? entry.requirement.requirementId : '',
                    label: entry.requirement && entry.requirement.label ? entry.requirement.label : '',
                    description: entry.requirement && entry.requirement.description ? entry.requirement.description : '',
                    optional: Boolean(entry.optional),
                    satisfied: Boolean(entry.satisfied),
                    itemId: entry.item && entry.item.id ? entry.item.id : '',
                    itemLabel: entry.item && entry.item.label ? entry.item.label : ''
                }));
                questState.missingRequirements = evaluation.requirementMatches.missingRequirements.map((requirement) => ({
                    requirementId: requirement && requirement.requirementId ? requirement.requirementId : '',
                    label: requirement && requirement.label ? requirement.label : '',
                    description: requirement && requirement.description ? requirement.description : ''
                }));
            }
        }

        if (questState.status === 'completed') {
            questState.progressCurrent = questState.progressRequired;
            questState.completed = true;
        }

        return applyQuestState(source, quest, questState);
    }

    function advanceQuest(source, quest, delta = 1) {
        const questState = acceptQuest(source, quest);

        if (!questState || questState.status === 'completed') {
            return questState;
        }

        questState.progressCurrent = clampProgress(
            questState.progressCurrent + Math.max(0, Math.round(delta)),
            0,
            questState.progressRequired
        );

        return applyQuestState(source, quest, questState);
    }

    function canCompleteQuest(source, quest = source && source.expedition ? source.expedition.quest : null) {
        const questState = getQuestProgress(source, quest);
        return Boolean(questState && questState.status !== 'completed' && questState.progressCurrent >= questState.progressRequired);
    }

    function completeQuest(source, quest = source && source.expedition ? source.expedition.quest : null, options = {}) {
        const questState = acceptQuest(source, quest);

        if (!questState) {
            return {
                success: false,
                reason: 'missing',
                message: 'Рядом нет задания для выполнения.'
            };
        }

        if (questState.status === 'completed' && !questState.repeatable) {
            return {
                success: false,
                reason: 'completed',
                quest: questState,
                message: 'Это задание уже завершено.'
            };
        }

        const progress = getQuestProgress(source, quest);
        if (!progress || progress.progressCurrent < progress.progressRequired) {
            return {
                success: false,
                reason: 'incomplete',
                quest: progress,
                message: `Для квеста не хватает предмета "${questState.label}". Нужно ${questState.progressRequired}.`
            };
        }

        if (options.consumeItems !== false && progress.objectiveType === 'deliverItem' && progress.itemId) {
            const inventoryRuntime = getInventoryRuntime();

            if (!inventoryRuntime || typeof inventoryRuntime.consumeInventoryItemById !== 'function') {
                return {
                    success: false,
                    reason: 'unavailable',
                    quest: progress,
                    message: 'Сдать предметы для этого квеста сейчас нельзя.'
                };
            }

            inventoryRuntime.consumeInventoryItemById(progress.itemId, progress.progressRequired);
        } else if (progress.objectiveType === 'bagLoadout' && progress.stageId) {
            const bagUpgradeRuntime = getBagUpgradeRuntime();
            const result = bagUpgradeRuntime && typeof bagUpgradeRuntime.completeArtisanQuest === 'function'
                ? bagUpgradeRuntime.completeArtisanQuest(source, progress)
                : null;

            if (!result || !result.success) {
                return {
                    success: false,
                    reason: result && result.reason ? result.reason : 'unavailable',
                    quest: progress,
                    message: result && result.message
                        ? result.message
                        : 'Сдать этот ремесленный заказ сейчас нельзя.'
                };
            }

            progress.rewardSlots = result.slotsUnlocked || progress.rewardSlots || 1;
            progress.unlockedSlots = result.unlockedSlots || game.state.unlockedInventorySlots;
            progress.completedMessage = result.message || '';
        }

        progress.status = 'completed';
        progress.completed = true;
        progress.progressCurrent = progress.progressRequired;
        progress.completedAtIslandIndex = source && source.expedition
            ? source.expedition.islandIndex
            : game.state.currentIslandIndex;

        return {
            success: true,
            quest: applyQuestState(source, quest, progress)
        };
    }

    function failQuest(source, quest = source && source.expedition ? source.expedition.quest : null) {
        const questState = syncQuestState(source, quest);

        if (!questState) {
            return null;
        }

        questState.status = 'failed';
        questState.completed = false;
        return applyQuestState(source, quest, questState);
    }

    function getEncounterQuest(source) {
        const encounter = source && source.expedition ? source.expedition : null;
        return encounter && encounter.quest ? syncQuestState(source, encounter.quest) : null;
    }

    function getActiveQuests() {
        const collections = ensureQuestCollections();

        return collections.activeQuestIds
            .map((questId) => {
                const savedQuest = collections.questStateById[questId];

                if (!savedQuest) {
                    return null;
                }

                const nextQuest = {
                    ...savedQuest
                };

                if (nextQuest.objectiveType === 'deliverItem' && nextQuest.itemId) {
                    const inventoryRuntime = getInventoryRuntime();
                    const currentAmount = inventoryRuntime && typeof inventoryRuntime.countInventoryItem === 'function'
                        ? inventoryRuntime.countInventoryItem(nextQuest.itemId)
                        : 0;

                    nextQuest.progressCurrent = clampProgress(currentAmount, 0, nextQuest.progressRequired || nextQuest.quantity || 1);
                } else if (nextQuest.objectiveType === 'bagLoadout' && nextQuest.stageId) {
                    const bagUpgradeRuntime = getBagUpgradeRuntime();
                    const evaluation = bagUpgradeRuntime && typeof bagUpgradeRuntime.evaluateQuestProgress === 'function'
                        ? bagUpgradeRuntime.evaluateQuestProgress(nextQuest)
                        : null;

                    if (evaluation) {
                        nextQuest.progressRequired = evaluation.progressRequired;
                        nextQuest.progressCurrent = evaluation.progressCurrent;
                        nextQuest.requiredOccupiedSlots = evaluation.requiredOccupiedSlots;
                        nextQuest.occupiedSlots = evaluation.occupiedSlots;
                        nextQuest.requirementMatches = evaluation.requirementMatches.matches.map((entry) => ({
                            requirementId: entry.requirement && entry.requirement.requirementId ? entry.requirement.requirementId : '',
                            label: entry.requirement && entry.requirement.label ? entry.requirement.label : '',
                            description: entry.requirement && entry.requirement.description ? entry.requirement.description : '',
                            optional: Boolean(entry.optional),
                            satisfied: Boolean(entry.satisfied),
                            itemId: entry.item && entry.item.id ? entry.item.id : '',
                            itemLabel: entry.item && entry.item.label ? entry.item.label : ''
                        }));
                        nextQuest.missingRequirements = evaluation.requirementMatches.missingRequirements.map((requirement) => ({
                            requirementId: requirement && requirement.requirementId ? requirement.requirementId : '',
                            label: requirement && requirement.label ? requirement.label : '',
                            description: requirement && requirement.description ? requirement.description : ''
                        }));
                    }
                }

                return nextQuest.status === 'active' ? nextQuest : null;
            })
            .filter(Boolean)
            .sort((left, right) => {
                const leftIsland = Number.isFinite(left.sourceIslandIndex) ? left.sourceIslandIndex : 0;
                const rightIsland = Number.isFinite(right.sourceIslandIndex) ? right.sourceIslandIndex : 0;
                return leftIsland - rightIsland || String(left.sourceLabel || '').localeCompare(String(right.sourceLabel || ''));
            });
    }

    Object.assign(questRuntime, {
        ensureQuestCollections,
        buildQuestId,
        syncQuestState,
        acceptQuest,
        getQuestProgress,
        advanceQuest,
        canCompleteQuest,
        completeQuest,
        failQuest,
        getEncounterQuest,
        getActiveQuests
    });
})();
