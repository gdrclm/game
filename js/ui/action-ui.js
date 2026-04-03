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

    function getSelectedWorldTileInfo() {
        const world = game.systems.world;
        const selectedTile = game.state.selectedWorldTile;

        if (!world || typeof world.getTileInfo !== 'function' || !selectedTile) {
            return null;
        }

        return world.getTileInfo(selectedTile.x, selectedTile.y, { generateIfMissing: false });
    }

    function getSelectedWorldInteraction(tileInfo = getSelectedWorldTileInfo()) {
        if (!tileInfo) {
            return null;
        }

        if (tileInfo.interaction) {
            return tileInfo.interaction;
        }

        const interactions = game.systems.interactions;
        return interactions && typeof interactions.getInteractionAtWorld === 'function'
            ? interactions.getInteractionAtWorld(tileInfo.x, tileInfo.y, { generateIfMissing: false })
            : null;
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

    function getInteractionDescription(interaction) {
        if (!interaction) {
            return '';
        }

        const expedition = interaction.expedition || {};
        const label = expedition.label || interaction.label || 'объект';

        switch (interaction.kind) {
            case 'merchant':
                return `${label}: странствующий торговец. Здесь можно купить припасы, продать находки и взять поручение.`;
            case 'artisan':
                return `${label}: ремесленник по сумкам. Он открывает новые слоты и собирает особые наборы вещей.`;
            case 'shelter':
                return `${label}: полевой лагерь. Здесь можно передохнуть и частично восстановить силы.`;
            case 'well':
                return `${label}: колодец с чистой водой. Он помогает восстановиться в длинном переходе.`;
            case 'forage':
                return `${label}: куст с полевыми ягодами. Ягоды быстро снимают часть голода.`;
            case 'emptyHouse':
                return `${label}: пустой дом. Внутри может не оказаться пользы, но это укрытие и безопасная точка.`;
            case 'trapHouse':
                return `${label}: подозрительный дом-ловушка. Он выглядит рискованно и может дать неприятный исход.`;
            case 'groundItem':
                return inventoryRuntime && typeof inventoryRuntime.getGroundItemDescription === 'function'
                    ? `На земле лежит: ${inventoryRuntime.getGroundItemDescription(interaction)}.`
                    : 'На земле лежит предмет.';
            case 'finalChest':
                return `${label}: финальный сундук с очень редкой наградой. Такие сундуки стоит открывать с пустым местом в сумке.`;
            case 'jackpotChest':
                return `${label}: джекпот-сундук. У него особенно жирная добыча и высокий шанс ценной награды.`;
            case 'chest': {
                const chestTier = expedition.chestTier || 'ordinary';
                const tierLabels = {
                    ordinary: 'обычный сундук',
                    rich: 'богатый сундук',
                    hidden: 'скрытый сундук',
                    cursed: 'проклятый сундук',
                    elite: 'элитный сундук',
                    jackpot: 'джекпот-сундук'
                };
                return `${label}: ${tierLabels[chestTier] || 'сундук'} с наградой. Чем дальше остров, тем выше шанс редких вещей.`;
            }
            default:
                return `${label}: заметный объект на острове.`;
        }
    }

    function getInteractionAdvice(interaction) {
        if (!interaction) {
            return '';
        }

        const expedition = interaction.expedition || {};
        const label = expedition.label || interaction.label || 'объект';

        switch (interaction.kind) {
            case 'merchant':
                return `Изучить: ${label}. Совет: продавай лишние ценности, а дорогие припасы бери перед длинным островом или плохой погодой.`;
            case 'artisan':
                return `Изучить: ${label}. Совет: держи в сумке разные категории вещей, чтобы быстрее закрывать квесты на новые слоты.`;
            case 'shelter':
                return `Изучить: ${label}. Совет: лагерь лучше использовать до полного истощения, чтобы не заходить в снежный ком штрафов.`;
            case 'well':
                return `Изучить: ${label}. Совет: запоминай колодцы на карте и строй маршрут так, чтобы они были промежуточной опорой на длинных островах.`;
            case 'forage':
                return `Изучить: ${label}. Совет: ягоды лучше срывать, когда голод уже заметно просел, а не тратить их заранее на почти полную шкалу.`;
            case 'emptyHouse':
                return `Изучить: ${label}. Совет: даже пустой дом полезен как безопасная точка и ориентир на карте.`;
            case 'trapHouse':
                return `Изучить: ${label}. Совет: в подозрительные дома лучше заходить с запасом энергии, места в сумке и возможностью быстро отступить.`;
            case 'groundItem':
                return 'Изучить: предмет на земле. Совет: сначала проверь место в сумке, чтобы не потерять более важную находку позже.';
            case 'finalChest':
            case 'jackpotChest':
                return `Изучить: ${label}. Совет: перед открытием освободи слот, проверь состояние героя и не оставляй такую награду на момент полного истощения.`;
            case 'chest': {
                const chestTier = expedition.chestTier || 'ordinary';

                if (chestTier === 'cursed') {
                    return `Изучить: ${label}. Совет: проклятые сундуки лучше трогать, когда у героя есть запас по характеристикам и выход к восстановлению.`;
                }

                if (chestTier === 'hidden') {
                    return `Изучить: ${label}. Совет: скрытые сундуки полезно подбирать по пути, если маршрут и так проходит рядом, без лишнего расхода клеток.`;
                }

                if (chestTier === 'elite' || chestTier === 'rich') {
                    return `Изучить: ${label}. Совет: богатые сундуки особенно выгодны на дальних островах, когда в сумке ещё есть свободный слот под редкий предмет.`;
                }

                return `Изучить: ${label}. Совет: обычный сундук лучше брать по дороге, если он не заставляет тратить лишний маршрут на опасные клетки.`;
            }
            default:
                return `Изучить: ${label}. Совет: оценивай этот объект вместе с маршрутом, погодой и запасом характеристик.`;
        }
    }

    function getTerrainAdviceMessage(target) {
        if (!target) {
            return '';
        }

        const tileInfo = target.tileInfo;
        const positionLabel = tileInfo ? `координаты ${tileInfo.x}, ${tileInfo.y}` : 'эта клетка';

        if (target.isHarvested) {
            return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: здесь уже пусто, лучше искать следующий такой ресурс по пути, а не возвращаться.`;
        }

        switch (target.profile.itemId) {
            case 'fieldGrass':
                return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: полевую траву удобно собирать на старте острова, когда маршрут ещё короткий и вокруг много безопасных клеток.`;
            case 'lowlandGrass':
                return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: тростник собирай только если он стоит рядом с маршрутом, потому что сам по себе он утяжеляет путь.`;
            case 'rubbleChunk':
                return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: камень и осыпь лучше брать по дороге, а не делать ради них отдельный дорогой заход.`;
            case 'soilClod':
                return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: плохой сектор полезен для земли, но заходить туда стоит только с запасом энергии и понятным выходом назад.`;
            default:
                return `Изучить: ${target.profile.sourceLabel}, ${positionLabel}. Совет: оценивай, стоит ли ресурс лишних клеток и просадки характеристик.`;
        }
    }

    function getInteractionDescriptionSafe(interaction) {
        if (!interaction) {
            return '';
        }

        const expedition = interaction.expedition || {};
        const label = expedition.label || interaction.label || '\u043e\u0431\u044a\u0435\u043a\u0442';

        if (interaction.kind === 'groundItem') {
            const inventoryRuntime = getInventoryRuntime();
            return inventoryRuntime && typeof inventoryRuntime.getGroundItemDescription === 'function'
                ? `\u041d\u0430 \u0437\u0435\u043c\u043b\u0435 \u043b\u0435\u0436\u0438\u0442: ${inventoryRuntime.getGroundItemDescription(interaction)}.`
                : '\u041d\u0430 \u0437\u0435\u043c\u043b\u0435 \u043b\u0435\u0436\u0438\u0442 \u043f\u0440\u0435\u0434\u043c\u0435\u0442.';
        }

        if (interaction.kind === 'chest') {
            const chestTier = expedition.chestTier || 'ordinary';
            const tierLabels = {
                ordinary: '\u043e\u0431\u044b\u0447\u043d\u044b\u0439 \u0441\u0443\u043d\u0434\u0443\u043a',
                rich: '\u0431\u043e\u0433\u0430\u0442\u044b\u0439 \u0441\u0443\u043d\u0434\u0443\u043a',
                hidden: '\u0441\u043a\u0440\u044b\u0442\u044b\u0439 \u0441\u0443\u043d\u0434\u0443\u043a',
                cursed: '\u043f\u0440\u043e\u043a\u043b\u044f\u0442\u044b\u0439 \u0441\u0443\u043d\u0434\u0443\u043a',
                elite: '\u044d\u043b\u0438\u0442\u043d\u044b\u0439 \u0441\u0443\u043d\u0434\u0443\u043a',
                jackpot: '\u0434\u0436\u0435\u043a\u043f\u043e\u0442-\u0441\u0443\u043d\u0434\u0443\u043a'
            };
            return `${label}: ${tierLabels[chestTier] || '\u0441\u0443\u043d\u0434\u0443\u043a'} \u0441 \u043d\u0430\u0433\u0440\u0430\u0434\u043e\u0439. \u0427\u0435\u043c \u0434\u0430\u043b\u044c\u0448\u0435 \u043e\u0441\u0442\u0440\u043e\u0432, \u0442\u0435\u043c \u0432\u044b\u0448\u0435 \u0448\u0430\u043d\u0441 \u0440\u0435\u0434\u043a\u0438\u0445 \u0432\u0435\u0449\u0435\u0439.`;
        }

        const descriptionByKind = {
            merchant: '\u0441\u0442\u0440\u0430\u043d\u0441\u0442\u0432\u0443\u044e\u0449\u0438\u0439 \u0442\u043e\u0440\u0433\u043e\u0432\u0435\u0446. \u0417\u0434\u0435\u0441\u044c \u043c\u043e\u0436\u043d\u043e \u043a\u0443\u043f\u0438\u0442\u044c \u043f\u0440\u0438\u043f\u0430\u0441\u044b, \u043f\u0440\u043e\u0434\u0430\u0442\u044c \u043d\u0430\u0445\u043e\u0434\u043a\u0438 \u0438 \u0432\u0437\u044f\u0442\u044c \u043f\u043e\u0440\u0443\u0447\u0435\u043d\u0438\u0435.',
            artisan: '\u0440\u0435\u043c\u0435\u0441\u043b\u0435\u043d\u043d\u0438\u043a \u043f\u043e \u0441\u0443\u043c\u043a\u0430\u043c. \u041e\u043d \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u0442 \u043d\u043e\u0432\u044b\u0435 \u0441\u043b\u043e\u0442\u044b \u0438 \u0441\u043e\u0431\u0438\u0440\u0430\u0435\u0442 \u043e\u0441\u043e\u0431\u044b\u0435 \u043d\u0430\u0431\u043e\u0440\u044b \u0432\u0435\u0449\u0435\u0439.',
            shelter: '\u043f\u043e\u043b\u0435\u0432\u043e\u0439 \u043b\u0430\u0433\u0435\u0440\u044c. \u0417\u0434\u0435\u0441\u044c \u043c\u043e\u0436\u043d\u043e \u043f\u0435\u0440\u0435\u0434\u043e\u0445\u043d\u0443\u0442\u044c \u0438 \u0447\u0430\u0441\u0442\u0438\u0447\u043d\u043e \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c \u0441\u0438\u043b\u044b.',
            well: '\u043a\u043e\u043b\u043e\u0434\u0435\u0446 \u0441 \u0447\u0438\u0441\u0442\u043e\u0439 \u0432\u043e\u0434\u043e\u0439. \u041e\u043d \u043f\u043e\u043c\u043e\u0433\u0430\u0435\u0442 \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c\u0441\u044f \u0432 \u0434\u043b\u0438\u043d\u043d\u043e\u043c \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u0435.',
            forage: '\u043a\u0443\u0441\u0442 \u0441 \u043f\u043e\u043b\u0435\u0432\u044b\u043c\u0438 \u044f\u0433\u043e\u0434\u0430\u043c\u0438. \u042f\u0433\u043e\u0434\u044b \u0431\u044b\u0441\u0442\u0440\u043e \u0441\u043d\u0438\u043c\u0430\u044e\u0442 \u0447\u0430\u0441\u0442\u044c \u0433\u043e\u043b\u043e\u0434\u0430.',
            emptyHouse: '\u043f\u0443\u0441\u0442\u043e\u0439 \u0434\u043e\u043c. \u0412\u043d\u0443\u0442\u0440\u0438 \u043c\u043e\u0436\u0435\u0442 \u043d\u0435 \u043e\u043a\u0430\u0437\u0430\u0442\u044c\u0441\u044f \u043f\u043e\u043b\u044c\u0437\u044b, \u043d\u043e \u044d\u0442\u043e \u0443\u043a\u0440\u044b\u0442\u0438\u0435 \u0438 \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u0430\u044f \u0442\u043e\u0447\u043a\u0430.',
            trapHouse: '\u043f\u043e\u0434\u043e\u0437\u0440\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0434\u043e\u043c-\u043b\u043e\u0432\u0443\u0448\u043a\u0430. \u041e\u043d \u0432\u044b\u0433\u043b\u044f\u0434\u0438\u0442 \u0440\u0438\u0441\u043a\u043e\u0432\u0430\u043d\u043d\u043e \u0438 \u043c\u043e\u0436\u0435\u0442 \u0434\u0430\u0442\u044c \u043d\u0435\u043f\u0440\u0438\u044f\u0442\u043d\u044b\u0439 \u0438\u0441\u0445\u043e\u0434.',
            finalChest: '\u0444\u0438\u043d\u0430\u043b\u044c\u043d\u044b\u0439 \u0441\u0443\u043d\u0434\u0443\u043a \u0441 \u043e\u0447\u0435\u043d\u044c \u0440\u0435\u0434\u043a\u043e\u0439 \u043d\u0430\u0433\u0440\u0430\u0434\u043e\u0439. \u0422\u0430\u043a\u0438\u0435 \u0441\u0443\u043d\u0434\u0443\u043a\u0438 \u0441\u0442\u043e\u0438\u0442 \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0442\u044c \u0441 \u043f\u0443\u0441\u0442\u044b\u043c \u043c\u0435\u0441\u0442\u043e\u043c \u0432 \u0441\u0443\u043c\u043a\u0435.',
            jackpotChest: '\u0434\u0436\u0435\u043a\u043f\u043e\u0442-\u0441\u0443\u043d\u0434\u0443\u043a. \u0423 \u043d\u0435\u0433\u043e \u043e\u0441\u043e\u0431\u0435\u043d\u043d\u043e \u0436\u0438\u0440\u043d\u0430\u044f \u0434\u043e\u0431\u044b\u0447\u0430 \u0438 \u0432\u044b\u0441\u043e\u043a\u0438\u0439 \u0448\u0430\u043d\u0441 \u0446\u0435\u043d\u043d\u043e\u0439 \u043d\u0430\u0433\u0440\u0430\u0434\u044b.'
        };

        return `${label}: ${descriptionByKind[interaction.kind] || '\u0437\u0430\u043c\u0435\u0442\u043d\u044b\u0439 \u043e\u0431\u044a\u0435\u043a\u0442 \u043d\u0430 \u043e\u0441\u0442\u0440\u043e\u0432\u0435.'}`;
    }

    function getInteractionAdviceSafe(interaction) {
        if (!interaction) {
            return '';
        }

        const expedition = interaction.expedition || {};
        const label = expedition.label || interaction.label || '\u043e\u0431\u044a\u0435\u043a\u0442';

        if (interaction.kind === 'merchant') {
            return `\u0418\u0437\u0443\u0447\u0438\u0442\u044c: ${label}. \u0421\u043e\u0432\u0435\u0442: \u043f\u0440\u043e\u0434\u0430\u0432\u0430\u0439 \u043b\u0438\u0448\u043d\u0438\u0435 \u0446\u0435\u043d\u043d\u043e\u0441\u0442\u0438, \u0430 \u0434\u043e\u0440\u043e\u0433\u0438\u0435 \u043f\u0440\u0438\u043f\u0430\u0441\u044b \u0431\u0435\u0440\u0438 \u043f\u0435\u0440\u0435\u0434 \u0434\u043b\u0438\u043d\u043d\u044b\u043c \u043e\u0441\u0442\u0440\u043e\u0432\u043e\u043c \u0438\u043b\u0438 \u043f\u043b\u043e\u0445\u043e\u0439 \u043f\u043e\u0433\u043e\u0434\u043e\u0439.`;
        }

        if (interaction.kind === 'artisan') {
            return `\u0418\u0437\u0443\u0447\u0438\u0442\u044c: ${label}. \u0421\u043e\u0432\u0435\u0442: \u0434\u0435\u0440\u0436\u0438 \u0432 \u0441\u0443\u043c\u043a\u0435 \u0440\u0430\u0437\u043d\u044b\u0435 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438 \u0432\u0435\u0449\u0435\u0439, \u0447\u0442\u043e\u0431\u044b \u0431\u044b\u0441\u0442\u0440\u0435\u0435 \u0437\u0430\u043a\u0440\u044b\u0432\u0430\u0442\u044c \u043a\u0432\u0435\u0441\u0442\u044b \u043d\u0430 \u043d\u043e\u0432\u044b\u0435 \u0441\u043b\u043e\u0442\u044b.`;
        }

        if (interaction.kind === 'groundItem') {
            return '\u0418\u0437\u0443\u0447\u0438\u0442\u044c: \u043f\u0440\u0435\u0434\u043c\u0435\u0442 \u043d\u0430 \u0437\u0435\u043c\u043b\u0435. \u0421\u043e\u0432\u0435\u0442: \u0441\u043d\u0430\u0447\u0430\u043b\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u044c \u043c\u0435\u0441\u0442\u043e \u0432 \u0441\u0443\u043c\u043a\u0435, \u0447\u0442\u043e\u0431\u044b \u043d\u0435 \u043f\u043e\u0442\u0435\u0440\u044f\u0442\u044c \u0431\u043e\u043b\u0435\u0435 \u0432\u0430\u0436\u043d\u0443\u044e \u043d\u0430\u0445\u043e\u0434\u043a\u0443 \u043f\u043e\u0437\u0436\u0435.';
        }

        if (interaction.kind === 'chest' || interaction.kind === 'finalChest' || interaction.kind === 'jackpotChest') {
            const chestTier = expedition.chestTier || interaction.kind;
            if (chestTier === 'cursed') {
                return `\u0418\u0437\u0443\u0447\u0438\u0442\u044c: ${label}. \u0421\u043e\u0432\u0435\u0442: \u043f\u0440\u043e\u043a\u043b\u044f\u0442\u044b\u0435 \u0441\u0443\u043d\u0434\u0443\u043a\u0438 \u043b\u0443\u0447\u0448\u0435 \u0442\u0440\u043e\u0433\u0430\u0442\u044c, \u043a\u043e\u0433\u0434\u0430 \u0443 \u0433\u0435\u0440\u043e\u044f \u0435\u0441\u0442\u044c \u0437\u0430\u043f\u0430\u0441 \u043f\u043e \u0445\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043a\u0430\u043c \u0438 \u0432\u044b\u0445\u043e\u0434 \u043a \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u044e.`;
            }

            return `\u0418\u0437\u0443\u0447\u0438\u0442\u044c: ${label}. \u0421\u043e\u0432\u0435\u0442: \u043f\u0435\u0440\u0435\u0434 \u043e\u0442\u043a\u0440\u044b\u0442\u0438\u0435\u043c \u043e\u0441\u0432\u043e\u0431\u043e\u0434\u0438 \u0441\u043b\u043e\u0442, \u043f\u0440\u043e\u0432\u0435\u0440\u044c \u0441\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0435 \u0433\u0435\u0440\u043e\u044f \u0438 \u043d\u0435 \u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0439 \u0442\u0430\u043a\u0443\u044e \u043d\u0430\u0433\u0440\u0430\u0434\u0443 \u043d\u0430 \u043c\u043e\u043c\u0435\u043d\u0442 \u043f\u043e\u043b\u043d\u043e\u0433\u043e \u0438\u0441\u0442\u043e\u0449\u0435\u043d\u0438\u044f.`;
        }

        const adviceByKind = {
            shelter: '\u043b\u0430\u0433\u0435\u0440\u044c \u043b\u0443\u0447\u0448\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u0434\u043e \u043f\u043e\u043b\u043d\u043e\u0433\u043e \u0438\u0441\u0442\u043e\u0449\u0435\u043d\u0438\u044f, \u0447\u0442\u043e\u0431\u044b \u043d\u0435 \u0437\u0430\u0445\u043e\u0434\u0438\u0442\u044c \u0432 \u0441\u043d\u0435\u0436\u043d\u044b\u0439 \u043a\u043e\u043c \u0448\u0442\u0440\u0430\u0444\u043e\u0432.',
            well: '\u0437\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u0439 \u043a\u043e\u043b\u043e\u0434\u0446\u044b \u043d\u0430 \u043a\u0430\u0440\u0442\u0435 \u0438 \u0441\u0442\u0440\u043e\u0439 \u043c\u0430\u0440\u0448\u0440\u0443\u0442 \u0442\u0430\u043a, \u0447\u0442\u043e\u0431\u044b \u043e\u043d\u0438 \u0431\u044b\u043b\u0438 \u043f\u0440\u043e\u043c\u0435\u0436\u0443\u0442\u043e\u0447\u043d\u043e\u0439 \u043e\u043f\u043e\u0440\u043e\u0439 \u043d\u0430 \u0434\u043b\u0438\u043d\u043d\u044b\u0445 \u043e\u0441\u0442\u0440\u043e\u0432\u0430\u0445.',
            forage: '\u044f\u0433\u043e\u0434\u044b \u043b\u0443\u0447\u0448\u0435 \u0441\u0440\u044b\u0432\u0430\u0442\u044c, \u043a\u043e\u0433\u0434\u0430 \u0433\u043e\u043b\u043e\u0434 \u0443\u0436\u0435 \u0437\u0430\u043c\u0435\u0442\u043d\u043e \u043f\u0440\u043e\u0441\u0435\u043b, \u0430 \u043d\u0435 \u0442\u0440\u0430\u0442\u0438\u0442\u044c \u0438\u0445 \u0437\u0430\u0440\u0430\u043d\u0435\u0435 \u043d\u0430 \u043f\u043e\u0447\u0442\u0438 \u043f\u043e\u043b\u043d\u0443\u044e \u0448\u043a\u0430\u043b\u0443.',
            emptyHouse: '\u0434\u0430\u0436\u0435 \u043f\u0443\u0441\u0442\u043e\u0439 \u0434\u043e\u043c \u043f\u043e\u043b\u0435\u0437\u0435\u043d \u043a\u0430\u043a \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u0430\u044f \u0442\u043e\u0447\u043a\u0430 \u0438 \u043e\u0440\u0438\u0435\u043d\u0442\u0438\u0440 \u043d\u0430 \u043a\u0430\u0440\u0442\u0435.',
            trapHouse: '\u0432 \u043f\u043e\u0434\u043e\u0437\u0440\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0434\u043e\u043c\u0430 \u043b\u0443\u0447\u0448\u0435 \u0437\u0430\u0445\u043e\u0434\u0438\u0442\u044c \u0441 \u0437\u0430\u043f\u0430\u0441\u043e\u043c \u044d\u043d\u0435\u0440\u0433\u0438\u0438, \u043c\u0435\u0441\u0442\u0430 \u0432 \u0441\u0443\u043c\u043a\u0435 \u0438 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u044c\u044e \u0431\u044b\u0441\u0442\u0440\u043e \u043e\u0442\u0441\u0442\u0443\u043f\u0438\u0442\u044c.'
        };

        return `\u0418\u0437\u0443\u0447\u0438\u0442\u044c: ${label}. \u0421\u043e\u0432\u0435\u0442: ${adviceByKind[interaction.kind] || '\u043e\u0446\u0435\u043d\u0438\u0432\u0430\u0439 \u044d\u0442\u043e\u0442 \u043e\u0431\u044a\u0435\u043a\u0442 \u0432\u043c\u0435\u0441\u0442\u0435 \u0441 \u043c\u0430\u0440\u0448\u0440\u0443\u0442\u043e\u043c, \u043f\u043e\u0433\u043e\u0434\u043e\u0439 \u0438 \u0437\u0430\u043f\u0430\u0441\u043e\u043c \u0445\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043a.'}`;
    }

    function describeSelectedWorldTarget(selection = {}) {
        const tileInfo = selection.tileInfo || getSelectedWorldTileInfo();
        const interaction = selection.interaction || getSelectedWorldInteraction(tileInfo);
        const terrainTarget = getTerrainTargetForTile(tileInfo, { includeHarvested: true });

        if (interaction && interaction.kind !== 'groundItem') {
            bridge.setActionMessage(getInteractionDescriptionSafe(interaction));
            bridge.renderAfterStateChange(['location', 'actions', 'actionHint']);
            return true;
        }

        if (interaction && interaction.kind === 'groundItem') {
            bridge.setActionMessage(getInteractionDescriptionSafe(interaction));
            bridge.renderAfterStateChange(['location', 'actions', 'actionHint']);
            return true;
        }

        if (terrainTarget) {
            bridge.setActionMessage(getTerrainInspectMessageSafe(terrainTarget));
            bridge.renderAfterStateChange(['location', 'actions', 'actionHint']);
            return true;
        }

        return false;
    }

    function getDefaultActionHint(activeInteraction, tileInfo) {
        const inventoryRuntime = getInventoryRuntime();
        const itemEffects = getItemEffects();
        const selectedItem = getSelectedInventoryItem();
        const groundItem = inventoryRuntime ? inventoryRuntime.getCurrentGroundItem() : null;
        const encounter = bridge.getHouseEncounter(activeInteraction);
        const terrainTarget = getInspectableTerrainTarget();
        const selectedWorldTileInfo = getSelectedWorldTileInfo();
        const selectedWorldInteraction = getSelectedWorldInteraction(selectedWorldTileInfo);
        const selectedWorldTerrain = getTerrainTargetForTile(selectedWorldTileInfo, { includeHarvested: true });
        const penaltySummary = bridge.getActivePenaltySummary(tileInfo, 3);
        const hasRoute = Array.isArray(game.state.route) && game.state.route.length > 0 && !game.state.isMoving;

        if (hasRoute) {
            const previewSuffix = game.state.routePreviewLength > game.state.route.length
                ? ` из ${game.state.routePreviewLength}`
                : '';
            const totalCost = bridge.formatRouteCost(game.state.routeTotalCost);
            const fullCostSuffix = game.state.routePreviewLength > game.state.route.length
                ? ` Полный путь стоит ${bridge.formatRouteCost(game.state.routePreviewTotalCost)}.`
                : '';

            return `Маршрут готов: ${game.state.route.length}${previewSuffix} клеток, цена ${totalCost}. Нажми "Ходить" для подтверждения.${fullCostSuffix}`;
        }

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
        const canWalkRoute = baseEnabled && !game.state.isPaused && !game.state.isMapOpen && Array.isArray(game.state.route) && game.state.route.length > 0;

        setActionButtonState('walk', canWalkRoute, canWalkRoute);

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

    function handleWalkAction() {
        if (game.state.isGameOver) {
            return;
        }

        if (game.state.isPaused || game.state.isMapOpen) {
            bridge.setActionMessage('Сначала закрой паузу или карту, потом подтверждай движение.');
            bridge.renderAfterStateChange();
            return;
        }

        if (game.state.isMoving) {
            return;
        }

        if (!Array.isArray(game.state.route) || game.state.route.length === 0) {
            bridge.setActionMessage('Сначала проложи маршрут по клеткам, потом нажми "Ходить".');
            bridge.renderAfterStateChange();
            return;
        }

        game.systems.movement.startMovement();
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

        if (action === 'walk') {
            handleWalkAction();
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

    getDefaultActionHint = function getDefaultActionHintSafe(activeInteraction, tileInfo) {
        const inventoryRuntime = getInventoryRuntime();
        const itemEffects = getItemEffects();
        const selectedItem = getSelectedInventoryItem();
        const groundItem = inventoryRuntime ? inventoryRuntime.getCurrentGroundItem() : null;
        const encounter = bridge.getHouseEncounter(activeInteraction);
        const terrainTarget = getInspectableTerrainTarget();
        const selectedWorldTileInfo = getSelectedWorldTileInfo();
        const selectedWorldInteraction = getSelectedWorldInteraction(selectedWorldTileInfo);
        const selectedWorldTerrain = getTerrainTargetForTile(selectedWorldTileInfo, { includeHarvested: true });
        const penaltySummary = bridge.getActivePenaltySummary(tileInfo, 3);

        if (selectedItem) {
            if (itemEffects && itemEffects.isBridgeBuilderItem(selectedItem.id)) {
                return `Выбран предмет: ${selectedItem.label}. Подойди к узкому водному проходу и нажми "Использовать", чтобы уложить мост.`;
            }

            if (itemEffects && typeof itemEffects.canUseInventoryItem === 'function' && itemEffects.canUseInventoryItem(selectedItem)) {
                return `Выбран предмет: ${selectedItem.label}. Нажми "Использовать" для активации или "Изучить" для описания.`;
            }

            return `Выбран предмет: ${selectedItem.label}. Нажми "Изучить", чтобы увидеть описание.`;
        }

        if (groundItem && inventoryRuntime) {
            return `Под ногами лежит: ${inventoryRuntime.getGroundItemDescription(groundItem)}. Нажми "Использовать", чтобы подобрать.`;
        }

        if (selectedWorldInteraction) {
            return `${getInteractionDescriptionSafe(selectedWorldInteraction)} Нажми "Изучить", чтобы получить совет по прохождению.`;
        }

        if (selectedWorldTerrain) {
            return `${getTerrainInspectMessageSafe(selectedWorldTerrain)} Нажми "Изучить", чтобы увидеть совет по этой клетке.`;
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
    };

    updateActionButtons = function updateActionButtonsSafe(activeInteraction = game.state.activeInteraction) {
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
        const selectedWorldTileInfo = getSelectedWorldTileInfo();
        const selectedWorldInteraction = getSelectedWorldInteraction(selectedWorldTileInfo);
        const selectedWorldTerrain = getTerrainTargetForTile(selectedWorldTileInfo, { includeHarvested: true });
        const canDropItem = Boolean(selectedItem);
        const baseEnabled = !game.state.isGameOver && !game.state.isMoving;

        setActionButtonState(
            'use',
            baseEnabled && (canUseItem || canUseBridgeCharge || canUseGroundItem || canUseInteraction || canUseTerrain),
            Boolean(canUseItem || canUseBridgeCharge || canUseGroundItem || canUseInteraction || canUseTerrain)
        );
        setActionButtonState('talk', baseEnabled && Boolean(canTalkInteraction), Boolean(canTalkInteraction));
        setActionButtonState('sleep', baseEnabled, Boolean(shelterNearby || game.state.activeHouse));
        setActionButtonState(
            'inspect',
            baseEnabled,
            Boolean(selectedItem || groundItem || inspectableTerrain || activeInteraction || selectedWorldInteraction || selectedWorldTerrain || selectedWorldTileInfo)
        );
        setActionButtonState('drop', baseEnabled && canDropItem, canDropItem);
    };

    handleInspectAction = function handleInspectActionSafe() {
        const inventoryRuntime = getInventoryRuntime();
        const selectedItem = getSelectedInventoryItem();
        const groundItem = inventoryRuntime ? inventoryRuntime.getCurrentGroundItem() : null;
        const selectedWorldTileInfo = getSelectedWorldTileInfo();
        const selectedWorldInteraction = getSelectedWorldInteraction(selectedWorldTileInfo);
        const selectedWorldTerrain = getTerrainTargetForTile(selectedWorldTileInfo, { includeHarvested: true });
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

        if (selectedWorldInteraction) {
            bridge.setActionMessage(getInteractionAdviceSafe(selectedWorldInteraction));
            bridge.renderAfterStateChange();
            return;
        }

        if (selectedWorldTerrain) {
            bridge.setActionMessage(getTerrainAdviceMessage(selectedWorldTerrain));
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

        const tileInfo = selectedWorldTileInfo || routeInspectTileInfo || game.state.activeTileInfo;
        const tileLabel = bridge.getTileLabel(tileInfo ? tileInfo.tileType : 'grass');
        const progression = bridge.getCurrentProgression(tileInfo);
        const suffix = progression ? ` Остров ${progression.islandIndex}: ${progression.label}.` : '';
        const bandLabel = tileInfo ? bridge.getTravelBandLabel(tileInfo.travelBand) : bridge.getTravelBandLabel('normal');
        const weightLabel = tileInfo ? bridge.formatRouteCost(tileInfo.travelWeight) : '1.0';
        const travelLabel = tileInfo ? tileInfo.travelLabel || tileLabel : tileLabel;

        bridge.setActionMessage(`Изучить: ${travelLabel}, координаты ${tileInfo ? tileInfo.x : game.state.playerPos.x}, ${tileInfo ? tileInfo.y : game.state.playerPos.y}. Это ${bandLabel}, цена шага x${weightLabel}.${suffix}`);
        bridge.renderAfterStateChange();
    };

    Object.assign(actionUi, {
        describeSelectedWorldTarget,
        getDefaultActionHint,
        setActionButtonState,
        updateActionButtons,
        handleWalkAction,
        handleUseAction,
        handleInspectAction,
        handleTalkAction,
        handleActionClick
    });
})();
