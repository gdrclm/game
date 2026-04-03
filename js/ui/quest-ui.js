(() => {
    const game = window.Game;
    const questUi = game.systems.questUi = game.systems.questUi || {};
    const bridge = game.systems.uiBridge;
    let eventsBound = false;

    if (!bridge) {
        return;
    }

    function getQuestRuntime() {
        return game.systems.questRuntime || null;
    }

    function ensureQuestPanelStructure() {
        const rightPanel = document.querySelector('.hud-panel--right');

        if (!rightPanel || document.getElementById('questCard')) {
            return;
        }

        const questCard = document.createElement('section');
        questCard.id = 'questCard';
        questCard.className = 'hud-card sidebar-card quest-card';
        questCard.innerHTML = `
            <button id="questPanelToggle" class="panel-toggle" type="button" aria-expanded="true">
                <span class="panel-toggle__text">
                    <span class="hud-kicker">Задания</span>
                    <span id="questCardTitle" class="hud-title hud-title--compact panel-toggle__title">Квесты</span>
                </span>
                <span id="questPanelToggleIcon" class="panel-toggle__icon" aria-hidden="true">−</span>
            </button>
            <div id="questCardBody" class="sidebar-card__body">
                <p id="questTrackerEmpty" class="panel-copy">Активных квестов пока нет.</p>
                <div id="questTrackerList" class="quest-list" aria-live="polite"></div>
            </div>
        `;

        rightPanel.appendChild(questCard);
    }

    function getElements() {
        ensureQuestPanelStructure();
        return {
            questPanelToggle: document.getElementById('questPanelToggle'),
            questPanelToggleIcon: document.getElementById('questPanelToggleIcon'),
            questCardBody: document.getElementById('questCardBody'),
            questTrackerList: document.getElementById('questTrackerList'),
            questTrackerEmpty: document.getElementById('questTrackerEmpty'),
            questCardTitle: document.getElementById('questCardTitle')
        };
    }

    function isQuestPanelCollapsed() {
        return Boolean(game.state.isQuestPanelCollapsed);
    }

    function getCollapsedQuestEntryIds() {
        game.state.collapsedQuestEntryIds = game.state.collapsedQuestEntryIds || {};
        return game.state.collapsedQuestEntryIds;
    }

    function isQuestEntryCollapsed(questId) {
        return Boolean(questId && getCollapsedQuestEntryIds()[questId]);
    }

    function toggleQuestPanel(forceValue) {
        const nextValue = typeof forceValue === 'boolean'
            ? forceValue
            : !isQuestPanelCollapsed();

        game.state.isQuestPanelCollapsed = nextValue;
        bridge.renderAfterStateChange();
        return nextValue;
    }

    function toggleQuestEntry(questId, forceValue) {
        if (!questId) {
            return false;
        }

        const collapsedQuestEntryIds = getCollapsedQuestEntryIds();
        const nextValue = typeof forceValue === 'boolean'
            ? forceValue
            : !Boolean(collapsedQuestEntryIds[questId]);

        if (nextValue) {
            collapsedQuestEntryIds[questId] = true;
        } else {
            delete collapsedQuestEntryIds[questId];
        }

        bridge.renderAfterStateChange();
        return nextValue;
    }

    function bindEvents() {
        if (eventsBound) {
            return;
        }

        const { questPanelToggle, questTrackerList } = getElements();
        if (questPanelToggle) {
            questPanelToggle.addEventListener('click', () => {
                toggleQuestPanel();
            });
        }

        if (questTrackerList) {
            questTrackerList.addEventListener('click', (event) => {
                const toggleButton = event.target.closest('[data-quest-toggle-id]');

                if (!toggleButton) {
                    return;
                }

                const questId = toggleButton.getAttribute('data-quest-toggle-id');
                if (!questId) {
                    return;
                }

                toggleQuestEntry(questId);
            });
        }

        eventsBound = true;
    }

    function syncQuestPanelState(activeQuests = []) {
        const {
            questPanelToggle,
            questPanelToggleIcon,
            questCardBody,
            questCardTitle
        } = getElements();
        const collapsed = isQuestPanelCollapsed();

        if (questPanelToggle) {
            questPanelToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        }

        if (questPanelToggleIcon) {
            questPanelToggleIcon.textContent = collapsed ? '+' : '−';
        }

        if (questCardBody) {
            questCardBody.hidden = collapsed;
        }

        if (questCardTitle) {
            questCardTitle.textContent = activeQuests.length > 0
                ? `Квесты · ${activeQuests.length}`
                : 'Квесты';
        }
    }

    function appendQuestMatchRows(container, quest) {
        const categoryLabels = Array.isArray(quest.questCategoryLabels) ? quest.questCategoryLabels : [];
        const collectedRequirements = Array.isArray(quest.collectedRequirements) ? quest.collectedRequirements : [];
        const missingRequirements = Array.isArray(quest.missingRequirements) ? quest.missingRequirements : [];

        if (categoryLabels.length > 0) {
            const categoryRow = document.createElement('p');
            categoryRow.className = 'panel-copy quest-entry__description';
            categoryRow.textContent = `Категории: ${categoryLabels.join(', ')}`;
            container.append(categoryRow);
        }

        if (quest.slotUnlockLabel) {
            const slotRow = document.createElement('p');
            slotRow.className = 'panel-copy quest-entry__meta';
            slotRow.textContent = quest.slotUnlockLabel;
            container.append(slotRow);
        }

        if (quest.occupancyStatusLabel || quest.requirementStatusLabel) {
            const statusRow = document.createElement('p');
            statusRow.className = 'panel-copy quest-entry__meta';
            statusRow.textContent = [quest.occupancyStatusLabel, quest.requirementStatusLabel].filter(Boolean).join(' · ');
            container.append(statusRow);
        }

        if (collectedRequirements.length > 0) {
            const collectedRow = document.createElement('p');
            collectedRow.className = 'panel-copy quest-entry__meta';
            collectedRow.textContent = `Собрано: ${collectedRequirements.map((entry) => entry.itemLabel ? `${entry.label} — ${entry.itemLabel}` : entry.label).join('; ')}`;
            container.append(collectedRow);
        }

        if (missingRequirements.length > 0) {
            const missingRow = document.createElement('p');
            missingRow.className = 'panel-copy quest-entry__description';
            missingRow.textContent = `Не хватает: ${missingRequirements.map((entry) => entry.tags && entry.tags.length > 0 ? `${entry.label} (${entry.tags.join(', ')})` : entry.label).join('; ')}`;
            container.append(missingRow);
        }

        if (quest.occupancyMissingLabel) {
            const occupancyRow = document.createElement('p');
            occupancyRow.className = 'panel-copy quest-entry__description';
            occupancyRow.textContent = quest.occupancyMissingLabel;
            container.append(occupancyRow);
        }
    }

    function createQuestEntry(quest) {
        const itemDefinition = quest.itemId ? bridge.getItemDefinition(quest.itemId) : null;
        const entry = document.createElement('article');
        const collapsed = isQuestEntryCollapsed(quest.questId);
        entry.className = 'quest-entry';

        const headerButton = document.createElement('button');
        headerButton.type = 'button';
        headerButton.className = 'quest-entry__header';
        headerButton.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        if (quest.questId) {
            headerButton.setAttribute('data-quest-toggle-id', quest.questId);
        }

        const headerText = document.createElement('span');
        headerText.className = 'quest-entry__header-text';

        const titleRow = document.createElement('span');
        titleRow.className = 'quest-entry__title';
        titleRow.textContent = quest.label || 'Активное задание';
        headerText.append(titleRow);

        const headerMeta = document.createElement('span');
        headerMeta.className = 'quest-entry__header-meta';
        headerMeta.textContent = quest.objectiveType === 'bagLoadout'
            ? `Сумка ${quest.sourceSlots || '?'} → ${quest.targetSlots || '?'}`
            : `Прогресс ${quest.progressCurrent}/${quest.progressRequired}`;
        headerText.append(headerMeta);

        const headerIcon = document.createElement('span');
        headerIcon.className = 'quest-entry__header-icon';
        headerIcon.textContent = collapsed ? '+' : '−';

        headerButton.append(headerText, headerIcon);

        const body = document.createElement('div');
        body.className = 'quest-entry__body';
        body.hidden = collapsed;

        const giverRow = document.createElement('p');
        giverRow.className = 'panel-copy quest-entry__meta';
        giverRow.textContent = `NPC: ${quest.sourceLabel || quest.npcLabel || 'Неизвестно'} · остров ${quest.sourceIslandIndex || game.state.currentIslandIndex}`;

        const progressRow = document.createElement('p');
        progressRow.className = 'panel-copy quest-entry__meta';
        progressRow.textContent = quest.objectiveType === 'deliverItem'
            ? `В сумке: ${quest.progressCurrent}/${quest.progressRequired}${itemDefinition ? ` · предмет: ${itemDefinition.label}` : ''}`
            : (
                quest.objectiveType === 'bagLoadout'
                    ? `${quest.slotProgressLabel || `Сумка ${quest.sourceSlots || '?'} → ${quest.targetSlots || '?'}`} · прогресс: ${quest.progressCurrent}/${quest.progressRequired}`
                    : `Прогресс: ${quest.progressCurrent}/${quest.progressRequired}`
            );

        const rewardRow = document.createElement('p');
        rewardRow.className = 'panel-copy quest-entry__meta';
        rewardRow.textContent = quest.objectiveType === 'bagLoadout'
            ? `Награда: +${quest.rewardSlots || Math.max(1, (quest.targetSlots || 0) - (quest.sourceSlots || 0))} слот · сумка до ${quest.targetSlots || '?'}`
            : `Награда: ${quest.rewardGold || 0} золота`;

        const descriptionRow = document.createElement('p');
        descriptionRow.className = 'panel-copy quest-entry__description';
        descriptionRow.textContent = quest.description || 'Следи за прогрессом и возвращайся к NPC, когда задание будет готово к сдаче.';

        if (quest.progressCurrent >= quest.progressRequired) {
            entry.classList.add('quest-entry--ready');
        }

        body.append(giverRow, progressRow, rewardRow, descriptionRow);

        if (quest.objectiveType === 'bagLoadout') {
            const slotGoalRow = document.createElement('p');
            slotGoalRow.className = 'panel-copy quest-entry__meta';
            slotGoalRow.textContent = `Сумка: ${quest.sourceSlots || '?'} → ${quest.targetSlots || '?'} · дедлайн: остров ${quest.deadlineIslandIndex || '?'}`;
            body.append(slotGoalRow);
            appendQuestMatchRows(body, quest);
        }

        entry.append(headerButton, body);
        return entry;
    }

    function renderQuestTracker() {
        bindEvents();

        const runtime = getQuestRuntime();
        const {
            questTrackerList,
            questTrackerEmpty
        } = getElements();
        const activeQuests = runtime && typeof runtime.getActiveQuests === 'function'
            ? runtime.getActiveQuests()
            : [];

        syncQuestPanelState(activeQuests);

        if (!questTrackerList || !questTrackerEmpty) {
            return;
        }

        if (activeQuests.length === 0) {
            questTrackerList.replaceChildren();
            questTrackerEmpty.hidden = false;
            questTrackerEmpty.textContent = 'Активных квестов пока нет. Поговори с NPC или торговцем, чтобы получить задание.';
            return;
        }

        questTrackerEmpty.hidden = true;
        const fragment = document.createDocumentFragment();
        activeQuests.forEach((quest) => {
            fragment.append(createQuestEntry(quest));
        });
        questTrackerList.replaceChildren(fragment);
    }

    function syncQuestState() {
        renderQuestTracker();
    }

    Object.assign(questUi, {
        renderQuestTracker,
        syncQuestState,
        toggleQuestPanel,
        toggleQuestEntry
    });
})();
