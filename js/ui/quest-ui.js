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

    function toggleQuestPanel(forceValue) {
        const nextValue = typeof forceValue === 'boolean'
            ? forceValue
            : !isQuestPanelCollapsed();

        game.state.isQuestPanelCollapsed = nextValue;
        bridge.renderAfterStateChange();
        return nextValue;
    }

    function bindEvents() {
        if (eventsBound) {
            return;
        }

        const { questPanelToggle } = getElements();
        if (questPanelToggle) {
            questPanelToggle.addEventListener('click', () => {
                toggleQuestPanel();
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

    function appendQuestMatchRows(entry, quest) {
        const matches = Array.isArray(quest.requirementMatches) ? quest.requirementMatches : [];

        matches.forEach((match) => {
            const row = document.createElement('p');
            row.className = 'panel-copy quest-entry__meta';
            const prefix = match.satisfied ? '✓' : (match.optional ? '•' : '□');
            const suffix = match.satisfied && match.itemLabel ? ` — ${match.itemLabel}` : '';
            row.textContent = `${prefix} ${match.label || 'Требование'}${suffix}`;
            entry.append(row);
        });

        if (Array.isArray(quest.missingRequirements) && quest.missingRequirements.length > 0) {
            const missingRow = document.createElement('p');
            missingRow.className = 'panel-copy quest-entry__description';
            missingRow.textContent = `Не хватает: ${quest.missingRequirements.map((requirement) => requirement.label).join(', ')}`;
            entry.append(missingRow);
        }
    }

    function createQuestEntry(quest) {
        const itemDefinition = quest.itemId ? bridge.getItemDefinition(quest.itemId) : null;
        const entry = document.createElement('article');
        entry.className = 'quest-entry';

        const titleRow = document.createElement('div');
        titleRow.className = 'quest-entry__title';
        titleRow.textContent = quest.label || 'Активное задание';

        const giverRow = document.createElement('p');
        giverRow.className = 'panel-copy quest-entry__meta';
        giverRow.textContent = `NPC: ${quest.sourceLabel || quest.npcLabel || 'Неизвестно'} · остров ${quest.sourceIslandIndex || game.state.currentIslandIndex}`;

        const progressRow = document.createElement('p');
        progressRow.className = 'panel-copy quest-entry__meta';
        progressRow.textContent = quest.objectiveType === 'deliverItem'
            ? `В сумке: ${quest.progressCurrent}/${quest.progressRequired}${itemDefinition ? ` · предмет: ${itemDefinition.label}` : ''}`
            : (
                quest.objectiveType === 'bagLoadout'
                    ? `Слоты: ${quest.occupiedSlots || 0}/${quest.requiredOccupiedSlots || 0} · прогресс: ${quest.progressCurrent}/${quest.progressRequired}`
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

        entry.append(titleRow, giverRow, progressRow, rewardRow, descriptionRow);

        if (quest.objectiveType === 'bagLoadout') {
            const slotGoalRow = document.createElement('p');
            slotGoalRow.className = 'panel-copy quest-entry__meta';
            slotGoalRow.textContent = `Сумка: ${quest.sourceSlots || '?'} → ${quest.targetSlots || '?'} · дедлайн: остров ${quest.deadlineIslandIndex || '?'}`;
            entry.append(slotGoalRow);
            appendQuestMatchRows(entry, quest);
        }

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
        toggleQuestPanel
    });
})();
