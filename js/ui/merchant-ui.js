(() => {
    const game = window.Game;
    const merchantUi = game.systems.merchantUi = game.systems.merchantUi || {};
    const bridge = game.systems.uiBridge;
    let lastMerchantPanelSignature = null;

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

    function getCourierRuntime() {
        return game.systems.courierRuntime || null;
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
        return Boolean(encounter && (
            encounter.kind === 'merchant'
            || encounter.kind === 'craft_merchant'
            || encounter.kind === 'artisan'
        ));
    }

    function isCraftMerchantEncounter(encounter) {
        return Boolean(encounter && (
            encounter.kind === 'craft_merchant'
            || encounter.kind === 'artisan'
        ));
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
        lastMerchantPanelSignature = null;

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

    function buildCourierEtaLabel(returnAdvanceCount) {
        const courierRuntime = getCourierRuntime();
        const currentAdvanceCount = courierRuntime && typeof courierRuntime.getCurrentTimeAdvanceCount === 'function'
            ? courierRuntime.getCurrentTimeAdvanceCount()
            : 0;
        const remainingAdvances = Math.max(0, Math.round((returnAdvanceCount || 0) - currentAdvanceCount));

        return courierRuntime && typeof courierRuntime.formatCourierEtaFromRemainingAdvances === 'function'
            ? courierRuntime.formatCourierEtaFromRemainingAdvances(remainingAdvances)
            : '';
    }

    function getQuestRewardItemLabel(quest, options = {}) {
        const useDeliveredReward = Boolean(options.delivered);
        const itemLabel = useDeliveredReward
            ? (quest && quest.deliveredRewardItemLabel ? quest.deliveredRewardItemLabel : '')
            : (quest && quest.rewardItemLabel ? quest.rewardItemLabel : '');
        const itemQuantity = Math.max(
            0,
            Math.round(
                useDeliveredReward
                    ? (quest && quest.deliveredRewardItemQuantity ? quest.deliveredRewardItemQuantity : 0)
                    : (quest && quest.rewardItemQuantity ? quest.rewardItemQuantity : 0)
            )
        );

        if (!itemLabel || itemQuantity <= 0) {
            return '';
        }

        return itemQuantity > 1 ? `${itemLabel} x${itemQuantity}` : itemLabel;
    }

    function getQuestRewardSummary(quest, options = {}) {
        const useDeliveredReward = Boolean(options.delivered);
        const goldAmount = Math.max(
            0,
            Math.round(
                useDeliveredReward
                    ? (quest && quest.deliveredRewardGold ? quest.deliveredRewardGold : 0)
                    : (quest && quest.rewardGold ? quest.rewardGold : 0)
            )
        );
        const rewardParts = [`${goldAmount} золота`];
        const rewardItemLabel = getQuestRewardItemLabel(quest, options);

        if (rewardItemLabel) {
            rewardParts.push(rewardItemLabel);
        }

        return rewardParts.join(' + ');
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
        const isCourierInTransit = quest.courierStatus === 'inTransit';
        const courierEtaLabel = isCourierInTransit ? buildCourierEtaLabel(quest.courierReturnAdvanceCount) : '';
        const courierStatusRows = [];
        const rewardSummary = getQuestRewardSummary(quest);
        const deliveredRewardSummary = getQuestRewardSummary(quest, { delivered: true });
        const progressLine = isCourierInTransit
            ? `Груз у курьера · Награда: ${rewardSummary}`
            : (quest.courierStatus === 'resolved'
                ? `Сдано курьером · фактически получено: ${deliveredRewardSummary}`
                : `В сумке: ${ownedQuestItems}/${quest.quantity} · Награда: ${rewardSummary}`);

        if (isCourierInTransit) {
            courierStatusRows.push(
                `<div class="merchant-row__note merchant-row__note--accent">Груз уже передан курьеру "${escapeHtml(quest.courierTierLabel || 'курьер')}" ${courierEtaLabel ? `· ${escapeHtml(courierEtaLabel)}` : ''}</div>`
            );
        } else if (quest.courierStatus === 'resolved' && quest.courierResultLabel) {
            courierStatusRows.push(`<div class="merchant-row__note merchant-row__note--accent">${escapeHtml(quest.courierResultLabel)}</div>`);
        }

        return `
            <div class="merchant-section">
                <h3 class="merchant-section__title">Квест</h3>
                <div class="merchant-row">
                    <div class="merchant-row__meta">
                        <button class="merchant-link${selectedItemId === quest.itemId ? ' merchant-link--selected' : ''}" type="button" data-merchant-action="describe" data-item-id="${quest.itemId}">
                            ${escapeHtml(quest.label)} ${quest.quantity > 1 ? `x${quest.quantity}` : ''}
                        </button>
                        <div class="merchant-row__note">${escapeHtml(quest.description || '')}</div>
                        <div class="merchant-row__note">${progressLine}</div>
                        ${courierStatusRows.join('')}
                    </div>
                    <div class="merchant-row__actions">
                        <button class="hud-button" type="button" data-merchant-action="quest" ${quest.completed || isCourierInTransit || ownedQuestItems < quest.quantity ? 'disabled' : ''}>${quest.completed ? 'Сдано' : (isCourierInTransit ? 'Курьер в пути' : 'Сдать')}</button>
                    </div>
                </div>
            </div>
        `;
    }

    function buildMerchantAdviceSection(encounter, currentGold = 0) {
        const advice = encounter && encounter.advice ? encounter.advice : null;

        if (!advice) {
            return '';
        }

        const price = Math.max(0, Math.round(advice.price || 0));
        const infoLine = advice.purchased
            ? 'Совет уже открыт.'
            : `Цена: ${price} золота · у тебя: ${Math.max(0, Math.round(currentGold || 0))}`;

        return `
            <div class="merchant-section">
                <h3 class="merchant-section__title">Совет</h3>
                <div class="merchant-row">
                    <div class="merchant-row__meta">
                        <div class="merchant-row__title">${escapeHtml(advice.title || 'Секрет прохождения')}</div>
                        <div class="merchant-row__note">${escapeHtml(advice.purchased ? (advice.text || '') : (advice.hook || 'Платный совет о прохождении.'))}</div>
                        <div class="merchant-row__note${advice.purchased ? ' merchant-row__note--accent' : ''}">${escapeHtml(infoLine)}</div>
                    </div>
                    <div class="merchant-row__actions">
                        <button class="hud-button" type="button" data-merchant-action="advice" ${advice.purchased ? 'disabled' : ''}>${advice.purchased ? 'Открыто' : 'Купить совет'}</button>
                    </div>
                </div>
            </div>
        `;
    }

    function buildCourierQuestRow(quest) {
        const tierButtons = Array.isArray(quest.courierTiers)
            ? quest.courierTiers.map((tier) => `
                <button
                    class="hud-button merchant-courier-tier"
                    type="button"
                    data-merchant-action="courier"
                    data-quest-id="${escapeHtml(quest.questId)}"
                    data-courier-tier="${escapeHtml(tier.id)}"
                    ${tier.disabled ? `disabled title="${escapeHtml(tier.disabledReason)}"` : ''}
                >
                    ${escapeHtml(tier.label)} · ${tier.fee}з
                </button>
            `).join('')
            : '';

        return `
            <div class="merchant-courier-card">
                <div class="merchant-row__title">${escapeHtml(quest.sourceLabel || 'Квестодатель')} · остров ${quest.sourceIslandIndex || '?'}</div>
                <div class="merchant-row__note">Отправка: ${escapeHtml(quest.label || 'Груз')} x${quest.progressRequired || quest.quantity || 1} · в сумке ${quest.ownedAmount}/${quest.progressRequired || quest.quantity || 1}</div>
                <div class="merchant-row__note">Полная награда: ${escapeHtml(getQuestRewardSummary(quest))} · дистанция доставки: ${quest.deliveryDistance} остров.</div>
                <div class="merchant-courier-tier-list">${tierButtons}</div>
                <div class="merchant-courier-risk-list">
                    ${(quest.courierTiers || []).map((tier) => `
                        <div class="merchant-row__note">${escapeHtml(tier.label)}: при отходе на 1-2 острова шанс урезания до 50% = ${tier.partialRewardChancePercent}%</div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function buildCourierJobRow(job) {
        return `
            <div class="merchant-row">
                <div class="merchant-row__meta">
                    <div class="merchant-row__title">${escapeHtml(job.questLabel || 'Поручение')}</div>
                    <div class="merchant-row__note">Курьер: ${escapeHtml(job.tierLabel || 'Курьер')} · к ${escapeHtml(job.targetSourceLabel || 'квестодателю')}</div>
                    <div class="merchant-row__note">Остров найма: ${job.hireIslandIndex || '?'} · доставка: ${job.deliveryDistance} остров. · ${escapeHtml(job.etaLabel || '')}</div>
                </div>
            </div>
        `;
    }

    function buildCourierResultRow(result) {
        const resultLabel = result.resultCode === 'lost'
            ? 'Награды нет'
            : (result.resultCode === 'partial'
                ? `Получено ${result.deliveredRewardGold || 0} золота (50%)`
                : `Получено ${result.deliveredRewardGold || 0} золота`);
        const rewardItemLabel = getQuestRewardItemLabel(result, { delivered: true });

        return `
            <div class="merchant-row">
                <div class="merchant-row__meta">
                    <div class="merchant-row__title">${escapeHtml(result.questLabel || 'Поручение')}</div>
                    <div class="merchant-row__note">${escapeHtml(result.targetSourceLabel || 'Квестодатель')} · ${escapeHtml(result.tierLabel || 'Курьер')}</div>
                    <div class="merchant-row__note merchant-row__note--accent">${escapeHtml(resultLabel)}</div>
                    ${rewardItemLabel ? `<div class="merchant-row__note merchant-row__note--accent">${escapeHtml(result.deliveredRewardItemDropped ? `Редкий бонус лежит под ногами: ${rewardItemLabel}` : `Редкий бонус: ${rewardItemLabel}`)}</div>` : ''}
                </div>
            </div>
        `;
    }

    function buildCourierSection(source) {
        const courierRuntime = getCourierRuntime();

        if (!courierRuntime || typeof courierRuntime.getMerchantCourierDashboard !== 'function') {
            return '';
        }

        const dashboard = courierRuntime.getMerchantCourierDashboard(source);
        const eligibleQuests = Array.isArray(dashboard.eligibleQuests) ? dashboard.eligibleQuests : [];
        const activeJobs = Array.isArray(dashboard.activeJobs) ? dashboard.activeJobs : [];
        const recentResults = Array.isArray(dashboard.recentResults) ? dashboard.recentResults : [];
        const activeJobsSection = activeJobs.length > 0 ? `
            <div class="merchant-subsection">
                <div class="merchant-subsection__title">В пути</div>
                ${activeJobs.map((job) => buildCourierJobRow(job)).join('')}
            </div>
        ` : '';
        const eligibleQuestsSection = eligibleQuests.length > 0 ? `
            <div class="merchant-subsection">
                <div class="merchant-subsection__title">Отправить сейчас</div>
                <div class="merchant-courier-list">
                    ${eligibleQuests.map((quest) => buildCourierQuestRow(quest)).join('')}
                </div>
            </div>
        ` : '';
        const recentResultsSection = recentResults.length > 0 ? `
            <div class="merchant-subsection">
                <div class="merchant-subsection__title">Последние возвраты</div>
                ${recentResults.map((result) => buildCourierResultRow(result)).join('')}
            </div>
        ` : '';

        return `
            <div class="merchant-section">
                <h3 class="merchant-section__title">Курьер</h3>
                ${activeJobsSection}
                ${eligibleQuestsSection}
                ${recentResultsSection}
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
        const categoryLabels = Array.isArray(quest.slotQuestFocusLabels) && quest.slotQuestFocusLabels.length > 0
            ? quest.slotQuestFocusLabels
            : (Array.isArray(quest.questCategoryLabels) ? quest.questCategoryLabels : []);
        const collectedRequirements = Array.isArray(quest.collectedRequirements) ? quest.collectedRequirements : [];
        const missingRequirements = Array.isArray(quest.missingRequirements) ? quest.missingRequirements : [];
        const optionalRequirements = Array.isArray(quest.optionalRequirements) ? quest.optionalRequirements : [];
        const collectedHtml = collectedRequirements.length > 0
            ? collectedRequirements.map((entry) => `
                <div class="artisan-check artisan-check--done">
                    <div class="artisan-check__title">${escapeHtml(entry.label || 'Требование')}</div>
                    <div class="artisan-check__value">${escapeHtml(entry.valueLabel || entry.itemLabel || 'Подходящий предмет уже в сумке')}</div>
                </div>
            `).join('')
            : '<div class="artisan-check artisan-check--empty">Пока ни одно обязательное требование не закрыто.</div>';
        const missingHtml = missingRequirements.length > 0
            ? missingRequirements.map((entry) => `
                <div class="artisan-check artisan-check--missing">
                    <div class="artisan-check__title">${escapeHtml(entry.label || 'Требование')}</div>
                    <div class="artisan-check__value">${escapeHtml(entry.valueLabel || (entry.description || 'Нужен подходящий предмет'))}</div>
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
                                <div class="artisan-check__value">${escapeHtml(entry.valueLabel || entry.itemLabel || entry.description || 'Можно усилить комплект ещё одним предметом')}</div>
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
                    <div class="artisan-quest__meta">${escapeHtml(quest.progressHeadline || quest.slotProgressLabel || `Сумка ${quest.sourceSlots || '?'} → ${quest.targetSlots || '?'}`)}</div>
                    ${quest.unlockPreviewLabel ? `<div class="artisan-quest__meta">${escapeHtml(quest.unlockPreviewLabel)}</div>` : ''}
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
                ${quest.generationHintLabel ? `<div class="merchant-row__note">${escapeHtml(quest.generationHintLabel)}</div>` : ''}
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
                    <div class="merchant-row__note">${escapeHtml(quest.progressHeadline || `Сумка: ${quest.sourceSlots || currentSlots} → ${quest.targetSlots || currentSlots}`)}</div>
                    ${quest.requirementStatusLabel ? `<div class="merchant-row__note">${escapeHtml(quest.requirementStatusLabel)}</div>` : ''}
                    <div class="merchant-row__note">Награда: +${rewardSlots} слот · текущая сумка ${currentSlots}/${slotCap}</div>
                    ${quest.unlockPreviewLabel ? `<div class="merchant-row__note">${escapeHtml(quest.unlockPreviewLabel)}</div>` : ''}
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

    function buildSellSection(encounter, selectedItemId, inventoryRuntime, pricing, shopRuntime) {
        const sellRows = inventoryRuntime.getInventory()
            .slice(0, inventoryRuntime.getUnlockedInventorySlots())
            .map((item, index) => {
                const normalizedItem = inventoryRuntime.normalizeInventoryItem(item);

                if (!normalizedItem) {
                    return '';
                }

                const sellOffer = shopRuntime && typeof shopRuntime.getMerchantSellOffer === 'function'
                    ? shopRuntime.getMerchantSellOffer(encounter, normalizedItem.id)
                    : null;
                const sellPrice = sellOffer && sellOffer.accepted
                    ? sellOffer.price
                    : (pricing && typeof pricing.getMerchantSellPrice === 'function'
                        ? pricing.getMerchantSellPrice(normalizedItem.id, encounter.islandIndex || game.state.currentIslandIndex)
                        : 1);
                const sellNote = sellOffer && sellOffer.isComponent
                    ? (sellOffer.accepted
                        ? `В рюкзаке: ${formatQuantityLabel(Math.max(1, normalizedItem.quantity || 1))} · Интерес к заготовке · Цена продажи: ${sellPrice}`
                        : `В рюкзаке: ${formatQuantityLabel(Math.max(1, normalizedItem.quantity || 1))} · ${sellOffer.message || 'Этого торговца такая заготовка не интересует.'}`)
                    : `В рюкзаке: ${formatQuantityLabel(Math.max(1, normalizedItem.quantity || 1))} · Цена продажи: ${sellPrice}`;

                return `
                    <div class="merchant-row">
                        <div class="merchant-row__meta">
                            <button class="merchant-link${selectedItemId === normalizedItem.id ? ' merchant-link--selected' : ''}" type="button" data-merchant-action="describe" data-item-id="${normalizedItem.id}">
                                ${escapeHtml(normalizedItem.label)}
                            </button>
                            <div class="merchant-row__note">${escapeHtml(sellNote)}</div>
                        </div>
                        <div class="merchant-row__actions">
                            <button class="hud-button" type="button" data-merchant-action="sell" data-inventory-index="${index}" ${sellOffer && !sellOffer.accepted ? 'disabled' : ''}>Продать</button>
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

    function buildMerchantInventorySignature(inventoryRuntime) {
        return inventoryRuntime.getInventory()
            .slice(0, inventoryRuntime.getUnlockedInventorySlots())
            .map((item) => inventoryRuntime.normalizeInventoryItem(item))
            .filter(Boolean)
            .map((item) => `${item.id}:${Math.max(1, item.quantity || 1)}`)
            .join('|');
    }

    function buildMerchantPanelSignature(source, liveEncounter, quest, selectedItemId, currentGold, currentSlots, slotCap, inventoryRuntime) {
        const courierRuntime = getCourierRuntime();
        const currentAdvanceCount = courierRuntime && typeof courierRuntime.getCurrentTimeAdvanceCount === 'function'
            ? courierRuntime.getCurrentTimeAdvanceCount()
            : 0;
        const courierDashboard = courierRuntime && typeof courierRuntime.getMerchantCourierDashboard === 'function'
            ? courierRuntime.getMerchantCourierDashboard(source)
            : null;

        return JSON.stringify({
            houseId: source && source.houseId ? source.houseId : 'none',
            encounter: {
                kind: liveEncounter ? liveEncounter.kind : 'none',
                label: liveEncounter && liveEncounter.label ? liveEncounter.label : '',
                summary: liveEncounter && liveEncounter.summary ? liveEncounter.summary : '',
                islandIndex: liveEncounter && Number.isFinite(liveEncounter.islandIndex) ? liveEncounter.islandIndex : 0,
                stock: Array.isArray(liveEncounter && liveEncounter.stock)
                    ? liveEncounter.stock.map((stockItem) => ({
                        itemId: stockItem.itemId,
                        label: stockItem.label,
                        price: stockItem.price,
                        quantity: stockItem.quantity
                    }))
                    : [],
                adviceOffers: Array.isArray(liveEncounter && liveEncounter.adviceOffers)
                    ? liveEncounter.adviceOffers.map((offer) => ({
                        id: offer.id,
                        purchased: Boolean(offer.purchased),
                        price: offer.price,
                        title: offer.title,
                        text: offer.text,
                        hook: offer.hook,
                        islandWindowLabel: offer.islandWindowLabel
                    }))
                    : []
            },
            quest: quest ? {
                questId: quest.questId || '',
                label: quest.label || '',
                completed: Boolean(quest.completed),
                quantity: quest.quantity || 0,
                ownedAmount: quest.ownedAmount || 0,
                rewardGold: quest.rewardGold || 0,
                rewardItemLabel: quest.rewardItemLabel || '',
                rewardItemQuantity: quest.rewardItemQuantity || 0,
                progressCurrent: quest.progressCurrent || 0,
                progressRequired: quest.progressRequired || 0,
                progressHeadline: quest.progressHeadline || '',
                requirementStatusLabel: quest.requirementStatusLabel || '',
                unlockPreviewLabel: quest.unlockPreviewLabel || '',
                courierStatus: quest.courierStatus || '',
                courierReturnAdvanceCount: quest.courierReturnAdvanceCount || 0,
                courierResultLabel: quest.courierResultLabel || '',
                courierTierLabel: quest.courierTierLabel || '',
                courierTiers: Array.isArray(quest.courierTiers)
                    ? quest.courierTiers.map((tier) => ({
                        id: tier.id,
                        fee: tier.fee,
                        disabled: Boolean(tier.disabled),
                        disabledReason: tier.disabledReason || ''
                    }))
                    : []
            } : null,
            selectedItemId: selectedItemId || '',
            currentGold,
            currentSlots,
            slotCap,
            currentAdvanceCount,
            courierDashboard: courierDashboard ? {
                eligibleQuests: Array.isArray(courierDashboard.eligibleQuests)
                    ? courierDashboard.eligibleQuests.map((eligibleQuest) => ({
                        questId: eligibleQuest.questId,
                        progressRequired: eligibleQuest.progressRequired,
                        ownedAmount: eligibleQuest.ownedAmount,
                        courierStatus: eligibleQuest.courierStatus || '',
                        courierReturnAdvanceCount: eligibleQuest.courierReturnAdvanceCount || 0
                    }))
                    : [],
                activeJobs: Array.isArray(courierDashboard.activeJobs)
                    ? courierDashboard.activeJobs.map((job) => ({
                        jobId: job.jobId,
                        etaLabel: job.etaLabel || '',
                        questLabel: job.questLabel || '',
                        targetSourceLabel: job.targetSourceLabel || '',
                        returnAdvanceCount: job.returnAdvanceCount || 0
                    }))
                    : [],
                recentResults: Array.isArray(courierDashboard.recentResults)
                    ? courierDashboard.recentResults.map((result) => ({
                        resultId: result.resultId,
                        resultCode: result.resultCode || '',
                        deliveredRewardGold: result.deliveredRewardGold || 0,
                        deliveredRewardItemId: result.deliveredRewardItemId || '',
                        deliveredRewardItemQuantity: result.deliveredRewardItemQuantity || 0
                    }))
                    : []
            } : null,
            inventory: buildMerchantInventorySignature(inventoryRuntime)
        });
    }

    function buildMerchantPanelContent(source, liveEncounter, quest, selectedDescription, selectedItemId, currentGold, currentSlots, slotCap, inventoryRuntime, pricing, shopRuntime) {
        if (isCraftMerchantEncounter(liveEncounter)) {
            return `
                ${buildDescriptionSection(selectedDescription)}
                ${buildArtisanQuestSection(quest, currentSlots, slotCap)}
                ${buildArtisanInventorySection(selectedItemId, inventoryRuntime)}
            `;
        }

        return `
            ${buildDescriptionSection(selectedDescription)}
            ${buildMerchantAdviceSection(liveEncounter, currentGold)}
            ${buildMerchantQuestSection(quest, selectedItemId, inventoryRuntime)}
            ${buildCourierSection(source)}
            ${buildStockSection(liveEncounter, selectedItemId)}
            ${buildSellSection(liveEncounter, selectedItemId, inventoryRuntime, pricing, shopRuntime)}
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
        const currentGold = bridge.getGold();
        const slotCap = bagUpgradeRuntime && typeof bagUpgradeRuntime.getBagSlotCap === 'function'
            ? bagUpgradeRuntime.getBagSlotCap()
            : 10;
        const panelSignature = buildMerchantPanelSignature(
            source,
            liveEncounter,
            quest,
            selectedItemId,
            currentGold,
            currentSlots,
            slotCap,
            inventoryRuntime
        );

        elements.merchantPanel.hidden = false;
        elements.merchantPanelTitle.textContent = liveEncounter.label || (isCraftMerchantEncounter(liveEncounter) ? 'Ремесленный торговец' : 'Торговец');
        elements.merchantPanelSummary.textContent = liveEncounter.summary || '';
        elements.merchantPanelGold.textContent = isCraftMerchantEncounter(liveEncounter)
            ? `Слоты сумки: ${currentSlots}/${slotCap}`
            : `Твоё золото: ${currentGold}`;

        if (panelSignature === lastMerchantPanelSignature) {
            return;
        }

        elements.merchantPanelContent.innerHTML = buildMerchantPanelContent(
            source,
            liveEncounter,
            quest,
            selectedDescription,
            selectedItemId,
            currentGold,
            currentSlots,
            slotCap,
            inventoryRuntime,
            pricing,
            shopRuntime
        );
        lastMerchantPanelSignature = panelSignature;
    }

    function openMerchantPanel(source, options = {}) {
        const encounter = getEncounterForSource(source);
        const ui = getUiState();
        const shopRuntime = getShopRuntime();
        const questRuntime = getQuestRuntime();

        if (!source || !encounter) {
            if (!options.silent) {
                bridge.setActionMessage('Рядом нет торговца или ремесленной станции.');
                bridge.renderAfterStateChange();
            }
            return false;
        }

        if (encounter.kind === 'merchant' && shopRuntime && typeof shopRuntime.prepareMerchantEncounter === 'function') {
            shopRuntime.prepareMerchantEncounter(source);
        }

        if (isCraftMerchantEncounter(encounter) && encounter.quest && questRuntime && typeof questRuntime.acceptQuest === 'function') {
            questRuntime.acceptQuest(source, encounter.quest);
            questRuntime.getQuestProgress(source, encounter.quest);
        }

        ui.openMerchantHouseId = source.houseId;

        if (!options.silent) {
            bridge.setActionMessage(
                isCraftMerchantEncounter(encounter)
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

    function buyMerchantAdvice(source) {
        const shopRuntime = getShopRuntime();

        if (shopRuntime && typeof shopRuntime.buyMerchantAdvice === 'function') {
            applyPanelOutcome(
                shopRuntime.buyMerchantAdvice(source),
                'У этого торговца сейчас нет совета.'
            );
            return;
        }

        applyPanelOutcome(null, 'У этого торговца сейчас нет совета.');
    }

    function hireCourierForQuest(source, questId, tierId) {
        const courierRuntime = getCourierRuntime();

        if (courierRuntime && typeof courierRuntime.hireCourier === 'function') {
            applyPanelOutcome(
                courierRuntime.hireCourier(source, questId, tierId),
                'Нанять курьера сейчас нельзя.'
            );
            return;
        }

        applyPanelOutcome(null, 'Нанять курьера сейчас нельзя.');
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
            return;
        }

        if (action === 'advice') {
            buyMerchantAdvice(source);
            return;
        }

        if (action === 'courier') {
            hireCourierForQuest(
                source,
                button.getAttribute('data-quest-id'),
                button.getAttribute('data-courier-tier')
            );
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
