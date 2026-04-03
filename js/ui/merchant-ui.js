(() => {
    const game = window.Game;
    const merchantUi = game.systems.merchantUi = game.systems.merchantUi || {};
    const bridge = game.systems.uiBridge;

    if (!bridge) {
        return;
    }

    function getInventoryRuntime() {
        return game.systems.inventoryRuntime || null;
    }

    function getPricingSystem() {
        return game.systems.pricing || game.systems.loot || null;
    }

    function getShopRuntime() {
        return game.systems.shopRuntime || null;
    }

    function getQuestRuntime() {
        return game.systems.questRuntime || null;
    }

    function getBagUpgradeRuntime() {
        return game.systems.bagUpgradeRuntime || null;
    }

    function getUiState() {
        const ui = bridge.getUi();
        ui.openMerchantHouseId = ui.openMerchantHouseId || null;
        ui.merchantDescriptionByHouseId = ui.merchantDescriptionByHouseId || {};
        return ui;
    }

    function isSupportedEncounter(encounter) {
        return Boolean(encounter && (encounter.kind === 'merchant' || encounter.kind === 'artisan'));
    }

    function getEncounterForSource(source) {
        const encounter = bridge.getHouseEncounter(source);
        return isSupportedEncounter(encounter) ? encounter : null;
    }

    function persistMerchantState(source) {
        const shopRuntime = getShopRuntime();

        if (shopRuntime && typeof shopRuntime.persistMerchantState === 'function') {
            return shopRuntime.persistMerchantState(source);
        }

        const encounter = getEncounterForSource(source);
        if (!source || !encounter || encounter.kind !== 'merchant') {
            return null;
        }

        game.state.merchantStateByHouseId = game.state.merchantStateByHouseId || {};
        game.state.merchantStateByHouseId[source.houseId] = {
            stock: Array.isArray(encounter.stock)
                ? encounter.stock.map((stockItem) => ({ ...stockItem }))
                : [],
            quest: encounter.quest ? { ...encounter.quest } : null
        };

        return game.state.merchantStateByHouseId[source.houseId];
    }

    function closeMerchantPanel() {
        const ui = getUiState();
        const elements = bridge.getElements();
        ui.openMerchantHouseId = null;

        if (elements.merchantPanel) {
            elements.merchantPanel.hidden = true;
        }
    }

    function getOpenMerchantSource(activeInteraction = game.state.activeInteraction) {
        const ui = getUiState();

        if (!ui.openMerchantHouseId || !activeInteraction || activeInteraction.houseId !== ui.openMerchantHouseId) {
            return null;
        }

        const encounter = getEncounterForSource(activeInteraction);
        return encounter ? activeInteraction : null;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatQuantityLabel(quantity) {
        return quantity > 1 ? `x${quantity}` : '1 шт.';
    }

    function getEncounterQuest(source, encounter) {
        const questRuntime = getQuestRuntime();

        if (questRuntime && typeof questRuntime.getEncounterQuest === 'function') {
            return questRuntime.getEncounterQuest(source) || (encounter ? encounter.quest || null : null);
        }

        return encounter ? encounter.quest || null : null;
    }

    function getMerchantInspectableItems(encounter) {
        const inventoryRuntime = getInventoryRuntime();
        const items = [];
        const seenItemIds = new Set();

        const appendItem = (itemId, label) => {
            if (!itemId || seenItemIds.has(itemId)) {
                return;
            }

            seenItemIds.add(itemId);
            items.push({
                itemId,
                label: label || (bridge.getItemDefinition(itemId) ? bridge.getItemDefinition(itemId).label : itemId)
            });
        };

        if (encounter && encounter.quest && encounter.quest.itemId) {
            appendItem(encounter.quest.itemId, encounter.quest.label);
        }

        if (encounter && encounter.kind === 'merchant' && Array.isArray(encounter.stock)) {
            encounter.stock.forEach((stockItem) => {
                appendItem(stockItem.itemId, stockItem.label);
            });
        }

        if (inventoryRuntime) {
            inventoryRuntime.getInventory()
                .slice(0, inventoryRuntime.getUnlockedInventorySlots())
                .map((item) => inventoryRuntime.normalizeInventoryItem(item))
                .filter(Boolean)
                .forEach((item) => {
                    appendItem(item.id, item.label);
                });
        }

        return items;
    }

    function getMerchantDescriptionState(source, encounter) {
        const ui = getUiState();

        if (!source || !source.houseId) {
            return null;
        }

        const items = getMerchantInspectableItems(encounter);
        const selectedItemId = ui.merchantDescriptionByHouseId[source.houseId];
        const selectedItem = items.find((item) => item.itemId === selectedItemId) || items[0] || null;

        if (!selectedItem) {
            return null;
        }

        ui.merchantDescriptionByHouseId[source.houseId] = selectedItem.itemId;
        return {
            itemId: selectedItem.itemId,
            label: selectedItem.label,
            description: bridge.getItemDescription(selectedItem.itemId) || 'Описание этого предмета пока не подготовлено.'
        };
    }

    function applyPanelOutcome(outcome, fallbackMessage) {
        const message = outcome && outcome.message ? outcome.message : fallbackMessage;

        if (outcome && Array.isArray(outcome.effectDrops) && outcome.effectDrops.length > 0 && game.systems.effects) {
            game.systems.effects.spawnInventoryUse(game.state.playerPos, outcome.effectDrops);
        }

        bridge.setActionMessage(message);
        bridge.renderAfterStateChange();
    }

    function buildDescriptionSection(selectedDescription) {
        if (!selectedDescription) {
            return `
                <div class="merchant-section">
                    <h3 class="merchant-section__title">Описание</h3>
                    <p class="panel-copy">Нажми на товар, квестовый предмет или предмет в сумке, чтобы увидеть описание.</p>
                </div>
            `;
        }

        return `
            <div class="merchant-section">
                <h3 class="merchant-section__title">Описание</h3>
                <div class="merchant-panel__description">
                    <div class="merchant-row__title">${escapeHtml(selectedDescription.label)}</div>
                    <p class="panel-copy">${escapeHtml(selectedDescription.description)}</p>
                </div>
            </div>
        `;
    }

    function buildMerchantQuestSection(quest, selectedItemId, inventoryRuntime) {
        if (!quest) {
            return `
                <div class="merchant-section">
                    <h3 class="merchant-section__title">Квест</h3>
                    <p class="panel-copy">Сейчас у торговца нет поручений.</p>
                </div>
            `;
        }

        const ownedQuestItems = inventoryRuntime ? inventoryRuntime.countInventoryItem(quest.itemId) : 0;
        return `
            <div class="merchant-section">
                <h3 class="merchant-section__title">Квест</h3>
                <div class="merchant-row">
                    <div class="merchant-row__meta">
                        <button class="merchant-link${selectedItemId === quest.itemId ? ' merchant-link--selected' : ''}" type="button" data-merchant-action="describe" data-item-id="${quest.itemId}">
                            ${escapeHtml(quest.label)} ${quest.quantity > 1 ? `x${quest.quantity}` : ''}
                        </button>
                        <div class="merchant-row__note">${escapeHtml(quest.description || '')}</div>
                        <div class="merchant-row__note">В сумке: ${ownedQuestItems}/${quest.quantity} · Награда: ${quest.rewardGold || 0} золота</div>
                    </div>
                    <div class="merchant-row__actions">
                        <button class="hud-button" type="button" data-merchant-action="quest" ${quest.completed || ownedQuestItems < quest.quantity ? 'disabled' : ''}>${quest.completed ? 'Сдано' : 'Сдать'}</button>
                    </div>
                </div>
            </div>
        `;
    }

    function buildArtisanRequirementRows(quest) {
        const rows = [];
        const matches = Array.isArray(quest.requirementMatches) ? quest.requirementMatches : [];

        matches.forEach((match) => {
            const prefix = match.satisfied ? '✓' : (match.optional ? '•' : '□');
            const suffix = match.satisfied && match.itemLabel ? ` — ${escapeHtml(match.itemLabel)}` : '';
            rows.push(`<div class="merchant-row__note">${prefix} ${escapeHtml(match.label || 'Требование')}${suffix}</div>`);
        });

        if (Array.isArray(quest.missingRequirements) && quest.missingRequirements.length > 0) {
            rows.push(`<div class="merchant-row__note">Не хватает: ${quest.missingRequirements.map((requirement) => escapeHtml(requirement.label)).join(', ')}</div>`);
        }

        return rows.join('');
    }

    function buildArtisanQuestVisual(quest) {
        const categoryLabels = Array.isArray(quest.questCategoryLabels) ? quest.questCategoryLabels : [];
        const collectedRequirements = Array.isArray(quest.collectedRequirements) ? quest.collectedRequirements : [];
        const missingRequirements = Array.isArray(quest.missingRequirements) ? quest.missingRequirements : [];
        const optionalRequirements = Array.isArray(quest.optionalRequirements) ? quest.optionalRequirements : [];
        const collectedHtml = collectedRequirements.length > 0
            ? collectedRequirements.map((entry) => `
                <div class="artisan-check artisan-check--done">
                    <div class="artisan-check__title">${escapeHtml(entry.label || 'Требование')}</div>
                    <div class="artisan-check__value">${escapeHtml(entry.itemLabel || 'Подходящий предмет уже в сумке')}</div>
                </div>
            `).join('')
            : '<div class="artisan-check artisan-check--empty">Пока ни одно обязательное требование не закрыто.</div>';
        const missingHtml = missingRequirements.length > 0
            ? missingRequirements.map((entry) => `
                <div class="artisan-check artisan-check--missing">
                    <div class="artisan-check__title">${escapeHtml(entry.label || 'Требование')}</div>
                    <div class="artisan-check__value">${escapeHtml(Array.isArray(entry.tags) && entry.tags.length > 0 ? entry.tags.join(', ') : (entry.description || 'Нужен подходящий предмет'))}</div>
                </div>
            `).join('')
            : '<div class="artisan-check artisan-check--done">Все обязательные требования уже собраны.</div>';
        const optionalHtml = optionalRequirements.length > 0
            ? `
                <div class="artisan-quest__section">
                    <div class="artisan-quest__section-title">Дополнительно</div>
                    <div class="artisan-check-list">
                        ${optionalRequirements.map((entry) => `
                            <div class="artisan-check artisan-check--optional">
                                <div class="artisan-check__title">${escapeHtml(entry.label || 'Опция')}</div>
                                <div class="artisan-check__value">${escapeHtml(entry.itemLabel || entry.description || 'Можно усилить комплект ещё одним предметом')}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `
            : '';

        return `
            <div class="artisan-quest">
                <div class="artisan-quest__hero">
                    <div class="artisan-quest__slot">${escapeHtml(quest.slotUnlockLabel || `Откроется слот ${quest.targetSlots || '?'}`)}</div>
                    <div class="artisan-quest__meta">${escapeHtml(quest.slotProgressLabel || `Сумка ${quest.sourceSlots || '?'} → ${quest.targetSlots || '?'}`)}</div>
                    <div class="artisan-quest__meta">${escapeHtml([quest.occupancyStatusLabel || '', quest.requirementStatusLabel || ''].filter(Boolean).join(' · '))}</div>
                    ${quest.occupancyMissingLabel ? `<div class="artisan-quest__warning">${escapeHtml(quest.occupancyMissingLabel)}</div>` : ''}
                </div>
                ${categoryLabels.length > 0 ? `
                    <div class="artisan-pill-row">
                        ${categoryLabels.map((label) => `<span class="artisan-pill">${escapeHtml(label)}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="artisan-quest__grid">
                    <div class="artisan-quest__section">
                        <div class="artisan-quest__section-title">Собрано</div>
                        <div class="artisan-check-list">${collectedHtml}</div>
                    </div>
                    <div class="artisan-quest__section">
                        <div class="artisan-quest__section-title">Не хватает</div>
                        <div class="artisan-check-list">${missingHtml}</div>
                    </div>
                </div>
                ${optionalHtml}
            </div>
        `;
    }

    function buildArtisanQuestSection(quest, currentSlots, slotCap) {
        if (!quest) {
            return `
                <div class="merchant-section">
                    <h3 class="merchant-section__title">Заказ</h3>
                    <p class="panel-copy">Этот мастер пока не подготовил заказ на расширение сумки.</p>
                </div>
            `;
        }

        const rewardSlots = quest.rewardSlots || Math.max(1, (quest.targetSlots || currentSlots) - (quest.sourceSlots || currentSlots));
        const isReady = !quest.completed && quest.progressCurrent >= quest.progressRequired;
        return `
            <div class="merchant-section">
                <h3 class="merchant-section__title">Заказ ремесленника</h3>
                <div class="merchant-panel__description">
                    <div class="merchant-row__title">${escapeHtml(quest.label || 'Расширение сумки')}</div>
                    <p class="panel-copy">${escapeHtml(quest.description || '')}</p>
                    <div class="merchant-row__note">Сумка: ${quest.sourceSlots || currentSlots} → ${quest.targetSlots || currentSlots}</div>
                    <div class="merchant-row__note">Занято слотов: ${quest.occupiedSlots || 0}/${quest.requiredOccupiedSlots || 0} · Прогресс: ${quest.progressCurrent || 0}/${quest.progressRequired || 0}</div>
                    <div class="merchant-row__note">Награда: +${rewardSlots} слот · текущая сумка ${currentSlots}/${slotCap}</div>
                    ${Number.isFinite(quest.deadlineIslandIndex) ? `<div class="merchant-row__note">Сдать до острова ${quest.deadlineIslandIndex}</div>` : ''}
                    ${buildArtisanQuestVisual(quest)}
                </div>
                <div class="merchant-row">
                    <div class="merchant-row__meta"></div>
                    <div class="merchant-row__actions">
                        <button class="hud-button" type="button" data-merchant-action="quest" ${quest.completed || !isReady ? 'disabled' : ''}>${quest.completed ? 'Готово' : 'Сдать комплект'}</button>
                    </div>
                </div>
            </div>
        `;
    }

    function buildStockSection(encounter, selectedItemId) {
        const stockRows = Array.isArray(encounter.stock)
            ? encounter.stock.map((stockItem, index) => {
                const soldOut = !stockItem || stockItem.quantity <= 0;

                return `
                    <div class="merchant-row">
                        <div class="merchant-row__meta">
                            <button class="merchant-link${selectedItemId === stockItem.itemId ? ' merchant-link--selected' : ''}" type="button" data-merchant-action="describe" data-item-id="${stockItem.itemId}">
                                ${escapeHtml(stockItem.label)} ${soldOut ? '(нет)' : ''}
                            </button>
                            <div class="merchant-row__note">Цена: ${stockItem.price} золота · Осталось: ${Math.max(0, stockItem.quantity || 0)}</div>
                        </div>
                        <div class="merchant-row__actions">
                            <button class="hud-button" type="button" data-merchant-action="buy" data-stock-index="${index}" ${soldOut ? 'disabled' : ''}>Купить</button>
                        </div>
                    </div>
                `;
            }).join('')
            : '';

        return `
            <div class="merchant-section">
                <h3 class="merchant-section__title">Купить</h3>
                ${stockRows || '<p class="panel-copy">У торговца всё распродано.</p>'}
            </div>
        `;
    }

    function buildSellSection(encounter, selectedItemId, inventoryRuntime, pricing) {
        const sellRows = inventoryRuntime.getInventory()
            .slice(0, inventoryRuntime.getUnlockedInventorySlots())
            .map((item, index) => {
                const normalizedItem = inventoryRuntime.normalizeInventoryItem(item);

                if (!normalizedItem) {
                    return '';
                }

                const sellPrice = pricing && typeof pricing.getMerchantSellPrice === 'function'
                    ? pricing.getMerchantSellPrice(normalizedItem.id, encounter.islandIndex || game.state.currentIslandIndex)
                    : 1;

                return `
                    <div class="merchant-row">
                        <div class="merchant-row__meta">
                            <button class="merchant-link${selectedItemId === normalizedItem.id ? ' merchant-link--selected' : ''}" type="button" data-merchant-action="describe" data-item-id="${normalizedItem.id}">
                                ${escapeHtml(normalizedItem.label)}
                            </button>
                            <div class="merchant-row__note">В рюкзаке: ${formatQuantityLabel(Math.max(1, normalizedItem.quantity || 1))} · Цена продажи: ${sellPrice}</div>
                        </div>
                        <div class="merchant-row__actions">
                            <button class="hud-button" type="button" data-merchant-action="sell" data-inventory-index="${index}">Продать</button>
                        </div>
                    </div>
                `;
            })
            .filter(Boolean)
            .join('');

        return `
            <div class="merchant-section">
                <h3 class="merchant-section__title">Продать</h3>
                ${sellRows || '<p class="panel-copy">В рюкзаке нет товаров на продажу.</p>'}
            </div>
        `;
    }

    function buildArtisanInventorySection(selectedItemId, inventoryRuntime) {
        const rows = inventoryRuntime.getInventory()
            .slice(0, inventoryRuntime.getUnlockedInventorySlots())
            .map((item) => inventoryRuntime.normalizeInventoryItem(item))
            .filter(Boolean)
            .map((item) => `
                <div class="merchant-row">
                    <div class="merchant-row__meta">
                        <button class="merchant-link${selectedItemId === item.id ? ' merchant-link--selected' : ''}" type="button" data-merchant-action="describe" data-item-id="${item.id}">
                            ${escapeHtml(item.label)}
                        </button>
                        <div class="merchant-row__note">В сумке: ${formatQuantityLabel(Math.max(1, item.quantity || 1))}</div>
                    </div>
                </div>
            `)
            .join('');

        return `
            <div class="merchant-section">
                <h3 class="merchant-section__title">Текущая сумка</h3>
                ${rows || '<p class="panel-copy">Сумка пока пуста.</p>'}
            </div>
        `;
    }

    function renderMerchantPanel(activeInteraction = game.state.activeInteraction) {
        const elements = bridge.getElements();
        const inventoryRuntime = getInventoryRuntime();
        const pricing = getPricingSystem();
        const shopRuntime = getShopRuntime();
        const bagUpgradeRuntime = getBagUpgradeRuntime();

        if (!elements.merchantPanel || !elements.merchantPanelContent || !inventoryRuntime) {
            return;
        }

        const source = getOpenMerchantSource(activeInteraction);

        if (!source || game.state.isMoving || game.state.isPaused || game.state.isGameOver) {
            closeMerchantPanel();
            return;
        }

        const encounter = getEncounterForSource(source);
        if (!encounter) {
            closeMerchantPanel();
            return;
        }

        const liveEncounter = encounter.kind === 'merchant'
            && shopRuntime
            && typeof shopRuntime.prepareMerchantEncounter === 'function'
            ? (shopRuntime.prepareMerchantEncounter(source) || encounter)
            : encounter;
        const quest = getEncounterQuest(source, liveEncounter);
        const selectedDescription = getMerchantDescriptionState(source, liveEncounter);
        const selectedItemId = selectedDescription ? selectedDescription.itemId : null;
        const currentSlots = inventoryRuntime.getUnlockedInventorySlots();
        const slotCap = bagUpgradeRuntime && typeof bagUpgradeRuntime.getBagSlotCap === 'function'
            ? bagUpgradeRuntime.getBagSlotCap()
            : 10;

        elements.merchantPanel.hidden = false;
        elements.merchantPanelTitle.textContent = liveEncounter.label || (liveEncounter.kind === 'artisan' ? 'Ремесленник' : 'Торговец');
        elements.merchantPanelSummary.textContent = liveEncounter.summary || '';
        elements.merchantPanelGold.textContent = liveEncounter.kind === 'artisan'
            ? `Слоты сумки: ${currentSlots}/${slotCap}`
            : `Твоё золото: ${bridge.getGold()}`;

        if (liveEncounter.kind === 'artisan') {
            elements.merchantPanelContent.innerHTML = `
                ${buildDescriptionSection(selectedDescription)}
                ${buildArtisanQuestSection(quest, currentSlots, slotCap)}
                ${buildArtisanInventorySection(selectedItemId, inventoryRuntime)}
            `;
            return;
        }

        elements.merchantPanelContent.innerHTML = `
            ${buildDescriptionSection(selectedDescription)}
            ${buildMerchantQuestSection(quest, selectedItemId, inventoryRuntime)}
            ${buildStockSection(liveEncounter, selectedItemId)}
            ${buildSellSection(liveEncounter, selectedItemId, inventoryRuntime, pricing)}
        `;
    }

    function openMerchantPanel(source, options = {}) {
        const encounter = getEncounterForSource(source);
        const ui = getUiState();
        const shopRuntime = getShopRuntime();
        const questRuntime = getQuestRuntime();

        if (!source || !encounter) {
            if (!options.silent) {
                bridge.setActionMessage('Рядом нет торговца или ремесленника.');
                bridge.renderAfterStateChange();
            }
            return false;
        }

        if (encounter.kind === 'merchant' && shopRuntime && typeof shopRuntime.prepareMerchantEncounter === 'function') {
            shopRuntime.prepareMerchantEncounter(source);
        }

        if (encounter.kind === 'artisan' && encounter.quest && questRuntime && typeof questRuntime.acceptQuest === 'function') {
            questRuntime.acceptQuest(source, encounter.quest);
            questRuntime.getQuestProgress(source, encounter.quest);
        }

        ui.openMerchantHouseId = source.houseId;

        if (!options.silent) {
            bridge.setActionMessage(
                encounter.kind === 'artisan'
                    ? `${encounter.label}: открыт заказ на расширение сумки.`
                    : `${encounter.label}: открыто меню торговли.`
            );
            bridge.renderAfterStateChange();
        }

        return true;
    }

    function completeEncounterQuest(source) {
        const encounter = getEncounterForSource(source);
        const questRuntime = getQuestRuntime();
        const shopRuntime = getShopRuntime();

        if (!encounter) {
            applyPanelOutcome(null, 'Рядом нет активного задания.');
            return;
        }

        if (encounter.kind === 'merchant' && shopRuntime && typeof shopRuntime.completeMerchantQuest === 'function') {
            applyPanelOutcome(
                shopRuntime.completeMerchantQuest(source),
                'У этого торговца нет незавершённого квеста.'
            );
            return;
        }

        if (!questRuntime || typeof questRuntime.completeQuest !== 'function') {
            applyPanelOutcome(null, 'Сдать этот заказ сейчас нельзя.');
            return;
        }

        const quest = getEncounterQuest(source, encounter);
        const result = questRuntime.completeQuest(source, quest, { consumeItems: true });

        applyPanelOutcome(
            result && result.success
                ? {
                    ...result,
                    message: result.quest && result.quest.completedMessage
                        ? result.quest.completedMessage
                        : `Заказ выполнен. Сумка расширена до ${result.quest && result.quest.unlockedSlots ? result.quest.unlockedSlots : game.state.unlockedInventorySlots} слотов.`
                }
                : result,
            'Сдать этот заказ сейчас нельзя.'
        );
    }

    function buyMerchantStock(source, stockIndex) {
        const shopRuntime = getShopRuntime();

        if (shopRuntime && typeof shopRuntime.buyMerchantStock === 'function') {
            applyPanelOutcome(
                shopRuntime.buyMerchantStock(source, stockIndex),
                'Этот товар уже закончился.'
            );
            return;
        }

        applyPanelOutcome(null, 'Этот товар уже закончился.');
    }

    function sellInventoryItemToMerchant(source, inventoryIndex) {
        const shopRuntime = getShopRuntime();

        if (shopRuntime && typeof shopRuntime.sellInventoryItemToMerchant === 'function') {
            applyPanelOutcome(
                shopRuntime.sellInventoryItemToMerchant(source, inventoryIndex),
                'Продать этот предмет сейчас нельзя.'
            );
            return;
        }

        applyPanelOutcome(null, 'Продать этот предмет сейчас нельзя.');
    }

    function handleMerchantPanelClick(event) {
        const button = event.target.closest('[data-merchant-action]');

        if (!button || button.disabled) {
            return;
        }

        const source = getOpenMerchantSource();
        const ui = getUiState();

        if (!source) {
            closeMerchantPanel();
            bridge.renderAfterStateChange();
            return;
        }

        const action = button.getAttribute('data-merchant-action');

        if (action === 'describe') {
            const itemId = button.getAttribute('data-item-id');

            if (itemId && source.houseId) {
                ui.merchantDescriptionByHouseId[source.houseId] = itemId;
            }

            bridge.renderAfterStateChange();
            return;
        }

        if (action === 'quest') {
            completeEncounterQuest(source);
            return;
        }

        if (action === 'buy') {
            buyMerchantStock(source, Number(button.getAttribute('data-stock-index')));
            return;
        }

        if (action === 'sell') {
            sellInventoryItemToMerchant(source, Number(button.getAttribute('data-inventory-index')));
        }
    }

    Object.assign(merchantUi, {
        persistMerchantState,
        closeMerchantPanel,
        getOpenMerchantSource,
        escapeHtml,
        formatQuantityLabel,
        getMerchantInspectableItems,
        getMerchantDescriptionState,
        renderMerchantPanel,
        openMerchantPanel,
        handleMerchantPanelClick
    });
})();
