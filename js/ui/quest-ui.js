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
                <div class="quest-card__tabs" role="tablist" aria-label="Панели квестов">
                    <button id="questTabQuests" class="quest-card__tab" type="button" role="tab" aria-selected="true">Квесты</button>
                    <button id="questTabProduction" class="quest-card__tab" type="button" role="tab" aria-selected="false">Производство</button>
                </div>
                <div id="questTabPanelQuests" class="quest-card__panel" role="tabpanel">
                    <p id="questTrackerEmpty" class="panel-copy">Активных квестов пока нет.</p>
                    <div id="questTrackerList" class="quest-list" aria-live="polite"></div>
                </div>
                <div id="questTabPanelProduction" class="quest-card__panel" role="tabpanel" hidden>
                    <p class="hud-kicker">Крафт</p>
                    <h3 class="hud-title hud-title--compact">Производственные цели</h3>
                    <p id="productionGoalsSummary" class="panel-copy production-goals__summary">Подготовь базовые ветки под текущее окно островов.</p>
                    <div id="productionGoalsList" class="production-goals" aria-live="polite"></div>
                </div>
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
            questCardTitle: document.getElementById('questCardTitle'),
            questTabQuests: document.getElementById('questTabQuests'),
            questTabProduction: document.getElementById('questTabProduction'),
            questTabPanelQuests: document.getElementById('questTabPanelQuests'),
            questTabPanelProduction: document.getElementById('questTabPanelProduction')
        };
    }

    function isQuestPanelCollapsed() {
        return Boolean(game.state.isQuestPanelCollapsed);
    }

    function getActiveQuestTab() {
        const tab = game.state.questPanelTab;
        return tab === 'production' ? 'production' : 'quests';
    }

    function setActiveQuestTab(tabId) {
        game.state.questPanelTab = tabId === 'production' ? 'production' : 'quests';
        bridge.renderAfterStateChange();
        return game.state.questPanelTab;
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

        const { questPanelToggle, questTrackerList, questTabQuests, questTabProduction } = getElements();
        if (questPanelToggle) {
            questPanelToggle.addEventListener('click', () => {
                toggleQuestPanel();
            });
        }

        if (questTabQuests) {
            questTabQuests.addEventListener('click', () => {
                setActiveQuestTab('quests');
            });
        }

        if (questTabProduction) {
            questTabProduction.addEventListener('click', () => {
                setActiveQuestTab('production');
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
            questCardTitle,
            questTabQuests,
            questTabProduction,
            questTabPanelQuests,
            questTabPanelProduction
        } = getElements();
        const collapsed = isQuestPanelCollapsed();
        const activeTab = getActiveQuestTab();

        if (questPanelToggle) {
            questPanelToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        }

        if (questPanelToggleIcon) {
            questPanelToggleIcon.textContent = collapsed ? '+' : '−';
        }

        if (questCardBody) {
            questCardBody.hidden = collapsed;
        }

        if (questTabQuests) {
            const isActive = activeTab === 'quests';
            questTabQuests.classList.toggle('is-active', isActive);
            questTabQuests.setAttribute('aria-selected', isActive ? 'true' : 'false');
        }

        if (questTabProduction) {
            const isActive = activeTab === 'production';
            questTabProduction.classList.toggle('is-active', isActive);
            questTabProduction.setAttribute('aria-selected', isActive ? 'true' : 'false');
        }

        if (questTabPanelQuests) {
            questTabPanelQuests.hidden = activeTab !== 'quests';
        }

        if (questTabPanelProduction) {
            questTabPanelProduction.hidden = activeTab !== 'production';
        }

        if (questCardTitle) {
            questCardTitle.textContent = activeQuests.length > 0
                ? `Квесты · ${activeQuests.length}`
                : 'Квесты';
        }
    }

    function createCopyRow(className, text) {
        if (!text) {
            return null;
        }

        const row = document.createElement('p');
        row.className = className;
        row.textContent = text;
        return row;
    }

    function createPillRow(labels = []) {
        const uniqueLabels = labels.filter((label, index, list) => label && list.indexOf(label) === index);
        if (uniqueLabels.length === 0) {
            return null;
        }

        const row = document.createElement('div');
        row.className = 'artisan-pill-row';

        uniqueLabels.forEach((label) => {
            const pill = document.createElement('span');
            pill.className = 'artisan-pill';
            pill.textContent = label;
            row.append(pill);
        });

        return row;
    }

    function getCourierEtaLabel(quest) {
        if (!quest || quest.courierStatus !== 'inTransit' || !Number.isFinite(quest.courierReturnAdvanceCount)) {
            return '';
        }

        const courierRuntime = game.systems.courierRuntime || null;
        const currentAdvanceCount = courierRuntime && typeof courierRuntime.getCurrentTimeAdvanceCount === 'function'
            ? courierRuntime.getCurrentTimeAdvanceCount()
            : 0;
        const remainingAdvances = Math.max(0, Math.round(quest.courierReturnAdvanceCount - currentAdvanceCount));

        return courierRuntime && typeof courierRuntime.formatCourierEtaFromRemainingAdvances === 'function'
            ? courierRuntime.formatCourierEtaFromRemainingAdvances(remainingAdvances)
            : '';
    }

    function getQuestRewardItemLabel(quest) {
        const itemLabel = quest && quest.rewardItemLabel ? quest.rewardItemLabel : '';
        const itemQuantity = Math.max(0, Math.round(quest && quest.rewardItemQuantity ? quest.rewardItemQuantity : 0));

        if (!itemLabel || itemQuantity <= 0) {
            return '';
        }

        return itemQuantity > 1 ? `${itemLabel} x${itemQuantity}` : itemLabel;
    }

    function createRequirementCard(entry, modifierClass, emptyText) {
        const card = document.createElement('div');
        card.className = `artisan-check ${modifierClass}`;

        if (!entry) {
            card.classList.add('artisan-check--empty');
            card.textContent = emptyText;
            return card;
        }

        const title = document.createElement('div');
        title.className = 'artisan-check__title';
        title.textContent = entry.label || 'Требование';

        const value = document.createElement('div');
        value.className = 'artisan-check__value';
        value.textContent = entry.valueLabel || entry.description || 'Нужен подходящий предмет';

        card.append(title, value);
        return card;
    }

    function createRequirementSection(title, entries, modifierClass, emptyText) {
        const section = document.createElement('div');
        section.className = 'artisan-quest__section';

        const heading = document.createElement('div');
        heading.className = 'artisan-quest__section-title';
        heading.textContent = title;

        const list = document.createElement('div');
        list.className = 'artisan-check-list';

        if (entries.length === 0) {
            list.append(createRequirementCard(null, modifierClass, emptyText));
        } else {
            entries.forEach((entry) => {
                list.append(createRequirementCard(entry, modifierClass, emptyText));
            });
        }

        section.append(heading, list);
        return section;
    }

    function appendQuestMatchRows(container, quest) {
        const categoryLabels = Array.isArray(quest.slotQuestFocusLabels) && quest.slotQuestFocusLabels.length > 0
            ? quest.slotQuestFocusLabels
            : (Array.isArray(quest.questCategoryLabels) ? quest.questCategoryLabels : []);
        const collectedRequirements = Array.isArray(quest.collectedRequirements) ? quest.collectedRequirements : [];
        const missingRequirements = Array.isArray(quest.missingRequirements) ? quest.missingRequirements : [];
        const optionalRequirements = Array.isArray(quest.optionalRequirements) ? quest.optionalRequirements : [];

        const hero = document.createElement('div');
        hero.className = 'artisan-quest__hero';

        const heroRows = [
            createCopyRow('artisan-quest__slot', quest.slotUnlockLabel),
            createCopyRow('artisan-quest__meta', quest.progressHeadline || quest.slotProgressLabel),
            createCopyRow('artisan-quest__meta', quest.unlockPreviewLabel)
        ].filter(Boolean);

        if (heroRows.length > 0) {
            hero.append(...heroRows);
            container.append(hero);
        }

        const pillRow = createPillRow(categoryLabels);
        if (pillRow) {
            container.append(pillRow);
        }

        const requirementGrid = document.createElement('div');
        requirementGrid.className = 'artisan-quest__grid';
        requirementGrid.append(
            createRequirementSection('Собрано', collectedRequirements, 'artisan-check--done', 'Пока ни одно обязательное требование не закрыто.'),
            createRequirementSection('Не хватает', missingRequirements, 'artisan-check--missing', 'Все обязательные требования уже собраны.')
        );
        container.append(requirementGrid);

        if (optionalRequirements.length > 0) {
            container.append(
                createRequirementSection('Дополнительно', optionalRequirements, 'artisan-check--optional', 'Дополнительных усилений нет.')
            );
        }

        [
            createCopyRow('panel-copy quest-entry__meta', quest.collectedSummaryLabel),
            createCopyRow('panel-copy quest-entry__description', quest.missingSummaryLabel),
            createCopyRow('panel-copy quest-entry__description', quest.generationHintLabel)
        ].filter(Boolean).forEach((row) => {
            container.append(row);
        });
    }

    function createQuestEntry(quest) {
        const itemDefinition = quest.itemId ? bridge.getItemDefinition(quest.itemId) : null;
        const isCourierInTransit = quest.objectiveType === 'deliverItem' && quest.courierStatus === 'inTransit';
        const courierEtaLabel = getCourierEtaLabel(quest);
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
        headerMeta.textContent = isCourierInTransit
            ? `Курьер в пути${courierEtaLabel ? ` · ${courierEtaLabel}` : ''}`
            : (quest.objectiveType === 'bagLoadout'
            ? `Сумка ${quest.sourceSlots || '?'} → ${quest.targetSlots || '?'}`
            : `Прогресс ${quest.progressCurrent}/${quest.progressRequired}`);
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
        progressRow.textContent = isCourierInTransit
            ? `Груз передан курьеру "${quest.courierTierLabel || 'курьер'}"${courierEtaLabel ? ` · ${courierEtaLabel}` : ''}`
            : (quest.objectiveType === 'deliverItem'
            ? `В сумке: ${quest.progressCurrent}/${quest.progressRequired}${itemDefinition ? ` · предмет: ${itemDefinition.label}` : ''}`
            : (
                quest.objectiveType === 'bagLoadout'
                    ? (quest.progressHeadline || `${quest.slotProgressLabel || `Сумка ${quest.sourceSlots || '?'} → ${quest.targetSlots || '?'}`} · прогресс: ${quest.progressCurrent}/${quest.progressRequired}`)
                    : `Прогресс: ${quest.progressCurrent}/${quest.progressRequired}`
            ));

        const rewardRow = document.createElement('p');
        rewardRow.className = 'panel-copy quest-entry__meta';
        const rewardItemLabel = getQuestRewardItemLabel(quest);
        rewardRow.textContent = isCourierInTransit
            ? `Награда: до ${quest.rewardGold || 0} золота${rewardItemLabel ? ` + ${rewardItemLabel}` : ''} · комиссия: ${quest.courierFee || 0} · остров найма: ${quest.courierHireIslandIndex || '?'}`
            : (quest.objectiveType === 'bagLoadout'
            ? `Награда: +${quest.rewardSlots || Math.max(1, (quest.targetSlots || 0) - (quest.sourceSlots || 0))} слот · ${quest.slotUnlockLabel || `сумка до ${quest.targetSlots || '?'}`}`
            : `Награда: ${quest.rewardGold || 0} золота${rewardItemLabel ? ` + ${rewardItemLabel}` : ''}`);

        const descriptionRow = document.createElement('p');
        descriptionRow.className = 'panel-copy quest-entry__description';
        descriptionRow.textContent = isCourierInTransit
            ? (quest.courierResultLabel || `Курьер несёт груз к ${quest.sourceLabel || 'квестодателю'} и вернётся с наградой.`)
            : (quest.description || 'Следи за прогрессом и возвращайся к NPC, когда задание будет готово к сдаче.');

        if (!isCourierInTransit && quest.progressCurrent >= quest.progressRequired) {
            entry.classList.add('quest-entry--ready');
        }

        body.append(giverRow, progressRow, rewardRow, descriptionRow);

        if (quest.objectiveType === 'bagLoadout') {
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
