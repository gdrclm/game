(() => {
    const game = window.Game;
    const inventoryUi = game.systems.inventoryUi = game.systems.inventoryUi || {};
    const bridge = game.systems.uiBridge;
    const MOBILE_BREAKPOINT = 760;
    let panelEventsBound = false;
    let lastMobileSelectionSignature = null;

    const ITEM_CATEGORY_LABELS = {
        consumable: 'расходник',
        survival: 'выживание',
        food: 'еда',
        movement: 'движение',
        utility: 'утилита',
        info: 'навигация',
        tool: 'инструмент',
        container: 'контейнер',
        value: 'ценность',
        risk: 'риск',
        material: 'материал',
        resource: 'ресурс',
        artifact: 'артефакт',
        legendary: 'легендарный'
    };

    const ITEM_RARITY_LABELS = {
        common: 'обычный',
        uncommon: 'необычный',
        rare: 'редкий',
        epic: 'эпический',
        legendary: 'легендарный',
        cursed: 'проклятый'
    };

    if (!bridge) {
        return;
    }

    function ensureInventorySelectionPanel(body, inventoryGrid) {
        if (!body || !inventoryGrid) {
            return;
        }

        if (inventoryGrid.parentNode !== body) {
            body.appendChild(inventoryGrid);
        }

        let selectionPanel = document.getElementById('inventorySelectionPanel');
        if (selectionPanel) {
            if (selectionPanel.parentNode !== body) {
                body.insertBefore(selectionPanel, inventoryGrid);
            }

            if (!document.getElementById('inventorySelectionStationPanel')) {
                const stationPanel = document.createElement('section');
                stationPanel.id = 'inventorySelectionStationPanel';
                stationPanel.className = 'inventory-selection-panel__station';
                stationPanel.innerHTML = `
                    <p class="inventory-selection-panel__station-kicker">Текущая станция</p>
                    <div class="inventory-selection-panel__station-body">
                        <p id="inventorySelectionStationTitle" class="inventory-selection-panel__station-title">Руки</p>
                        <p id="inventorySelectionStationSummary" class="inventory-selection-panel__station-summary"></p>
                    </div>
                `;
                const craftPanel = document.getElementById('inventorySelectionCraftPanel');

                if (craftPanel && craftPanel.parentNode === selectionPanel) {
                    selectionPanel.insertBefore(stationPanel, craftPanel);
                } else {
                    selectionPanel.appendChild(stationPanel);
                }
            }

            return;
        }

        selectionPanel = document.createElement('section');
        selectionPanel.id = 'inventorySelectionPanel';
        selectionPanel.className = 'inventory-selection-panel';
        selectionPanel.hidden = true;
        selectionPanel.innerHTML = `
            <div class="inventory-selection-panel__summary">
                <div class="inventory-selection-panel__text">
                    <p id="inventorySelectionMeta" class="hud-kicker">Выбран предмет</p>
                    <h3 id="inventorySelectionTitle" class="hud-title hud-title--compact">Предмет</h3>
                    <div id="inventorySelectionFacts" class="inventory-selection-panel__facts"></div>
                    <p id="inventorySelectionDescription" class="panel-copy inventory-selection-panel__description"></p>
                </div>
                <div class="inventory-selection-panel__icon-shell" aria-hidden="true">
                    <span id="inventorySelectionIcon" class="inventory-selection-panel__icon">?</span>
                    <span id="inventorySelectionQuantity" class="inventory-selection-panel__quantity" hidden>x1</span>
                </div>
            </div>
            <div id="inventorySelectionActions" class="inventory-selection-panel__actions" hidden>
                <button id="inventorySelectionUseButton" class="hud-button inventory-selection-panel__action inventory-selection-panel__action--use" type="button">
                    Использовать
                </button>
                <button id="inventorySelectionDropButton" class="hud-button inventory-selection-panel__action inventory-selection-panel__action--drop" type="button">
                    Выбросить
                </button>
            </div>
            <section id="inventorySelectionStationPanel" class="inventory-selection-panel__station">
                <p class="inventory-selection-panel__station-kicker">Текущая станция</p>
                <div class="inventory-selection-panel__station-body">
                    <p id="inventorySelectionStationTitle" class="inventory-selection-panel__station-title">Руки</p>
                    <p id="inventorySelectionStationSummary" class="inventory-selection-panel__station-summary"></p>
                </div>
            </section>
            <section id="inventorySelectionCraftPanel" class="inventory-selection-panel__craft" hidden>
                <div class="inventory-selection-panel__craft-header">
                    <p id="inventorySelectionCraftLabel" class="inventory-selection-panel__craft-label">Рецепты по станциям</p>
                    <p id="inventorySelectionCraftHint" class="inventory-selection-panel__craft-hint"></p>
                </div>
                <div id="inventorySelectionCraftActions" class="inventory-selection-panel__craft-actions"></div>
            </section>
        `;

        body.insertBefore(selectionPanel, inventoryGrid);
    }

    function ensureInventoryPanelStructure() {
        const inventoryGrid = document.getElementById('inventoryGrid');

        if (!inventoryGrid) {
            return;
        }

        let inventoryCard = document.getElementById('inventoryCard');

        if (!inventoryCard) {
            inventoryCard = inventoryGrid.closest('.hud-card');
        }

        if (!inventoryCard) {
            return;
        }

        inventoryCard.id = 'inventoryCard';
        inventoryCard.classList.add('sidebar-card');

        const existingToggle = document.getElementById('inventoryPanelToggle');
        const existingBody = document.getElementById('inventoryCardBody');

        if (existingToggle && existingBody) {
            if (!document.getElementById('inventoryPanelStation')) {
                const toggleText = existingToggle.querySelector('.panel-toggle__text');

                if (toggleText) {
                    const stationNode = document.createElement('span');
                    stationNode.id = 'inventoryPanelStation';
                    stationNode.className = 'panel-toggle__meta';
                    stationNode.textContent = 'Станция: Руки';
                    toggleText.appendChild(stationNode);
                }
            }

            ensureInventorySelectionPanel(existingBody, inventoryGrid);
            return;
        }

        const kickerNode = inventoryCard.querySelector('.hud-kicker');
        const titleNode = inventoryCard.querySelector('.hud-title');
        const kickerText = kickerNode ? kickerNode.textContent : 'Сумка';
        const titleText = titleNode ? titleNode.textContent : 'Инвентарь';

        if (kickerNode) {
            kickerNode.remove();
        }

        if (titleNode) {
            titleNode.remove();
        }

        const toggle = document.createElement('button');
        toggle.id = 'inventoryPanelToggle';
        toggle.className = 'panel-toggle';
        toggle.type = 'button';
        toggle.setAttribute('aria-expanded', 'true');
        toggle.innerHTML = `
            <span class="panel-toggle__text">
                <span class="hud-kicker">${kickerText}</span>
                <span class="hud-title panel-toggle__title">${titleText}</span>
                <span id="inventoryPanelStation" class="panel-toggle__meta">Станция: Руки</span>
            </span>
            <span id="inventoryPanelToggleIcon" class="panel-toggle__icon" aria-hidden="true">−</span>
        `;

        const body = document.createElement('div');
        body.id = 'inventoryCardBody';
        body.className = 'sidebar-card__body';
        inventoryGrid.parentNode.insertBefore(body, inventoryGrid);
        body.appendChild(inventoryGrid);
        ensureInventorySelectionPanel(body, inventoryGrid);
        inventoryCard.insertBefore(toggle, inventoryCard.firstChild);
    }

    function getPanelElements() {
        ensureInventoryPanelStructure();
        return {
            inventoryPanelToggle: document.getElementById('inventoryPanelToggle'),
            inventoryPanelToggleIcon: document.getElementById('inventoryPanelToggleIcon'),
            inventoryPanelStation: document.getElementById('inventoryPanelStation'),
            inventoryCardBody: document.getElementById('inventoryCardBody'),
            inventorySelectionPanel: document.getElementById('inventorySelectionPanel'),
            inventorySelectionMeta: document.getElementById('inventorySelectionMeta'),
            inventorySelectionTitle: document.getElementById('inventorySelectionTitle'),
            inventorySelectionFacts: document.getElementById('inventorySelectionFacts'),
            inventorySelectionDescription: document.getElementById('inventorySelectionDescription'),
            inventorySelectionIcon: document.getElementById('inventorySelectionIcon'),
            inventorySelectionQuantity: document.getElementById('inventorySelectionQuantity'),
            inventorySelectionActions: document.getElementById('inventorySelectionActions'),
            inventorySelectionUseButton: document.getElementById('inventorySelectionUseButton'),
            inventorySelectionDropButton: document.getElementById('inventorySelectionDropButton'),
            inventorySelectionStationPanel: document.getElementById('inventorySelectionStationPanel'),
            inventorySelectionStationTitle: document.getElementById('inventorySelectionStationTitle'),
            inventorySelectionStationSummary: document.getElementById('inventorySelectionStationSummary'),
            inventorySelectionCraftPanel: document.getElementById('inventorySelectionCraftPanel'),
            inventorySelectionCraftLabel: document.getElementById('inventorySelectionCraftLabel'),
            inventorySelectionCraftHint: document.getElementById('inventorySelectionCraftHint'),
            inventorySelectionCraftActions: document.getElementById('inventorySelectionCraftActions')
        };
    }

    function isInventoryPanelCollapsed() {
        return Boolean(bridge.getGame().state.isInventoryPanelCollapsed);
    }

    function bindPanelEvents() {
        if (panelEventsBound) {
            return;
        }

        const {
            inventoryPanelToggle,
            inventorySelectionUseButton,
            inventorySelectionDropButton,
            inventorySelectionCraftActions
        } = getPanelElements();

        if (inventoryPanelToggle) {
            inventoryPanelToggle.addEventListener('click', () => {
                toggleInventoryPanel();
            });
        }

        if (inventorySelectionUseButton) {
            inventorySelectionUseButton.addEventListener('click', () => {
                triggerInventoryAction('use');
            });
        }

        if (inventorySelectionDropButton) {
            inventorySelectionDropButton.addEventListener('click', () => {
                triggerInventoryAction('drop');
            });
        }

        if (inventorySelectionCraftActions) {
            inventorySelectionCraftActions.addEventListener('click', (event) => {
                const compressionButton = event.target.closest('[data-compression-recipe-id]');
                if (compressionButton && !compressionButton.disabled) {
                    triggerCompressionRecipe(compressionButton.getAttribute('data-compression-recipe-id'));
                    return;
                }

                const craftingButton = event.target.closest('[data-crafting-recipe-id]');
                if (!craftingButton || craftingButton.disabled) {
                    return;
                }

                triggerCraftingRecipe(craftingButton.getAttribute('data-crafting-recipe-id'));
            });
        }

        panelEventsBound = true;
    }

    function isMobileInventoryModalActive() {
        return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
            && document.body.dataset.mobilePanel === 'inventory';
    }

    function ensureMobileSelectionPanelVisible(selectionPanel) {
        if (!selectionPanel || !isMobileInventoryModalActive()) {
            return;
        }

        const scrollContainer = selectionPanel.closest('.mobile-modal__body');

        if (!scrollContainer) {
            return;
        }

        window.requestAnimationFrame(() => {
            const containerRect = scrollContainer.getBoundingClientRect();
            const panelRect = selectionPanel.getBoundingClientRect();
            const targetTop = scrollContainer.scrollTop + (panelRect.top - containerRect.top) - 8;

            scrollContainer.scrollTo({
                top: Math.max(0, targetTop),
                behavior: 'smooth'
            });
        });
    }

    function getCompressionRuntime() {
        return game.systems.compressionRuntime || null;
    }

    function getCraftingRuntime() {
        return game.systems.craftingRuntime || null;
    }

    function getContainerRegistry() {
        return game.systems.containerRegistry || null;
    }

    function getStationRuntime() {
        return game.systems.stationRuntime || null;
    }

    function syncInventoryPanelState() {
        const { inventoryPanelToggle, inventoryPanelToggleIcon, inventoryCardBody, inventoryPanelStation } = getPanelElements();
        const collapsed = isInventoryPanelCollapsed();
        const stationContext = getActiveStationContext();

        if (inventoryPanelToggle) {
            inventoryPanelToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        }

        if (inventoryPanelToggleIcon) {
            inventoryPanelToggleIcon.textContent = collapsed ? '+' : '−';
        }

        if (inventoryCardBody) {
            inventoryCardBody.hidden = collapsed;
        }

        if (inventoryPanelStation) {
            inventoryPanelStation.textContent = `Станция: ${stationContext.activeSourceLabel || stationContext.activeStationLabel || 'Руки'}`;
        }
    }

    function toggleInventoryPanel(forceValue) {
        const currentGame = bridge.getGame();
        const nextValue = typeof forceValue === 'boolean'
            ? forceValue
            : !isInventoryPanelCollapsed();

        currentGame.state.isInventoryPanelCollapsed = nextValue;
        bridge.renderAfterStateChange();
        return nextValue;
    }

    function getActionSourceButton(action) {
        const bridgeElements = typeof bridge.getElements === 'function'
            ? bridge.getElements()
            : null;
        const actionButtons = bridgeElements && Array.isArray(bridgeElements.actionButtons)
            ? bridgeElements.actionButtons
            : [];

        return actionButtons.find((button) => button.dataset.action === action)
            || document.querySelector(`.hud-button[data-action="${action}"]`);
    }

    function triggerInventoryAction(action) {
        const sourceButton = getActionSourceButton(action);

        if (sourceButton) {
            if (!sourceButton.disabled) {
                sourceButton.click();
                return true;
            }

            return false;
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

    function getItemCategoryLabels(definition) {
        const categories = definition && Array.isArray(definition.categories)
            ? definition.categories
            : [];

        return categories
            .map((category) => ITEM_CATEGORY_LABELS[category] || category)
            .filter(Boolean);
    }

    function getItemRarityLabel(definition) {
        const rarityKey = definition && definition.rarity ? definition.rarity : 'common';
        return ITEM_RARITY_LABELS[rarityKey] || rarityKey;
    }

    function formatPercentDelta(multiplier) {
        return Math.round(Math.abs((1 - multiplier) * 100));
    }

    function buildConsumableSummary(consumable) {
        if (!consumable || typeof consumable !== 'object') {
            return '';
        }

        const entries = Object.entries(consumable)
            .filter(([, value]) => Number.isFinite(value) && value !== 0)
            .map(([key, value]) => `${bridge.getStatLabel(key)} ${value > 0 ? `+${value}` : value}`);

        return entries.join(' · ');
    }

    function buildActiveEffectSummary(effect) {
        if (!effect || typeof effect !== 'object') {
            return '';
        }

        switch (effect.kind) {
        case 'travelBuff': {
            const parts = [];

            if (Number.isFinite(effect.freeSteps) && effect.freeSteps > 0) {
                parts.push(`бесплатные шаги: ${effect.freeSteps}`);
            }

            if (Number.isFinite(effect.discountMultiplier) && effect.discountMultiplier < 1) {
                const durationLabel = Number.isFinite(effect.durationSteps) && effect.durationSteps > 0
                    ? ` на ${effect.durationSteps} шагов`
                    : '';
                parts.push(`маршрут дешевле на ${formatPercentDelta(effect.discountMultiplier)}%${durationLabel}`);
            }

            if (effect.ignoreTravelZones) {
                const durationLabel = Number.isFinite(effect.durationSteps) && effect.durationSteps > 0
                    ? ` на ${effect.durationSteps} шагов`
                    : '';
                parts.push(`игнор тяжёлых зон${durationLabel}`);
            }

            return parts.join(' · ');
        }

        case 'islandBuff': {
            const parts = [];

            if (effect.label) {
                parts.push(effect.label);
            }

            if (Number.isFinite(effect.drainMultiplier) && effect.drainMultiplier !== 1) {
                parts.push(effect.drainMultiplier > 1
                    ? `расход выше на ${Math.round((effect.drainMultiplier - 1) * 100)}%`
                    : `расход ниже на ${formatPercentDelta(effect.drainMultiplier)}%`);
            }

            if (Number.isFinite(effect.foodRecoveryMultiplier) && effect.foodRecoveryMultiplier !== 1) {
                parts.push(effect.foodRecoveryMultiplier > 1
                    ? `еда сильнее на ${Math.round((effect.foodRecoveryMultiplier - 1) * 100)}%`
                    : `еда слабее на ${formatPercentDelta(effect.foodRecoveryMultiplier)}%`);
            }

            if (Number.isFinite(effect.travelCostMultiplier) && effect.travelCostMultiplier !== 1) {
                parts.push(effect.travelCostMultiplier > 1
                    ? `путь дороже на ${Math.round((effect.travelCostMultiplier - 1) * 100)}%`
                    : `путь дешевле на ${formatPercentDelta(effect.travelCostMultiplier)}%`);
            }

            return parts.join(' · ');
        }

        case 'nextChestBuff': {
            const parts = [];

            if (effect.preventEmpty) {
                parts.push('следующий сундук не будет пустым');
            }

            if (Number.isFinite(effect.extraRolls) && effect.extraRolls > 0) {
                parts.push(`доп. добыча: +${effect.extraRolls}`);
            }

            return parts.join(' · ') || 'усиливает следующий сундук';
        }

        case 'trapWard':
            return `защита от ловушки: ${Math.max(1, effect.charges || 1)} заряд`;
        case 'revealBestHouse':
            return 'показывает лучший дом текущего острова';
        case 'revealMerchant':
            return 'показывает торговца текущего острова';
        case 'revealMap':
            return effect.mode === 'halfIsland'
                ? 'открывает большую часть карты острова'
                : 'открывает карту острова';
        case 'cheapestRouteHint':
            return 'подсказывает самый дешёвый маршрут';
        case 'clearTravelPenalty':
            return 'снимает часть дорожных штрафов';
        case 'bridgeBuilder':
            return `строит мост: ${Math.max(1, effect.charges || 1)} кл.`;
        default:
            return effect.label || effect.kind || '';
        }
    }

    function buildPassiveEffectSummary(passive) {
        if (!passive || typeof passive !== 'object') {
            return '';
        }

        const parts = [];

        if (Number.isFinite(passive.travelCostMultiplier) && passive.travelCostMultiplier !== 1) {
            parts.push(passive.travelCostMultiplier < 1
                ? `шаги дешевле на ${formatPercentDelta(passive.travelCostMultiplier)}%`
                : `шаги дороже на ${Math.round((passive.travelCostMultiplier - 1) * 100)}%`);
        }

        if (Number.isFinite(passive.longRouteTravelCostMultiplier) && passive.longRouteTravelCostMultiplier !== 1) {
            parts.push(passive.longRouteTravelCostMultiplier < 1
                ? `длинные маршруты дешевле на ${formatPercentDelta(passive.longRouteTravelCostMultiplier)}%`
                : `длинные маршруты дороже на ${Math.round((passive.longRouteTravelCostMultiplier - 1) * 100)}%`);
        }

        if (Number.isFinite(passive.roughTravelCostMultiplier) && passive.roughTravelCostMultiplier !== 1) {
            parts.push(passive.roughTravelCostMultiplier < 1
                ? `тяжёлые зоны дешевле на ${formatPercentDelta(passive.roughTravelCostMultiplier)}%`
                : `тяжёлые зоны дороже на ${Math.round((passive.roughTravelCostMultiplier - 1) * 100)}%`);
        }

        if (Number.isFinite(passive.bridgeTravelCostMultiplier) && passive.bridgeTravelCostMultiplier !== 1) {
            parts.push(passive.bridgeTravelCostMultiplier < 1
                ? `переправы дешевле на ${formatPercentDelta(passive.bridgeTravelCostMultiplier)}%`
                : `переправы дороже на ${Math.round((passive.bridgeTravelCostMultiplier - 1) * 100)}%`);
        }

        if (Number.isFinite(passive.recoveryMultiplier) && passive.recoveryMultiplier !== 1) {
            parts.push(passive.recoveryMultiplier > 1
                ? `восстановление сильнее на ${Math.round((passive.recoveryMultiplier - 1) * 100)}%`
                : `восстановление слабее на ${formatPercentDelta(passive.recoveryMultiplier)}%`);
        }

        if (Number.isFinite(passive.foodRecoveryMultiplier) && passive.foodRecoveryMultiplier !== 1) {
            parts.push(passive.foodRecoveryMultiplier > 1
                ? `еда эффективнее на ${Math.round((passive.foodRecoveryMultiplier - 1) * 100)}%`
                : `еда слабее на ${formatPercentDelta(passive.foodRecoveryMultiplier)}%`);
        }

        if (Number.isFinite(passive.drainMultiplier) && passive.drainMultiplier !== 1) {
            parts.push(passive.drainMultiplier < 1
                ? `расход ниже на ${formatPercentDelta(passive.drainMultiplier)}%`
                : `расход выше на ${Math.round((passive.drainMultiplier - 1) * 100)}%`);
        }

        if (Number.isFinite(passive.routeLengthBonus) && passive.routeLengthBonus > 0) {
            parts.push(`маршрут длиннее на ${passive.routeLengthBonus} кл.`);
        }

        if (Number.isFinite(passive.freeOpeningSteps) && passive.freeOpeningSteps > 0) {
            parts.push(`первые шаги бесплатно: ${passive.freeOpeningSteps}`);
        }

        if (Number.isFinite(passive.goldLootMultiplier) && passive.goldLootMultiplier > 1) {
            parts.push(`золота больше на ${Math.round((passive.goldLootMultiplier - 1) * 100)}%`);
        }

        if (Number.isFinite(passive.chestLuck) && passive.chestLuck > 0) {
            parts.push(`удача сундуков: +${passive.chestLuck}`);
        }

        if (Array.isArray(passive.ignoreTravelZones) && passive.ignoreTravelZones.length > 0) {
            parts.push('игнор некоторых тяжёлых зон');
        }

        if (passive.showHouseValue) {
            parts.push('показывает ценность домов');
        }

        if (Number.isFinite(passive.synergyMultiplier) && passive.synergyMultiplier > 1) {
            parts.push(`усиливает другие пассивки на ${Math.round((passive.synergyMultiplier - 1) * 100)}%`);
        }

        return parts.slice(0, 3).join(' · ');
    }

    function buildContainerStateParameterSummary(containerState) {
        if (!containerState || typeof containerState !== 'object') {
            return '';
        }

        const isEmpty = typeof containerState.itemId === 'string'
            ? containerState.itemId === 'flask_empty'
            : !containerState.drinkable && !containerState.recipeReady && !containerState.useTransitionStateId;
        const fillLabel = isEmpty ? 'пустая' : 'полная';
        const parts = [fillLabel];

        if (containerState.stateLabel && containerState.stateLabel !== fillLabel) {
            parts.push(containerState.stateLabel);
        }

        return parts.join(' · ');
    }

    function buildContainerStateEffectSummary(containerState) {
        if (!containerState || typeof containerState !== 'object') {
            return '';
        }

        const parts = [];

        if (containerState.drinkable) {
            parts.push('пригодна для питья');
        }

        if (containerState.recipeReady) {
            parts.push('пригодна для рецепта');
        }

        if (parts.length === 0 && containerState.stateSummary) {
            parts.push(containerState.stateSummary);
        }

        return parts.join(' · ');
    }

    function buildSpoilageParameterSummary(item) {
        const inventoryRuntime = game.systems.inventoryRuntime || null;
        const spoilageState = inventoryRuntime && typeof inventoryRuntime.getItemSpoilageState === 'function'
            ? inventoryRuntime.getItemSpoilageState(item)
            : null;

        return spoilageState && spoilageState.statusLabel
            ? `свежесть: ${spoilageState.statusLabel}`
            : '';
    }

    function buildSelectedItemFacts(item, definition, description) {
        const containerRegistry = getContainerRegistry();
        const containerState = containerRegistry && typeof containerRegistry.getContainerStateByItemId === 'function'
            ? containerRegistry.getContainerStateByItemId(item && item.id ? item.id : (definition && definition.id))
            : null;
        const tierLabel = definition && Number.isFinite(definition.lootTier)
            ? `T${definition.lootTier}`
            : 'T0';
        const containerParameterSummary = buildContainerStateParameterSummary(containerState);
        const spoilageParameterSummary = buildSpoilageParameterSummary(item);
        const parameterParts = [
            tierLabel,
            getItemRarityLabel(definition),
            ...getItemCategoryLabels(definition).slice(0, 3),
            containerParameterSummary,
            spoilageParameterSummary
        ].filter(Boolean);
        const effectParts = [
            buildConsumableSummary(definition && definition.consumable),
            buildActiveEffectSummary(definition && definition.activeEffect),
            buildPassiveEffectSummary(definition && definition.passive),
            buildContainerStateEffectSummary(containerState)
        ].filter(Boolean);

        return [
            {
                label: 'Параметры',
                value: parameterParts.join(' · ') || 'без особых свойств'
            },
            {
                label: 'Эффекты',
                value: effectParts.join(' · ') || 'прямого эффекта нет'
            },
            {
                label: 'Описание',
                value: description || 'Описание этого предмета пока не подготовлено.'
            }
        ];
    }

    function buildFactNode(label, value) {
        const row = document.createElement('div');
        row.className = 'inventory-selection-panel__fact';

        const labelNode = document.createElement('span');
        labelNode.className = 'inventory-selection-panel__fact-label';
        labelNode.textContent = label;

        const valueNode = document.createElement('span');
        valueNode.className = 'inventory-selection-panel__fact-value';
        valueNode.textContent = value;

        row.append(labelNode, valueNode);
        return row;
    }

    function getActiveStationContext() {
        const stationRuntime = getStationRuntime();

        if (stationRuntime && typeof stationRuntime.getActiveStationContext === 'function') {
            return stationRuntime.getActiveStationContext();
        }

        return {
            activeStationId: 'hand',
            activeStationLabel: 'Руки',
            activeSourceLabel: 'Руки',
            activeSourceSummary: 'Стартовая станция, доступная без привязки к объекту.',
            activeSourceName: 'Руки',
            contextStationIds: ['hand'],
            contextStationLabels: ['Руки'],
            sourceContexts: [],
            availableStations: ['hand'],
            availableStationLabels: ['Руки']
        };
    }

    function resolveRecipeStationDescriptor(recipe) {
        const stationRuntime = getStationRuntime();
        const rawStationIds = Array.isArray(recipe && recipe.stationOptions) && recipe.stationOptions.length > 0
            ? recipe.stationOptions
            : [recipe && recipe.station];
        const stationIds = stationRuntime && typeof stationRuntime.normalizeStationList === 'function'
            ? stationRuntime.normalizeStationList(rawStationIds)
            : rawStationIds.filter(Boolean);
        const stationLabels = stationIds.map((stationId) => stationRuntime && typeof stationRuntime.getStationLabel === 'function'
            ? stationRuntime.getStationLabel(stationId, stationId)
            : stationId);
        const primaryStationId = stationIds[0] || 'hand';
        const primaryStationLabel = stationLabels[0]
            || (recipe && (recipe.stationLabel || recipe.station))
            || 'Руки';

        return {
            stationIds,
            stationLabels,
            primaryStationId,
            primaryStationLabel,
            stationLabel: stationLabels.join(' / ') || primaryStationLabel
        };
    }

    function buildOptionStatusFromEvaluation(evaluation, options = {}) {
        const requiredQuantity = Number.isFinite(options.requiredQuantity) ? options.requiredQuantity : 0;
        let statusLabel = options.fallbackStatus || '';
        let disabled = false;

        if (!evaluation) {
            return {
                statusLabel,
                disabled
            };
        }

        switch (evaluation.reason) {
        case 'missing-ingredients':
            statusLabel = requiredQuantity > 0
                ? `Нужно ${requiredQuantity} шт.`
                : buildMissingIngredientStatusLabel(evaluation.missingIngredients);
            disabled = true;
            break;
        case 'wrong-station':
            statusLabel = 'Станция не активна';
            disabled = true;
            break;
        case 'missing-environment':
            statusLabel = buildMissingEnvironmentStatusLabel(evaluation.missingEnvironments);
            disabled = true;
            break;
        case 'inventory-full':
            statusLabel = 'В сумке нет места';
            disabled = true;
            break;
        default:
            if (evaluation.success) {
                statusLabel = 'Готово';
            } else if (evaluation.message) {
                statusLabel = evaluation.message;
                disabled = true;
            }
            break;
        }

        return {
            statusLabel,
            disabled
        };
    }

    function getCompressionOptions(item) {
        const compressionRuntime = getCompressionRuntime();

        if (!compressionRuntime || !item || !item.id) {
            return [];
        }

        const recipes = compressionRuntime.getCompressionRecipesForSourceItem(item.id) || [];
        const evaluations = compressionRuntime.evaluateCompressionForSourceItem(item.id) || [];

        return recipes.map((recipe) => {
            const evaluation = evaluations.find((entry) => entry && entry.recipe && entry.recipe.recipeId === recipe.recipeId) || null;
            const stationDescriptor = resolveRecipeStationDescriptor(recipe);
            const selectedIngredient = Array.isArray(recipe.ingredients)
                ? recipe.ingredients.find((ingredient) => ingredient && ingredient.consumed !== false)
                : null;
            const requiredQuantity = selectedIngredient && Number.isFinite(selectedIngredient.quantity)
                ? selectedIngredient.quantity
                : 0;
            const optionStatus = buildOptionStatusFromEvaluation(evaluation, {
                requiredQuantity,
                fallbackStatus: stationDescriptor.primaryStationLabel ? `Нужен ресурс для "${stationDescriptor.primaryStationLabel}"` : ''
            });

            return {
                recipeId: recipe.recipeId,
                actionType: 'compression',
                stationId: stationDescriptor.primaryStationId,
                stationLabel: stationDescriptor.stationLabel,
                stationIds: stationDescriptor.stationIds,
                title: recipe.result && recipe.result.label ? recipe.result.label : recipe.label,
                subtitle: optionStatus.statusLabel,
                disabled: optionStatus.disabled,
                message: evaluation && evaluation.message ? evaluation.message : ''
            };
        });
    }

    function buildMissingIngredientStatusLabel(missingIngredients = []) {
        const missingEntry = Array.isArray(missingIngredients) ? missingIngredients[0] : null;

        if (!missingEntry) {
            return 'Не хватает ингредиентов';
        }

        const quantity = Number.isFinite(missingEntry.required) && missingEntry.required > 1
            ? ` x${missingEntry.required}`
            : '';
        return `Нужно: ${(missingEntry.label || missingEntry.id || 'ингредиент')}${quantity}`;
    }

    function buildMissingEnvironmentStatusLabel(missingEnvironments = []) {
        const missingEntry = Array.isArray(missingEnvironments) ? missingEnvironments[0] : null;
        return `Нужно рядом: ${missingEntry && (missingEntry.label || missingEntry.id) ? (missingEntry.label || missingEntry.id) : 'обязательное окружение'}`;
    }

    function recipeUsesInventoryItem(recipe, itemId) {
        if (!recipe || !itemId || !Array.isArray(recipe.ingredients)) {
            return false;
        }

        return recipe.ingredients.some((ingredient) => ingredient
            && ingredient.kind !== 'environment'
            && ingredient.gameplaySupport
            && ingredient.gameplaySupport.supported
            && Array.isArray(ingredient.gameplaySupport.bindings)
            && ingredient.gameplaySupport.bindings.some((binding) => binding && binding.itemId === itemId));
    }

    function getCraftingOptions(item) {
        const craftingRuntime = getCraftingRuntime();
        const compressionRuntime = getCompressionRuntime();

        if (!craftingRuntime || !item || !item.id || typeof craftingRuntime.getCompiledRecipes !== 'function' || typeof craftingRuntime.evaluateRecipeAgainstInventory !== 'function') {
            return [];
        }

        return craftingRuntime.getCompiledRecipes()
            .filter((recipe) => recipe && recipe.recipeId && recipe.supportsGameplayInventory)
            .filter((recipe) => !(compressionRuntime && typeof compressionRuntime.isCompressionRecipe === 'function' && compressionRuntime.isCompressionRecipe(recipe)))
            .filter((recipe) => recipeUsesInventoryItem(recipe, item.id))
            .map((recipe) => {
                const evaluation = craftingRuntime.evaluateRecipeAgainstInventory(recipe.recipeId, {
                    scanNearbyEnvironment: true
                });
                const stationDescriptor = resolveRecipeStationDescriptor(recipe);
                const optionStatus = buildOptionStatusFromEvaluation(evaluation);

                return {
                    recipeId: recipe.recipeId,
                    actionType: 'crafting',
                    stationId: stationDescriptor.primaryStationId,
                    stationLabel: stationDescriptor.stationLabel,
                    stationIds: stationDescriptor.stationIds,
                    title: recipe.label || (recipe.result && recipe.result.label) || recipe.recipeId,
                    subtitle: optionStatus.statusLabel,
                    disabled: optionStatus.disabled,
                    message: evaluation && evaluation.message ? evaluation.message : ''
                };
            });
    }

    function getStationOrderIndex(stationId) {
        const stationRuntime = getStationRuntime();
        const stationDefinitions = stationRuntime && typeof stationRuntime.getStationDefinitions === 'function'
            ? stationRuntime.getStationDefinitions()
            : [];
        const index = stationDefinitions.findIndex((station) => station && station.id === stationId);
        return index >= 0 ? index : 999;
    }

    function groupCraftOptionsByStation(craftOptions, stationContext) {
        const availableStations = new Set(Array.isArray(stationContext && stationContext.availableStations)
            ? stationContext.availableStations
            : ['hand']);
        const currentStations = new Set(Array.isArray(stationContext && stationContext.contextStationIds)
            ? stationContext.contextStationIds
            : [stationContext && stationContext.activeStationId ? stationContext.activeStationId : 'hand']);
        const grouped = new Map();

        (Array.isArray(craftOptions) ? craftOptions : []).forEach((option) => {
            const stationId = option && option.stationId ? option.stationId : 'hand';

            if (!grouped.has(stationId)) {
                grouped.set(stationId, {
                    stationId,
                    stationLabel: option && option.stationLabel ? option.stationLabel : stationId,
                    options: []
                });
            }

            grouped.get(stationId).options.push(option);
        });

        return [...grouped.values()]
            .map((group) => ({
                ...group,
                isCurrent: currentStations.has(group.stationId),
                isAvailable: availableStations.has(group.stationId)
            }))
            .sort((left, right) => {
                const leftPriority = left.isCurrent ? 0 : (left.isAvailable ? 1 : 2);
                const rightPriority = right.isCurrent ? 0 : (right.isAvailable ? 1 : 2);

                if (leftPriority !== rightPriority) {
                    return leftPriority - rightPriority;
                }

                return getStationOrderIndex(left.stationId) - getStationOrderIndex(right.stationId);
            });
    }

    function buildStationGroupBadge(group) {
        const badge = document.createElement('span');
        badge.className = 'inventory-selection-panel__craft-group-badge';

        if (group.stationId === 'hand') {
            badge.textContent = group.isCurrent ? 'Активна' : 'Всегда доступна';
            return badge;
        }

        badge.textContent = group.isCurrent
            ? 'Активна'
            : (group.isAvailable ? 'Рядом' : 'Недоступна');
        return badge;
    }

    function buildCraftStationGroup(group) {
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

        header.append(titleNode, buildStationGroupBadge(group));

        const actions = document.createElement('div');
        actions.className = 'inventory-selection-panel__craft-group-actions';
        actions.replaceChildren(...group.options.map((option) => buildCraftActionButton(option)));

        section.append(header, actions);
        return section;
    }

    function buildCraftActionButton(option) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'hud-button inventory-selection-panel__craft-action';
        if (option.actionType === 'compression') {
            button.setAttribute('data-compression-recipe-id', option.recipeId);
        } else {
            button.setAttribute('data-crafting-recipe-id', option.recipeId);
        }
        button.disabled = Boolean(option.disabled);

        const titleNode = document.createElement('span');
        titleNode.className = 'inventory-selection-panel__craft-action-title';
        titleNode.textContent = option.title;

        const subtitleNode = document.createElement('span');
        subtitleNode.className = 'inventory-selection-panel__craft-action-subtitle';
        subtitleNode.textContent = option.subtitle;

        button.append(titleNode, subtitleNode);

        if (option.message) {
            button.title = option.message;
        }

        return button;
    }

    function triggerCompressionRecipe(recipeId) {
        const compressionRuntime = getCompressionRuntime();
        const selectedItem = bridge.getSelectedInventoryItem();

        if (!compressionRuntime || typeof compressionRuntime.compressSourceItem !== 'function' || !selectedItem || !selectedItem.id) {
            return false;
        }

        const outcome = compressionRuntime.compressSourceItem(selectedItem.id, { recipeId });
        bridge.setActionMessage(outcome && outcome.message ? outcome.message : 'Не удалось выполнить крафт.');
        bridge.renderAfterStateChange();
        return Boolean(outcome && outcome.success);
    }

    function triggerCraftingRecipe(recipeId) {
        const craftingRuntime = getCraftingRuntime();

        if (!craftingRuntime || typeof craftingRuntime.craftRecipeAgainstInventory !== 'function') {
            return false;
        }

        const outcome = craftingRuntime.craftRecipeAgainstInventory(recipeId, {
            scanNearbyEnvironment: true
        });
        bridge.setActionMessage(outcome && outcome.message ? outcome.message : 'Не удалось выполнить крафт.');
        bridge.renderAfterStateChange();
        return Boolean(outcome && outcome.success);
    }

    function syncSelectionPanel() {
        const refs = getPanelElements();
        const selectedItem = bridge.getSelectedInventoryItem();

        if (!refs.inventorySelectionPanel) {
            return;
        }

        if (!selectedItem || !selectedItem.id) {
            lastMobileSelectionSignature = null;
            refs.inventorySelectionPanel.hidden = true;
            return;
        }

        const definition = bridge.getItemDefinition(selectedItem.id) || null;
        const selectedSlotLabel = Number.isFinite(game.state.selectedInventorySlot)
            ? `Слот ${game.state.selectedInventorySlot + 1}`
            : 'Выбран предмет';
        const quantityLabel = selectedItem.quantity > 1
            ? ` · ${selectedItem.quantity} шт.`
            : '';
        const description = bridge.getItemDescription(selectedItem.id)
            || `Предмет "${selectedItem.label}" пока без отдельного описания.`;
        const facts = buildSelectedItemFacts(selectedItem, definition, description).map(({ label, value }) => buildFactNode(label, value));
        const useSourceButton = getActionSourceButton('use');
        const dropSourceButton = getActionSourceButton('drop');
        const compressionOptions = getCompressionOptions(selectedItem);
        const craftingOptions = getCraftingOptions(selectedItem);
        const craftOptions = [...craftingOptions, ...compressionOptions];
        const showInventorySelectionActions = isMobileInventoryModalActive();
        const stationContext = getActiveStationContext();
        const groupedCraftOptions = groupCraftOptionsByStation(craftOptions, stationContext);

        refs.inventorySelectionPanel.hidden = false;

        if (refs.inventorySelectionMeta) {
            refs.inventorySelectionMeta.textContent = `${selectedSlotLabel}${quantityLabel}`;
        }

        if (refs.inventorySelectionTitle) {
            refs.inventorySelectionTitle.textContent = selectedItem.label;
        }

        if (refs.inventorySelectionFacts) {
            refs.inventorySelectionFacts.replaceChildren(...facts);
        }

        if (refs.inventorySelectionDescription) {
            refs.inventorySelectionDescription.hidden = true;
            refs.inventorySelectionDescription.textContent = '';
        }

        if (refs.inventorySelectionIcon) {
            refs.inventorySelectionIcon.textContent = selectedItem.icon || (definition && definition.icon) || '?';
        }

        if (refs.inventorySelectionQuantity) {
            refs.inventorySelectionQuantity.hidden = !(selectedItem.quantity > 1);
            refs.inventorySelectionQuantity.textContent = `x${selectedItem.quantity}`;
        }

        if (refs.inventorySelectionActions) {
            refs.inventorySelectionActions.hidden = !showInventorySelectionActions;
        }

        if (refs.inventorySelectionUseButton) {
            const canUse = Boolean(useSourceButton && !useSourceButton.disabled);
            refs.inventorySelectionUseButton.hidden = !canUse;
            refs.inventorySelectionUseButton.disabled = !canUse;
        }

        if (refs.inventorySelectionDropButton) {
            refs.inventorySelectionDropButton.disabled = !(dropSourceButton && !dropSourceButton.disabled);
        }

        const actionsContainer = refs.inventorySelectionActions
            || (refs.inventorySelectionUseButton && refs.inventorySelectionUseButton.parentElement);
        if (actionsContainer) {
            const visibleButtons = Array.from(actionsContainer.querySelectorAll('.inventory-selection-panel__action'))
                .filter((button) => !button.hidden);
            actionsContainer.classList.toggle('inventory-selection-panel__actions--single', visibleButtons.length <= 1);
        }

        if (refs.inventorySelectionStationPanel) {
            refs.inventorySelectionStationPanel.hidden = false;
        }

        if (refs.inventorySelectionStationTitle) {
            refs.inventorySelectionStationTitle.textContent = stationContext.activeSourceLabel || stationContext.activeStationLabel || 'Руки';
        }

        if (refs.inventorySelectionStationSummary) {
            const availableLabels = Array.isArray(stationContext.availableStationLabels) && stationContext.availableStationLabels.length > 0
                ? stationContext.availableStationLabels.join(', ')
                : 'Руки';
            refs.inventorySelectionStationSummary.textContent = `${stationContext.activeSourceSummary} Доступно сейчас: ${availableLabels}.`;
        }

        if (refs.inventorySelectionCraftPanel) {
            refs.inventorySelectionCraftPanel.hidden = craftOptions.length === 0;
        }

        if (refs.inventorySelectionCraftLabel) {
            refs.inventorySelectionCraftLabel.textContent = 'Рецепты по станциям';
        }

        if (refs.inventorySelectionCraftHint) {
            refs.inventorySelectionCraftHint.textContent = craftOptions.length > 0
                ? 'Список ниже разбит по станциям, чтобы было видно, что собирается руками, в лагере, на верстаке и в мастерской.'
                : '';
        }

        if (refs.inventorySelectionCraftActions) {
            refs.inventorySelectionCraftActions.replaceChildren(
                ...groupedCraftOptions.map((group) => buildCraftStationGroup(group))
            );
        }

        const selectionSignature = `${selectedItem.id}:${Number.isFinite(game.state.selectedInventorySlot) ? game.state.selectedInventorySlot : -1}`;
        if (selectionSignature !== lastMobileSelectionSignature) {
            lastMobileSelectionSignature = selectionSignature;
            ensureMobileSelectionPanelVisible(refs.inventorySelectionPanel);
        }
    }

    function buildInventorySlot(item, index) {
        const currentGame = bridge.getGame();
        const normalizedItem = bridge.normalizeInventoryItem(item);
        const slot = document.createElement('button');
        const unlockedSlots = bridge.getUnlockedInventorySlots();
        const isUnlocked = index < unlockedSlots;
        const isSelected = currentGame.state.selectedInventorySlot === index;

        slot.type = 'button';
        slot.className = 'inventory-slot';
        slot.setAttribute('data-slot-index', index.toString());

        if (normalizedItem && normalizedItem.id) {
            slot.setAttribute('data-item-id', normalizedItem.id);
        }

        if (!isUnlocked) {
            slot.classList.add('inventory-slot--inactive');
            slot.disabled = true;
        } else if (normalizedItem) {
            slot.classList.add('inventory-slot--interactive');
        } else {
            slot.classList.add('inventory-slot--active-empty');
        }

        if (isSelected) {
            slot.classList.add('inventory-slot--selected');
        }

        const icon = document.createElement('span');
        icon.className = 'inventory-slot__icon';
        icon.textContent = normalizedItem ? normalizedItem.icon : '';

        const label = document.createElement('span');
        label.className = 'inventory-slot__label';
        label.textContent = normalizedItem
            ? `${normalizedItem.label}${normalizedItem.quantity > 1 ? ` x${normalizedItem.quantity}` : ''}`
            : (isUnlocked ? 'Пусто' : 'Слот');

        slot.append(icon, label);
        return slot;
    }

    function renderInventory() {
        const elements = bridge.getElements();
        bindPanelEvents();
        syncInventoryPanelState();

        if (!elements.inventoryGrid) {
            return;
        }

        const totalSlots = Math.max(0, bridge.getUnlockedInventorySlots());
        const inventory = [...bridge.getInventory()];
        while (inventory.length < totalSlots) {
            inventory.push(null);
        }

        const fragment = document.createDocumentFragment();
        inventory.slice(0, totalSlots).forEach((item, index) => {
            fragment.append(buildInventorySlot(item, index));
        });

        elements.inventoryGrid.replaceChildren(fragment);
        syncSelectionPanel();
    }

    function drawFallbackPortrait(context, size) {
        context.fillStyle = '#2b2b2b';
        context.beginPath();
        context.arc(size / 2, size / 2 - 2, 16, 0, Math.PI * 2);
        context.fill();
        context.fillRect(size / 2 - 15, size / 2 + 10, 30, 24);
    }

    function drawPortrait() {
        const currentGame = bridge.getGame();
        const elements = bridge.getElements();
        const portraitCanvas = elements.selectedCharacterPortrait;
        if (!portraitCanvas) {
            return;
        }

        const context = portraitCanvas.getContext('2d');
        const { width, height } = portraitCanvas;
        const playerRenderer = currentGame.systems.playerRenderer || null;
        const frame = playerRenderer && typeof playerRenderer.getCurrentFrame === 'function'
            ? playerRenderer.getCurrentFrame()
            : null;

        context.clearRect(0, 0, width, height);
        context.fillStyle = '#efe4b9';
        context.fillRect(0, 0, width, height);
        context.fillStyle = '#d0c08b';
        context.fillRect(0, height - 18, width, 18);
        context.imageSmoothingEnabled = false;

        if (!frame || !frame.image) {
            drawFallbackPortrait(context, width);
            return;
        }

        const scale = Math.min((height * 0.8) / frame.sourceHeight, (width * 0.78) / frame.sourceWidth);
        const drawWidth = frame.sourceWidth * scale;
        const drawHeight = frame.sourceHeight * scale;
        const drawX = (width - drawWidth) / 2;
        const drawY = height - drawHeight - 2;

        context.save();
        if (frame.flipX) {
            context.translate(drawX + drawWidth, drawY);
            context.scale(-1, 1);
            context.drawImage(
                frame.image,
                frame.sourceX,
                frame.sourceY,
                frame.sourceWidth,
                frame.sourceHeight,
                0,
                0,
                drawWidth,
                drawHeight
            );
        } else {
            context.drawImage(
                frame.image,
                frame.sourceX,
                frame.sourceY,
                frame.sourceWidth,
                frame.sourceHeight,
                drawX,
                drawY,
                drawWidth,
                drawHeight
            );
        }
        context.restore();
    }

    function selectInventorySlot(index) {
        const currentGame = bridge.getGame();
        if (index < 0 || index >= bridge.getUnlockedInventorySlots()) {
            return;
        }

        currentGame.state.selectedInventorySlot = currentGame.state.selectedInventorySlot === index ? null : index;
        const selectedItem = bridge.getSelectedInventoryItem();

        if (selectedItem) {
            bridge.setActionMessage(`Выбран предмет: ${selectedItem.label}.`);
        } else if (currentGame.state.selectedInventorySlot === null) {
            bridge.setActionMessage(bridge.getDefaultActionHint(currentGame.state.activeInteraction, currentGame.state.activeTileInfo));
        } else {
            bridge.setActionMessage('Выбран пустой слот.');
        }

        bridge.renderAfterStateChange();
    }

    function handleInventoryClick(event) {
        const currentGame = bridge.getGame();
        if (currentGame.state.isGameOver) {
            return;
        }

        const slot = event.target.closest('.inventory-slot');
        if (!slot || slot.disabled) {
            return;
        }

        const index = Number(slot.getAttribute('data-slot-index'));
        if (!Number.isFinite(index)) {
            return;
        }

        selectInventorySlot(index);
    }

    Object.assign(inventoryUi, {
        buildInventorySlot,
        renderInventory,
        drawPortrait,
        selectInventorySlot,
        handleInventoryClick,
        syncInventoryPanelState,
        syncSelectionPanel,
        toggleInventoryPanel
    });
})();
