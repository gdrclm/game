(() => {
    const game = window.Game;
    const inventoryUi = game.systems.inventoryUi = game.systems.inventoryUi || {};
    const bridge = game.systems.uiBridge;
    let panelEventsBound = false;

    if (!bridge) {
        return;
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

        if (document.getElementById('inventoryPanelToggle') && document.getElementById('inventoryCardBody')) {
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
            </span>
            <span id="inventoryPanelToggleIcon" class="panel-toggle__icon" aria-hidden="true">−</span>
        `;

        const body = document.createElement('div');
        body.id = 'inventoryCardBody';
        body.className = 'sidebar-card__body';
        inventoryGrid.parentNode.insertBefore(body, inventoryGrid);
        body.appendChild(inventoryGrid);
        inventoryCard.insertBefore(toggle, inventoryCard.firstChild);
    }

    function getPanelElements() {
        ensureInventoryPanelStructure();
        return {
            inventoryPanelToggle: document.getElementById('inventoryPanelToggle'),
            inventoryPanelToggleIcon: document.getElementById('inventoryPanelToggleIcon'),
            inventoryCardBody: document.getElementById('inventoryCardBody')
        };
    }

    function isInventoryPanelCollapsed() {
        return Boolean(bridge.getGame().state.isInventoryPanelCollapsed);
    }

    function bindPanelEvents() {
        if (panelEventsBound) {
            return;
        }

        const { inventoryPanelToggle } = getPanelElements();
        if (inventoryPanelToggle) {
            inventoryPanelToggle.addEventListener('click', () => {
                toggleInventoryPanel();
            });
        }

        panelEventsBound = true;
    }

    function syncInventoryPanelState() {
        const { inventoryPanelToggle, inventoryPanelToggleIcon, inventoryCardBody } = getPanelElements();
        const collapsed = isInventoryPanelCollapsed();

        if (inventoryPanelToggle) {
            inventoryPanelToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        }

        if (inventoryPanelToggleIcon) {
            inventoryPanelToggleIcon.textContent = collapsed ? '+' : '−';
        }

        if (inventoryCardBody) {
            inventoryCardBody.hidden = collapsed;
        }
    }

    function toggleInventoryPanel(forceValue) {
        const game = bridge.getGame();
        const nextValue = typeof forceValue === 'boolean'
            ? forceValue
            : !isInventoryPanelCollapsed();

        game.state.isInventoryPanelCollapsed = nextValue;
        bridge.renderAfterStateChange();
        return nextValue;
    }

    function buildInventorySlot(item, index) {
        const game = bridge.getGame();
        const normalizedItem = bridge.normalizeInventoryItem(item);
        const slot = document.createElement('button');
        const unlockedSlots = bridge.getUnlockedInventorySlots();
        const isUnlocked = index < unlockedSlots;
        const isSelected = game.state.selectedInventorySlot === index;

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

        const totalSlots = Math.max(
            8,
            game.systems.bagUpgradeRuntime && typeof game.systems.bagUpgradeRuntime.getBagSlotCap === 'function'
                ? game.systems.bagUpgradeRuntime.getBagSlotCap()
                : 10
        );
        const inventory = [...bridge.getInventory()];
        while (inventory.length < totalSlots) {
            inventory.push(null);
        }

        const fragment = document.createDocumentFragment();
        inventory.slice(0, totalSlots).forEach((item, index) => {
            fragment.append(buildInventorySlot(item, index));
        });

        elements.inventoryGrid.replaceChildren(fragment);
    }

    function drawFallbackPortrait(context, size) {
        context.fillStyle = '#2b2b2b';
        context.beginPath();
        context.arc(size / 2, size / 2 - 2, 16, 0, Math.PI * 2);
        context.fill();
        context.fillRect(size / 2 - 15, size / 2 + 10, 30, 24);
    }

    function drawPortrait() {
        const game = bridge.getGame();
        const elements = bridge.getElements();
        const portraitCanvas = elements.selectedCharacterPortrait;
        if (!portraitCanvas) {
            return;
        }

        const context = portraitCanvas.getContext('2d');
        const { width, height } = portraitCanvas;
        const sprite = game.assets.playerSprite;
        const spriteFrames = game.config.playerSprite.frames;
        const direction = game.state.playerFacing || 'south';
        const frame = spriteFrames[direction] || spriteFrames.south;

        context.clearRect(0, 0, width, height);
        context.fillStyle = '#efe4b9';
        context.fillRect(0, 0, width, height);
        context.fillStyle = '#d0c08b';
        context.fillRect(0, height - 18, width, 18);
        context.imageSmoothingEnabled = false;

        if (!sprite || !sprite.complete || !sprite.naturalWidth || !frame) {
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
                sprite,
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
                sprite,
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
        const game = bridge.getGame();
        if (index < 0 || index >= bridge.getUnlockedInventorySlots()) {
            return;
        }

        game.state.selectedInventorySlot = game.state.selectedInventorySlot === index ? null : index;
        const selectedItem = bridge.getSelectedInventoryItem();

        if (selectedItem) {
            bridge.setActionMessage(`Выбран предмет: ${selectedItem.label}.`);
        } else if (game.state.selectedInventorySlot === null) {
            bridge.setActionMessage(bridge.getDefaultActionHint(game.state.activeInteraction, game.state.activeTileInfo));
        } else {
            bridge.setActionMessage('Выбран пустой слот.');
        }

        bridge.renderAfterStateChange();
    }

    function handleInventoryClick(event) {
        const game = bridge.getGame();
        if (game.state.isGameOver) {
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
        toggleInventoryPanel
    });
})();
