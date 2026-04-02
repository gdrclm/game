(() => {
    const game = window.Game;
    const actionUi = game.systems.actionUi = game.systems.actionUi || {};
    const bridge = game.systems.uiBridge;

    if (!bridge) {
        return;
    }

    function getInventoryRuntime() {
        return game.systems.inventoryRuntime || null;
    }

    function getItemEffects() {
        return game.systems.itemEffects || null;
    }

    function getDialogueRuntime() {
        return game.systems.dialogueRuntime || null;
    }

    function getHarvestedTerrainState() {
        const state = game.state;
        state.harvestedTerrainKeys = state.harvestedTerrainKeys || {};
        return state.harvestedTerrainKeys;
    }

    function getSelectedInventoryItem() {
        const inventoryRuntime = getInventoryRuntime();
        return inventoryRuntime ? inventoryRuntime.getSelectedInventoryItem() : null;
    }

    function getTerrainGatherProfile(tileInfo) {
        if (!tileInfo || tileInfo.house) {
            return null;
        }

        const baseTileType = tileInfo.baseTileType || tileInfo.tileType;

        if (baseTileType === 'rubble') {
            return {
                itemId: 'rubbleChunk',
                sourceLabel: 'осыпь',
                collectedLabel: 'обломки осыпи',
                resourceLabel: 'каменный ресурс',
                allowAdjacent: false
            };
        }

        if (baseTileType === 'rock') {
            return {
                itemId: 'rubbleChunk',
                sourceLabel: 'камни',
                collectedLabel: 'камень',
                resourceLabel: 'каменный ресурс',
                allowAdjacent: true
            };
        }

        if (tileInfo.travelZoneKey === 'badSector') {
            return {
                itemId: 'soilClod',
                sourceLabel: 'плохой сектор',
                collectedLabel: 'комья земли',
                resourceLabel: 'земляной ресурс',
                allowAdjacent: false
            };
        }

        if (baseTileType === 'reeds') {
            return {
                itemId: 'lowlandGrass',
                sourceLabel: 'тростник',
                collectedLabel: 'низинную траву',
                resourceLabel: 'травяной ресурс',
                allowAdjacent: false
            };
        }

        if (baseTileType === 'grass') {
            return {
                itemId: 'fieldGrass',
                sourceLabel: 'трава',
                collectedLabel: 'пучок полевой травы',
                resourceLabel: 'травяной ресурс',
                allowAdjacent: false
            };
        }

        return null;
    }

    function getTerrainGatherKey(tileInfo) {
        return tileInfo ? `${tileInfo.x},${tileInfo.y}` : '';
    }

    function isTerrainAlreadyHarvested(tileInfo, profile) {
        if (!tileInfo || !profile) {
            return false;
        }

        const harvested = getHarvestedTerrainState();
        return Boolean(
            harvested[getTerrainGatherKey(tileInfo)]
            || harvested[`${profile.itemId}:${tileInfo.x},${tileInfo.y}`]
        );
    }

    function markTerrainHarvested(tileInfo, profile) {
        if (!tileInfo || !profile) {
            return;
        }

        const harvested = getHarvestedTerrainState();
        harvested[getTerrainGatherKey(tileInfo)] = true;
        harvested[`${profile.itemId}:${tileInfo.x},${tileInfo.y}`] = true;
    }

    function invalidateTerrainTileRenderCache(worldX, worldY) {
        const world = game.systems.world;

        if (!world || typeof world.getChunkCoordinatesForWorld !== 'function' || typeof world.getChunk !== 'function') {
            return;
        }

        const { chunkX, chunkY } = world.getChunkCoordinatesForWorld(worldX, worldY);
        const chunk = world.getChunk(chunkX, chunkY, { generateIfMissing: false });

        if (chunk) {
            chunk.renderCache = null;
        }
    }

    function getTerrainTarget(options = {}) {
        const { includeHarvested = false, allowSelectedItem = false } = options;
        const world = game.systems.world;

        if (!world || typeof world.getTileInfo !== 'function') {
            return null;
        }

        if (!allowSelectedItem && getSelectedInventoryItem()) {
            return null;
        }

        const origin = game.state.playerPos;
        const currentTileInfo = world.getTileInfo(origin.x, origin.y, { generateIfMissing: false });
        const currentProfile = getTerrainGatherProfile(currentTileInfo);

        if (currentProfile) {
            const isHarvested = isTerrainAlreadyHarvested(currentTileInfo, currentProfile);
            if (includeHarvested || !isHarvested) {
                return { tileInfo: currentTileInfo, profile: currentProfile, isHarvested };
            }
        }

        const adjacentPositions = [
            { x: origin.x + 1, y: origin.y },
            { x: origin.x - 1, y: origin.y },
            { x: origin.x, y: origin.y + 1 },
            { x: origin.x, y: origin.y - 1 }
        ];

        for (const position of adjacentPositions) {
            const tileInfo = world.getTileInfo(position.x, position.y, { generateIfMissing: false });
            const profile = getTerrainGatherProfile(tileInfo);

            if (!profile || !profile.allowAdjacent) {
                continue;
            }

            const isHarvested = isTerrainAlreadyHarvested(tileInfo, profile);
            if (includeHarvested || !isHarvested) {
                return { tileInfo, profile, isHarvested };
            }
        }

        return null;
    }

    function getGatherableTerrainTarget() {
        return getTerrainTarget();
    }

    function getInspectableTerrainTarget() {
        return getTerrainTarget({ includeHarvested: true, allowSelectedItem: true });
    }

    function getRouteInspectTileInfo() {
        const world = game.systems.world;
        const route = Array.isArray(game.state.route) ? game.state.route : [];

        if (!world || typeof world.getTileInfo !== 'function' || route.length === 0) {
            return null;
        }

        const lastPoint = route[route.length - 1];
        return world.getTileInfo(lastPoint.x, lastPoint.y, { generateIfMissing: false });
    }

    function getTerrainTargetForTile(tileInfo, options = {}) {
        const { includeHarvested = false } = options;
        const profile = getTerrainGatherProfile(tileInfo);

        if (!profile) {
            return null;
        }

        const isHarvested = isTerrainAlreadyHarvested(tileInfo, profile);
        if (!includeHarvested && isHarvested) {
            return null;
        }

        return { tileInfo, profile, isHarvested };
    }

    function refreshPlayerContext() {
        const world = game.systems.world;

        if (world && typeof world.updatePlayerContext === 'function') {
            world.updatePlayerContext(game.state.playerPos);
        }
    }

    function collectTerrainResource() {
        const inventoryRuntime = getInventoryRuntime();
        const itemEffects = getItemEffects();
        const registry = game.systems.itemRegistry || game.systems.loot || null;
        const target = getGatherableTerrainTarget();

        if (!inventoryRuntime || !target) {
            return false;
        }

        const outcome = inventoryRuntime.addInventoryItem(target.profile.itemId, 1);

        if (!outcome.added) {
            bridge.setActionMessage('Рюкзак полон. Сначала освободи слот, чтобы собрать материал.');
            bridge.renderAfterStateChange();
            return true;
        }

        markTerrainHarvested(target.tileInfo, target.profile);
        invalidateTerrainTileRenderCache(target.tileInfo.x, target.tileInfo.y);
        refreshPlayerContext();

        const drops = [];
        if (itemEffects && typeof itemEffects.buildItemEffectDrop === 'function' && registry) {
            const rawItem = registry.createInventoryItem
                ? registry.createInventoryItem(target.profile.itemId, 1)
                : {
                    id: target.profile.itemId,
                    quantity: 1,
                    label: target.profile.collectedLabel,
                    icon: '?'
                };

            const rawDrop = itemEffects.buildItemEffectDrop(rawItem);
            if (rawDrop) {
                drops.push(rawDrop);
            }

            (outcome.conversions || []).forEach((conversion) => {
                if (!conversion.added || !conversion.item) {
                    return;
                }

                const conversionDrop = itemEffects.buildItemEffectDrop({
                    id: conversion.item.id,
                    label: conversion.item.label,
                    icon: conversion.item.icon,
                    quantity: 1
                });

                if (conversionDrop) {
                    drops.push(conversionDrop);
                }
            });
        }

        if (drops.length > 0 && game.systems.effects) {
            game.systems.effects.spawnInventoryUse(game.state.playerPos, drops);
        }

        const addedConversion = (outcome.conversions || []).find((conversion) => conversion.added && conversion.item);
        const conversionSummary = addedConversion
            ? ` Пять единиц автоматически объединены в "${addedConversion.item.label}".`
            : '';

        bridge.setActionMessage(`Собрано: ${target.profile.collectedLabel} с участка "${target.profile.sourceLabel}".${conversionSummary}`);
        bridge.renderAfterStateChange();
        return true;
    }

    function setActionButtonState(action, enabled, highlighted = false) {
        const elements = bridge.getElements();
        const button = elements.actionButtons.find((item) => item.dataset.action === action);

        if (!button) {
            return;
        }

        button.disabled = !enabled;
        button.classList.toggle('hud-button--available', Boolean(enabled && highlighted));
    }

    function getTerrainActionHint(target) {
        if (!target) {
            return '';
        }

        if (target.isHarvested) {
            return `Здесь уже ничего не осталось: ${target.profile.sourceLabel} на этой клетке собраны.`;
        }

        return `Рядом есть ${target.profile.sourceLabel}. Нажми "Использовать", чтобы собрать ${target.profile.collectedLabel}. Каждые 5 единиц превращаются в ${target.profile.resourceLabel}.`;
    }

    function getTerrainInspectMessage(target) {
        return getTerrainInspectMessageSafe(target);
    }

    function getTerrainInspectMessageSafe(target) {
        if (!target) {
            return '';
        }

        const tileInfo = target.tileInfo;
        const positionLabel = tileInfo
            ? `\u043a\u043e\u043e\u0440\u0434\u0438\u043d\u0430\u0442\u044b ${tileInfo.x}, ${tileInfo.y}`
            : '\u044d\u0442\u0430 \u043a\u043b\u0435\u0442\u043a\u0430';

        if (target.isHarvested) {
            return `\u041e\u0441\u043c\u043e\u0442\u0440: ${target.profile.sourceLabel}, ${positionLabel}. \u0417\u0434\u0435\u0441\u044c \u0443\u0436\u0435 \u043d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043e\u0441\u0442\u0430\u043b\u043e\u0441\u044c, \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b \u0441\u043e\u0431\u0440\u0430\u043d.`;
        }

        return `\u041e\u0441\u043c\u043e\u0442\u0440: ${target.profile.sourceLabel}, ${positionLabel}. \u0417\u0434\u0435\u0441\u044c \u043c\u043e\u0436\u043d\u043e \u0441\u043e\u0431\u0440\u0430\u0442\u044c ${target.profile.collectedLabel}. \u041a\u0430\u0436\u0434\u044b\u0435 5 \u0435\u0434\u0438\u043d\u0438\u0446 \u043f\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u044e\u0442\u0441\u044f \u0432 ${target.profile.resourceLabel}.`;
    }

    getTerrainInspectMessage = getTerrainInspectMessageSafe;

    function getDefaultActionHint(activeInteraction, tileInfo) {
        const inventoryRuntime = getInventoryRuntime();
        const itemEffects = getItemEffects();
        const selectedItem = getSelectedInventoryItem();
        const groundItem = inventoryRuntime ? inventoryRuntime.getCurrentGroundItem() : null;
        const encounter = bridge.getHouseEncounter(activeInteraction);
        const terrainTarget = getInspectableTerrainTarget();
        const penaltySummary = bridge.getActivePenaltySummary(tileInfo, 3);

        if (selectedItem) {
            if (itemEffects && itemEffects.isBridgeBuilderItem(selectedItem.id)) {
                return `Выбран предмет: ${selectedItem.label}. Подойди к узкому водному проходу и нажми "Использовать", чтобы уложить мост.`;
            }

            if (itemEffects && typeof itemEffects.canUseInventoryItem === 'function' && itemEffects.canUseInventoryItem(selectedItem)) {
                return `Выбран предмет: ${selectedItem.label}. Нажми "Использовать" для активации или "Осмотреть" для описания.`;
            }

            return `Выбран предмет: ${selectedItem.label}. Нажми "Осмотреть", чтобы увидеть описание.`;
        }

        if (groundItem && inventoryRuntime) {
            return `Под ногами лежит: ${inventoryRuntime.getGroundItemDescription(groundItem)}. Нажми "Использовать", чтобы подобрать.`;
        }

        if (itemEffects && typeof itemEffects.canUseBridgeCharge === 'function' && itemEffects.canUseBridgeCharge()) {
            return 'У тебя есть активный мостовой заряд. Подойди к воде и нажми "Использовать", чтобы построить ещё одну клетку моста.';
        }

        if (encounter) {
            if (encounter.kind === 'merchant') {
                return `${encounter.label}: ${encounter.summary} Нажми "Говорить", чтобы открыть меню торговли.`;
            }

            if (encounter.kind === 'artisan') {
                return `${encounter.label}: ${encounter.summary} Нажми "Говорить", чтобы открыть заказ на расширение сумки.`;
            }

            if (encounter.kind === 'shelter') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Спать".`;
            }

            if (encounter.kind === 'well') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Использовать", чтобы восстановиться.`;
            }

            if (encounter.kind === 'forage') {
                return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Использовать", чтобы собрать еду.`;
            }

            return `${encounter.label}: ${encounter.summary} Подойди вплотную и нажми "Использовать".`;
        }

        if (terrainTarget) {
            return getTerrainActionHint(terrainTarget);
        }

        if (tileInfo && tileInfo.tileType === 'bridge') {
            const expedition = game.systems.expedition;
            const durability = expedition ? expedition.getBridgeDurability(tileInfo) : 2;

            return durability <= 1
                ? 'Старый мост: после следующего прохода он развалится.'
                : 'Обычный мост: первый проход состарит его, второй разрушит.';
        }

        if (penaltySummary) {
            return `Активные последствия: ${penaltySummary}.`;
        }

        return 'Дальние острова ускоряют расход ресурсов и снижают эффективность восстановления.';
    }

    function updateActionButtons(activeInteraction = game.state.activeInteraction) {
        const inventoryRuntime = getInventoryRuntime();
        const itemEffects = getItemEffects();
        const dialogueRuntime = getDialogueRuntime();
        const selectedItem = getSelectedInventoryItem();
        const groundItem = inventoryRuntime ? inventoryRuntime.getCurrentGroundItem() : null;
        const encounter = bridge.getHouseEncounter(activeInteraction);
        const canUseInteraction = encounter
            && !bridge.isHouseResolved(activeInteraction)
            && encounter.kind !== 'merchant'
            && encounter.kind !== 'artisan'
            && encounter.kind !== 'shelter';
        const canTalkInteraction = encounter
            && dialogueRuntime
            && dialogueRuntime.canStartDialogue(activeInteraction);
        const shelterNearby = encounter && encounter.kind === 'shelter';
        const canUseItem = Boolean(
            selectedItem
            && itemEffects
            && typeof itemEffects.canUseInventoryItem === 'function'
            && itemEffects.canUseInventoryItem(selectedItem)
        );
        const canUseBridgeCharge = Boolean(
            !selectedItem
            && itemEffects
            && typeof itemEffects.canUseBridgeCharge === 'function'
            && itemEffects.canUseBridgeCharge()
        );
        const canUseGroundItem = Boolean(groundItem);
        const canUseTerrain = Boolean(getGatherableTerrainTarget());
        const inspectableTerrain = getInspectableTerrainTarget();
        const canDropItem = Boolean(selectedItem);
        const baseEnabled = !game.state.isGameOver && !game.state.isMoving;

        setActionButtonState(
            'use',
            baseEnabled && (canUseItem || canUseBridgeCharge || canUseGroundItem || canUseInteraction || canUseTerrain),
            Boolean(canUseItem || canUseBridgeCharge || canUseGroundItem || canUseInteraction || canUseTerrain)
        );
        setActionButtonState('talk', baseEnabled && Boolean(canTalkInteraction), Boolean(canTalkInteraction));
        setActionButtonState('sleep', baseEnabled, Boolean(shelterNearby || game.state.activeHouse));
        setActionButtonState('inspect', baseEnabled, Boolean(selectedItem || groundItem || inspectableTerrain || activeInteraction));
        setActionButtonState('drop', baseEnabled && canDropItem, canDropItem);
    }

    function inspectInventoryItem(item) {
        if (!item) {
            bridge.setActionMessage('Этот слот пуст. Осматривать здесь пока нечего.');
            bridge.renderAfterStateChange();
            return;
        }

        bridge.setActionMessage(bridge.getItemDescription(item.id) || `Предмет "${item.label}" пока без описания.`);
        bridge.renderAfterStateChange();
    }

    function handleUseAction() {
        const inventoryRuntime = getInventoryRuntime();
        const itemEffects = getItemEffects();
        const selectedItem = getSelectedInventoryItem();
        const canUseSelectedItem = Boolean(
            selectedItem
            && itemEffects
            && typeof itemEffects.canUseInventoryItem === 'function'
            && itemEffects.canUseInventoryItem(selectedItem)
        );
        const groundItem = inventoryRuntime ? inventoryRuntime.getCurrentGroundItem() : null;

        if (canUseSelectedItem) {
            const outcome = itemEffects ? itemEffects.useInventoryItem(selectedItem) : null;
            bridge.setActionMessage(outcome ? outcome.message : 'Рядом нет объекта для использования.');

            if (outcome && outcome.effectDrops && game.systems.effects) {
                game.systems.effects.spawnInventoryUse(game.state.playerPos, outcome.effectDrops);
            }

            bridge.renderAfterStateChange();
            return;
        }

        if (groundItem && inventoryRuntime && itemEffects) {
            const outcome = inventoryRuntime.pickupGroundItem();

            if (!outcome.success) {
                bridge.setActionMessage(outcome.reason === 'full'
                    ? 'Рюкзак полон, подобрать предметы не удалось.'
                    : 'Под ногами ничего не лежит.');
                bridge.renderAfterStateChange();
                return;
            }

            const pickedDrops = outcome.picked
                .map((item) => itemEffects.buildItemEffectDrop(item))
                .filter(Boolean);

            if (pickedDrops.length > 0 && game.systems.effects) {
                game.systems.effects.spawnInventoryUse(game.state.playerPos, pickedDrops);
            }

            const pickedSummary = outcome.picked
                .map((item) => `${item.label}${item.quantity > 1 ? ` x${item.quantity}` : ''}`)
                .join(', ');
            const remainingSummary = outcome.remaining.length > 0
                ? ` Рюкзак полон: осталось ${outcome.remaining.map((item) => item.label).join(', ')}.`
                : '';

            bridge.setActionMessage(`Подобрано: ${pickedSummary}.${remainingSummary}`);
            bridge.renderAfterStateChange();
            return;
        }

        if (!selectedItem && itemEffects && typeof itemEffects.canUseBridgeCharge === 'function' && itemEffects.canUseBridgeCharge()) {
            const outcome = itemEffects.useBridgeCharge();
            bridge.setActionMessage(outcome ? outcome.message : 'Не удалось использовать мостовой заряд.');
            bridge.renderAfterStateChange();
            return;
        }

        if (game.state.activeInteraction) {
            bridge.resolveHouseUse(game.state.activeInteraction);
            return;
        }

        if (collectTerrainResource()) {
            return;
        }

        if (selectedItem) {
            const outcome = itemEffects ? itemEffects.useInventoryItem(selectedItem) : null;
            bridge.setActionMessage(outcome ? outcome.message : `Предмет "${selectedItem.label}" пока не имеет отдельного активного эффекта.`);
            bridge.renderAfterStateChange();
            return;
        }

        bridge.setActionMessage('Рядом нет объекта для использования.');
        bridge.renderAfterStateChange();
    }

    function handleInspectAction() {
        const inventoryRuntime = getInventoryRuntime();
        const selectedItem = getSelectedInventoryItem();
        const groundItem = inventoryRuntime ? inventoryRuntime.getCurrentGroundItem() : null;
        const routeInspectTileInfo = getRouteInspectTileInfo();
        const routeTerrainTarget = getTerrainTargetForTile(routeInspectTileInfo, { includeHarvested: true });
        const terrainTarget = routeTerrainTarget || getInspectableTerrainTarget();

        if (selectedItem || game.state.selectedInventorySlot !== null) {
            inspectInventoryItem(selectedItem);
            return;
        }

        if (groundItem && inventoryRuntime) {
            bridge.setActionMessage(`Под ногами: ${inventoryRuntime.getGroundItemDescription(groundItem)}.`);
            bridge.renderAfterStateChange();
            return;
        }

        if (terrainTarget) {
            bridge.setActionMessage(getTerrainInspectMessageSafe(terrainTarget));
            bridge.renderAfterStateChange();
            return;
        }

        if (game.state.activeInteraction) {
            bridge.inspectActiveHouse();
            return;
        }

        const tileInfo = routeInspectTileInfo || game.state.activeTileInfo;
        const tileLabel = bridge.getTileLabel(tileInfo ? tileInfo.tileType : 'grass');
        const progression = bridge.getCurrentProgression(tileInfo);
        const suffix = progression ? ` Остров ${progression.islandIndex}: ${progression.label}.` : '';
        const bandLabel = tileInfo ? bridge.getTravelBandLabel(tileInfo.travelBand) : bridge.getTravelBandLabel('normal');
        const weightLabel = tileInfo ? bridge.formatRouteCost(tileInfo.travelWeight) : '1.0';
        const travelLabel = tileInfo ? tileInfo.travelLabel || tileLabel : tileLabel;

        bridge.setActionMessage(`Осмотр: ${travelLabel}, координаты ${tileInfo ? tileInfo.x : game.state.playerPos.x}, ${tileInfo ? tileInfo.y : game.state.playerPos.y}. Это ${bandLabel}, цена шага x${weightLabel}.${suffix}`);
        bridge.renderAfterStateChange();
    }

    function handleTalkAction() {
        const dialogueRuntime = getDialogueRuntime();

        if (game.state.activeInteraction && dialogueRuntime) {
            const result = dialogueRuntime.startDialogue(game.state.activeInteraction);

            if (result) {
                bridge.renderAfterStateChange();
                return;
            }
        }

        bridge.setActionMessage('Рядом нет персонажей для разговора.');
        bridge.renderAfterStateChange();
    }

    function handleActionClick(event) {
        if (game.state.isGameOver) {
            return;
        }

        const inventoryRuntime = getInventoryRuntime();
        const action = event.currentTarget.dataset.action;

        if (action === 'sleep') {
            const shouldPlaySleepTransition = !game.state.isMoving;
            bridge.performSleep();

            if (shouldPlaySleepTransition && game.systems.statusUi && typeof game.systems.statusUi.playSleepTransition === 'function') {
                game.systems.statusUi.playSleepTransition();
            }

            return;
        }

        if (action === 'use') {
            handleUseAction();
            return;
        }

        if (action === 'inspect') {
            handleInspectAction();
            return;
        }

        if (action === 'drop' && inventoryRuntime) {
            const outcome = inventoryRuntime.dropSelectedInventoryItem();

            if (!outcome.success) {
                bridge.setActionMessage('Сначала выбери предмет в инвентаре.');
                bridge.renderAfterStateChange();
                return;
            }

            bridge.setActionMessage(`Выброшен предмет: ${outcome.item.label}${outcome.item.quantity > 1 ? ` x${outcome.item.quantity}` : ''}.`);
            bridge.renderAfterStateChange();
            return;
        }

        if (action === 'talk') {
            handleTalkAction();
        }
    }

    Object.assign(actionUi, {
        getDefaultActionHint,
        setActionButtonState,
        updateActionButtons,
        handleUseAction,
        handleInspectAction,
        handleTalkAction,
        handleActionClick
    });
})();
