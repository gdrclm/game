(() => {
    const game = window.Game;
    const mobileUi = game.systems.mobileUi = game.systems.mobileUi || {};
    const bridge = game.systems.uiBridge;
    const MOBILE_BREAKPOINT = 760;
    const MOBILE_PANEL_CONFIGS = {
        quests: {
            kicker: 'Журнал',
            title: 'Квесты',
            getNodes: () => {
                ensureQuestCard();
                return [document.getElementById('questCard')];
            }
        },
        inventory: {
            kicker: 'Сумка',
            title: 'Инвентарь',
            getNodes: () => {
                ensureInventoryCard();
                return [document.getElementById('inventoryCard')];
            }
        }
    };

    let elements = null;
    let eventsBound = false;
    let movedNodes = [];

    if (!bridge) {
        return;
    }

    function queryElements() {
        elements = {
            mobileHud: document.querySelector('.mobile-hud'),
            mobileStatusStrip: document.querySelector('.mobile-status-strip'),
            mobileHintText: document.getElementById('mobileHintText'),
            mobileActionRack: document.getElementById('mobileActionRack'),
            mobileWalkButton: document.getElementById('mobileWalkButton'),
            mobileUseButton: document.getElementById('mobileUseButton'),
            mobileSleepButton: document.getElementById('mobileSleepButton'),
            mobileInspectButton: document.getElementById('mobileInspectButton'),
            mobileTalkButton: document.getElementById('mobileTalkButton'),
            mobileDropButton: document.getElementById('mobileDropButton'),
            mobileInventoryButton: document.getElementById('mobileInventoryButton'),
            mobileInventoryBadge: document.getElementById('mobileInventoryBadge'),
            mobileQuestButton: document.getElementById('mobileQuestButton'),
            mobileQuestBadge: document.getElementById('mobileQuestBadge'),
            mobileStatHungerValue: document.getElementById('mobileStatHungerValue'),
            mobileStatHungerBar: document.getElementById('mobileStatHungerBar'),
            mobileStatEnergyValue: document.getElementById('mobileStatEnergyValue'),
            mobileStatEnergyBar: document.getElementById('mobileStatEnergyBar'),
            mobileStatSleepValue: document.getElementById('mobileStatSleepValue'),
            mobileStatSleepBar: document.getElementById('mobileStatSleepBar'),
            mobileStatColdValue: document.getElementById('mobileStatColdValue'),
            mobileStatColdBar: document.getElementById('mobileStatColdBar'),
            mobileStatFocusValue: document.getElementById('mobileStatFocusValue'),
            mobileStatFocusBar: document.getElementById('mobileStatFocusBar'),
            mobileModal: document.getElementById('mobileModal'),
            mobileModalBackdrop: document.getElementById('mobileModalBackdrop'),
            mobileModalClose: document.getElementById('mobileModalClose'),
            mobileModalKicker: document.getElementById('mobileModalKicker'),
            mobileModalTitle: document.getElementById('mobileModalTitle'),
            mobileModalBody: document.getElementById('mobileModalBody'),
            merchantPanel: document.getElementById('merchantPanel')
        };

        return elements;
    }

    function getElements() {
        return elements || queryElements();
    }

    function isMobileViewport() {
        return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
    }

    function getUiState() {
        const ui = bridge.getUi();
        ui.mobilePanelKey = ui.mobilePanelKey || null;
        return ui;
    }

    function getActivePanelKey() {
        return getUiState().mobilePanelKey;
    }

    function setActivePanelKey(panelKey) {
        getUiState().mobilePanelKey = panelKey || null;
        document.body.dataset.mobilePanel = panelKey || '';
    }

    function setMobileStat(valueElement, barElement, value) {
        const clampedValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

        if (valueElement) {
            valueElement.textContent = `${Math.round(clampedValue)}%`;
        }

        if (barElement) {
            barElement.style.width = `${clampedValue}%`;
        }
    }

    function ensureInventoryCard() {
        const inventoryUi = game.systems.inventoryUi || null;

        if (inventoryUi && typeof inventoryUi.renderInventory === 'function') {
            inventoryUi.renderInventory();
        }
    }

    function ensureQuestCard() {
        const questUi = game.systems.questUi || null;

        if (questUi && typeof questUi.syncQuestState === 'function') {
            questUi.syncQuestState();
        }
    }

    function restoreMovedNodes() {
        movedNodes.forEach(({ node, placeholder }) => {
            if (placeholder.parentNode) {
                placeholder.replaceWith(node);
            }
        });

        movedNodes = [];
        const refs = getElements();
        if (refs.mobileModalBody) {
            refs.mobileModalBody.replaceChildren();
        }
    }

    function moveNodeToModal(node) {
        const refs = getElements();

        if (!node || !node.parentNode || !refs.mobileModalBody) {
            return;
        }

        const placeholder = document.createElement('div');
        placeholder.hidden = true;
        placeholder.className = 'mobile-modal__placeholder';
        node.parentNode.insertBefore(placeholder, node);
        refs.mobileModalBody.appendChild(node);
        movedNodes.push({ node, placeholder });
    }

    function buildEmptyState(title, text) {
        const emptyState = document.createElement('section');
        emptyState.className = 'hud-card mobile-modal__empty';
        emptyState.innerHTML = `
            <p class="hud-kicker">Пока пусто</p>
            <h3 class="hud-title hud-title--compact">${title}</h3>
            <p class="panel-copy">${text}</p>
        `;
        return emptyState;
    }

    function closePanel(options = {}) {
        const refs = getElements();
        restoreMovedNodes();
        setActivePanelKey(null);

        if (refs.mobileModal) {
            refs.mobileModal.hidden = true;
            refs.mobileModal.setAttribute('aria-hidden', 'true');
        }

        document.body.classList.remove('is-mobile-panel-open');

        if (!options.silent) {
            sync();
        }
    }

    function openPanel(panelKey) {
        if (!isMobileViewport()) {
            return false;
        }

        const refs = getElements();
        const config = MOBILE_PANEL_CONFIGS[panelKey];

        if (!refs.mobileModal || !config) {
            return false;
        }

        if (getActivePanelKey() === panelKey && !refs.mobileModal.hidden) {
            closePanel();
            return false;
        }

        closePanel({ silent: true });

        if (refs.mobileModalKicker) {
            refs.mobileModalKicker.textContent = config.kicker;
        }

        if (refs.mobileModalTitle) {
            refs.mobileModalTitle.textContent = config.title;
        }

        const nodes = config.getNodes().filter(Boolean);

        if (nodes.length === 0) {
            refs.mobileModalBody.append(buildEmptyState(config.title, 'Эта панель станет доступна, когда в ней появится содержимое.'));
        } else {
            nodes.forEach((node) => {
                moveNodeToModal(node);
            });
        }

        setActivePanelKey(panelKey);
        refs.mobileModal.hidden = false;
        refs.mobileModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('is-mobile-panel-open');
        sync();
        return true;
    }

    function triggerWalk() {
        const actionUi = game.systems.actionUi || null;

        if (actionUi && typeof actionUi.handleWalkAction === 'function') {
            actionUi.handleWalkAction();
            return;
        }

        if (Array.isArray(game.state.route) && game.state.route.length > 0 && game.systems.movement) {
            game.systems.movement.startMovement();
        }
    }

    function getDesktopActionButton(action) {
        const bridgeElements = typeof bridge.getElements === 'function'
            ? bridge.getElements()
            : null;
        const actionButtons = bridgeElements && Array.isArray(bridgeElements.actionButtons)
            ? bridgeElements.actionButtons
            : [];

        return actionButtons.find((button) => button.dataset.action === action)
            || document.querySelector(`.hud-button[data-action="${action}"]`);
    }

    function getDesktopActionState(action) {
        const sourceButton = getDesktopActionButton(action);
        const actionUi = game.systems.actionUi || null;
        const availability = actionUi && typeof actionUi.getActionAvailability === 'function'
            ? actionUi.getActionAvailability(action)
            : null;
        const isEnabled = availability
            ? Boolean(availability.enabled)
            : Boolean(sourceButton && !sourceButton.disabled);
        const isHighlighted = availability
            ? Boolean(availability.highlighted)
            : Boolean(isEnabled && sourceButton.classList.contains('hud-button--available'));
        const isVisible = availability
            ? Boolean(availability.visible)
            : isHighlighted;

        return {
            sourceButton,
            isEnabled,
            isHighlighted,
            isVisible
        };
    }

    function triggerAction(action) {
        const sourceButton = getDesktopActionButton(action);

        if (sourceButton && !sourceButton.disabled) {
            sourceButton.click();
            return true;
        }

        const actionUi = game.systems.actionUi || null;

        if (actionUi && typeof actionUi.handleActionClick === 'function') {
            actionUi.handleActionClick({
                currentTarget: {
                    dataset: { action }
                }
            });
            return true;
        }

        return false;
    }

    function countUsedInventorySlots() {
        const inventoryRuntime = game.systems.inventoryRuntime || null;

        if (!inventoryRuntime || typeof inventoryRuntime.getInventory !== 'function') {
            return 0;
        }

        return inventoryRuntime.getInventory()
            .slice(0, bridge.getUnlockedInventorySlots())
            .filter(Boolean)
            .length;
    }

    function getActiveQuestCount() {
        const questRuntime = game.systems.questRuntime || null;

        if (!questRuntime || typeof questRuntime.getActiveQuests !== 'function') {
            return 0;
        }

        return questRuntime.getActiveQuests().length;
    }

    function syncButtons() {
        const refs = getElements();
        const activePanelKey = getActivePanelKey();
        const walkState = getDesktopActionState('walk');
        const usedSlots = countUsedInventorySlots();
        const activeQuestCount = getActiveQuestCount();
        const shouldShowQuestButton = activeQuestCount > 0 || activePanelKey === 'quests';

        if (refs.mobileWalkButton) {
            refs.mobileWalkButton.disabled = !walkState.isEnabled;
            refs.mobileWalkButton.hidden = !walkState.isVisible;
            refs.mobileWalkButton.classList.toggle('is-ready', walkState.isVisible);
        }

        if (refs.mobileInventoryBadge) {
            refs.mobileInventoryBadge.hidden = true;
            refs.mobileInventoryBadge.textContent = String(usedSlots);
        }

        if (refs.mobileQuestBadge) {
            refs.mobileQuestBadge.hidden = true;
            refs.mobileQuestBadge.textContent = String(activeQuestCount);
        }

        if (refs.mobileQuestButton) {
            refs.mobileQuestButton.hidden = !shouldShowQuestButton;
            refs.mobileQuestButton.classList.toggle('is-active', activePanelKey === 'quests');
        }

        const canUse = syncMobileActionButton(refs.mobileUseButton, 'use', {
            hideWhenUnavailable: false,
            alwaysShow: true
        });
        const canSleep = syncMobileActionButton(refs.mobileSleepButton, 'sleep', { hideWhenUnavailable: true });
        const canInspect = syncMobileActionButton(refs.mobileInspectButton, 'inspect', {
            hideWhenUnavailable: false,
            alwaysShow: true
        });
        const canTalk = syncMobileActionButton(refs.mobileTalkButton, 'talk', { hideWhenUnavailable: true });
        const canDrop = syncMobileActionButton(refs.mobileDropButton, 'drop', { hideWhenUnavailable: true });

        if (refs.mobileInventoryButton) {
            refs.mobileInventoryButton.classList.toggle('is-active', activePanelKey === 'inventory');
        }

        if (refs.mobileActionRack) {
            const visibleActionCount = [canUse, canSleep, canInspect, canTalk, canDrop].filter(Boolean).length;
            const iconCount = 1 + visibleActionCount + (shouldShowQuestButton ? 1 : 0);
            refs.mobileActionRack.dataset.iconCount = String(iconCount);
        }
    }

    function syncMobileActionButton(button, action, options = {}) {
        if (!button) {
            return false;
        }

        const actionState = getDesktopActionState(action);
        const isVisible = actionState.isVisible;
        const buttonVisible = options.alwaysShow ? true : isVisible;

        button.disabled = !actionState.isEnabled;
        button.classList.toggle('is-ready', isVisible);

        if (options.alwaysShow) {
            button.hidden = false;
        } else if (options.hideWhenUnavailable) {
            button.hidden = !isVisible;
        }

        return buttonVisible;
    }

    function syncHintText() {
        const refs = getElements();

        if (!refs.mobileHintText) {
            return;
        }

        const bridgeElements = typeof bridge.getElements === 'function'
            ? bridge.getElements()
            : null;
        const actionHintText = bridgeElements && bridgeElements.actionHint && typeof bridgeElements.actionHint.textContent === 'string'
            ? bridgeElements.actionHint.textContent.trim()
            : '';

        refs.mobileHintText.textContent = actionHintText || 'Выдели клетку или объект, чтобы увидеть подсказку.';
    }

    function syncToolbarOffset() {
        const refs = getElements();
        const sceneViewport = bridge.getElements().sceneViewport;

        if (!sceneViewport) {
            return;
        }

        if (!isMobileViewport() || !refs.mobileStatusStrip) {
            sceneViewport.style.removeProperty('--mobile-toolbar-top');
            return;
        }

        const viewportRect = sceneViewport.getBoundingClientRect();
        const statusStripRect = refs.mobileStatusStrip.getBoundingClientRect();
        const toolbarTop = Math.max(0, Math.round(statusStripRect.bottom - viewportRect.top + 4));
        sceneViewport.style.setProperty('--mobile-toolbar-top', `${toolbarTop}px`);
    }

    function syncStats() {
        const refs = getElements();
        setMobileStat(refs.mobileStatHungerValue, refs.mobileStatHungerBar, bridge.getStatValue('hunger'));
        setMobileStat(refs.mobileStatEnergyValue, refs.mobileStatEnergyBar, bridge.getStatValue('energy'));
        setMobileStat(refs.mobileStatSleepValue, refs.mobileStatSleepBar, bridge.getStatValue('sleep'));
        setMobileStat(refs.mobileStatColdValue, refs.mobileStatColdBar, bridge.getStatValue('cold'));
        setMobileStat(refs.mobileStatFocusValue, refs.mobileStatFocusBar, bridge.getStatValue('focus'));
    }

    function syncVisibility() {
        const refs = getElements();
        const mobileViewport = isMobileViewport();
        const hasBlockingSceneOverlay = Boolean(
            game.state.isPaused
            || game.state.hasWon
            || game.state.isGameOver
            || game.state.isMapOpen
            || (refs.merchantPanel && !refs.merchantPanel.hidden)
        );

        if (refs.mobileHud) {
            refs.mobileHud.hidden = !mobileViewport;
        }

        if (mobileViewport && hasBlockingSceneOverlay && refs.mobileModal && !refs.mobileModal.hidden) {
            closePanel({ silent: true });
        }

        if (!mobileViewport) {
            closePanel({ silent: true });
        }
    }

    function sync() {
        if (getActivePanelKey() === 'actions') {
            closePanel({ silent: true });
        }

        syncVisibility();

        if (!isMobileViewport()) {
            return;
        }

        syncStats();
        syncButtons();
        if (game.systems.inventoryUi && typeof game.systems.inventoryUi.syncSelectionPanel === 'function') {
            game.systems.inventoryUi.syncSelectionPanel();
        }
        syncHintText();
        syncToolbarOffset();
    }

    function bindEvents() {
        if (eventsBound) {
            return;
        }

        const refs = getElements();

        if (refs.mobileWalkButton) {
            refs.mobileWalkButton.addEventListener('click', () => {
                triggerWalk();
            });
        }

        if (refs.mobileUseButton) {
            refs.mobileUseButton.addEventListener('click', () => {
                triggerAction('use');
            });
        }

        if (refs.mobileSleepButton) {
            refs.mobileSleepButton.addEventListener('click', () => {
                triggerAction('sleep');
            });
        }

        if (refs.mobileInspectButton) {
            refs.mobileInspectButton.addEventListener('click', () => {
                triggerAction('inspect');
            });
        }

        if (refs.mobileTalkButton) {
            refs.mobileTalkButton.addEventListener('click', () => {
                triggerAction('talk');
            });
        }

        if (refs.mobileDropButton) {
            refs.mobileDropButton.addEventListener('click', () => {
                triggerAction('drop');
            });
        }

        if (refs.mobileInventoryButton) {
            refs.mobileInventoryButton.addEventListener('click', () => {
                openPanel('inventory');
            });
        }

        if (refs.mobileQuestButton) {
            refs.mobileQuestButton.addEventListener('click', () => {
                openPanel('quests');
            });
        }

        if (refs.mobileModalClose) {
            refs.mobileModalClose.addEventListener('click', () => {
                closePanel();
            });
        }

        if (refs.mobileModalBackdrop) {
            refs.mobileModalBackdrop.addEventListener('click', () => {
                closePanel();
            });
        }

        window.addEventListener('resize', () => {
            sync();
        });

        eventsBound = true;
    }

    function initialize() {
        queryElements();
        bindEvents();
        sync();
    }

    Object.assign(mobileUi, {
        initialize,
        openPanel,
        closePanel,
        sync
    });
})();
