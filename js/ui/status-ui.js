(() => {
    const statusUi = window.Game.systems.statusUi = window.Game.systems.statusUi || {};
    const bridge = window.Game.systems.uiBridge;
    const PAUSE_MENU_MODE_MAIN = 'main';
    const PAUSE_MENU_MODE_SAVE = 'save';
    const PAUSE_MENU_MODE_LOAD = 'load';
    const TIME_OF_DAY_LABELS = Object.freeze(['Рассвет', 'День', 'Сумерки', 'Ночь']);
    let sleepOverlayAnimationFrameId = null;
    let pauseMenuMode = PAUSE_MENU_MODE_MAIN;
    let pauseMenuStatusMessage = '';

    if (!bridge) {
        return;
    }

    function getSaveLoadSystem() {
        const game = bridge.getGame();
        return game && game.systems ? game.systems.saveLoad || null : null;
    }

    function getGameLifecycle() {
        return window.Game && window.Game.systems ? window.Game.systems.gameLifecycle || null : null;
    }

    function canUseSaveSlots() {
        return typeof localStorage !== 'undefined'
            && Boolean(getSaveLoadSystem());
    }

    function resetPauseMenuState() {
        pauseMenuMode = PAUSE_MENU_MODE_MAIN;
        pauseMenuStatusMessage = '';
    }

    function setPauseMenuMode(nextMode) {
        pauseMenuMode = nextMode;
        pauseMenuStatusMessage = '';
    }

    function setPauseMenuStatus(message) {
        pauseMenuStatusMessage = typeof message === 'string' ? message : '';
    }

    function getPauseModeSummary() {
        if (pauseMenuMode === PAUSE_MENU_MODE_SAVE) {
            return 'Выбери слот, чтобы сохранить текущее прохождение или перезаписать существующее.';
        }

        if (pauseMenuMode === PAUSE_MENU_MODE_LOAD) {
            return 'Выбери сохранённый слот, чтобы загрузить прохождение.';
        }

        return '';
    }

    function getTimeOfDayLabelByIndex(index) {
        if (!Number.isFinite(index)) {
            return 'Неизвестно';
        }

        return TIME_OF_DAY_LABELS[Math.max(0, Math.floor(index)) % TIME_OF_DAY_LABELS.length] || 'Неизвестно';
    }

    function formatSavedAt(savedAt) {
        if (typeof savedAt !== 'string' || !savedAt) {
            return 'Нет даты';
        }

        const parsedDate = new Date(savedAt);
        if (Number.isNaN(parsedDate.getTime())) {
            return 'Нет даты';
        }

        try {
            return new Intl.DateTimeFormat('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(parsedDate);
        } catch (error) {
            return parsedDate.toLocaleString('ru-RU');
        }
    }

    function buildPauseSlotMetaParts(slot) {
        const metadata = slot && slot.metadata ? slot.metadata : null;

        if (!metadata) {
            return [];
        }

        return [
            `Остров ${metadata.islandIndex || 1}`,
            getTimeOfDayLabelByIndex(metadata.currentTimeOfDayIndex),
            `Золото ${metadata.gold || 0}`,
            `Сумка ${metadata.occupiedInventorySlots || 0}`
        ];
    }

    function createPauseSlotCard(slot) {
        const article = document.createElement('article');
        const top = document.createElement('div');
        const label = document.createElement('div');
        const savedAt = document.createElement('div');
        const meta = document.createElement('div');
        const note = document.createElement('p');
        const actionButton = document.createElement('button');
        const isSaveMode = pauseMenuMode === PAUSE_MENU_MODE_SAVE;
        const isOccupied = Boolean(slot && slot.occupied);
        const metaParts = buildPauseSlotMetaParts(slot);

        article.className = 'pause-save-slot';
        if (!isOccupied) {
            article.classList.add('pause-save-slot--empty');
        }

        top.className = 'pause-save-slot__top';
        label.className = 'pause-save-slot__label';
        label.textContent = `Слот ${slot.slotId}`;
        savedAt.className = 'pause-save-slot__saved-at';
        savedAt.textContent = isOccupied ? formatSavedAt(slot.savedAt) : 'Пустой слот';
        top.append(label, savedAt);

        meta.className = 'pause-save-slot__meta';
        if (metaParts.length > 0) {
            metaParts.forEach((part) => {
                const chip = document.createElement('span');
                chip.textContent = part;
                meta.appendChild(chip);
            });
        } else {
            const chip = document.createElement('span');
            chip.textContent = 'Сохранения ещё нет';
            meta.appendChild(chip);
        }

        note.className = 'pause-save-slot__note';
        note.textContent = isSaveMode
            ? (isOccupied ? 'Перезапишет содержимое этого слота.' : 'Сохранит текущее прохождение в этот слот.')
            : (isOccupied ? 'Загрузит прохождение из этого слота.' : 'Этот слот пока пуст.');

        actionButton.type = 'button';
        actionButton.className = 'hud-button pause-save-slot__action';
        actionButton.setAttribute('data-pause-slot-id', String(slot.slotId));
        actionButton.textContent = isSaveMode
            ? (isOccupied ? 'Перезаписать' : 'Сохранить')
            : (isOccupied ? 'Загрузить' : 'Пусто');
        actionButton.disabled = !isSaveMode && !isOccupied;

        article.append(top, meta, note, actionButton);
        return article;
    }

    function renderPauseSlotMenu() {
        const elements = bridge.getElements();
        const saveLoad = getSaveLoadSystem();
        const isMainMode = pauseMenuMode === PAUSE_MENU_MODE_MAIN;
        const showSlotMenu = !isMainMode && canUseSaveSlots() && saveLoad && typeof saveLoad.listSaveSlots === 'function';
        const slots = showSlotMenu ? saveLoad.listSaveSlots() : [];

        if (elements.pauseMainActions) {
            elements.pauseMainActions.hidden = !isMainMode;
        }

        if (elements.pauseSlotMenu) {
            elements.pauseSlotMenu.hidden = !showSlotMenu;
        }

        if (elements.pwaStatus) {
            elements.pwaStatus.hidden = !isMainMode;
        }

        if (elements.pauseSlotMenuSummary) {
            elements.pauseSlotMenuSummary.textContent = getPauseModeSummary();
        }

        if (elements.pauseSlotMenuStatus) {
            const shouldShowStatus = typeof pauseMenuStatusMessage === 'string' && pauseMenuStatusMessage.trim() !== '';
            elements.pauseSlotMenuStatus.textContent = shouldShowStatus ? pauseMenuStatusMessage : '';
            elements.pauseSlotMenuStatus.hidden = !shouldShowStatus;
        }

        if (elements.pauseSlotList) {
            elements.pauseSlotList.replaceChildren();
            slots.forEach((slot) => {
                elements.pauseSlotList.appendChild(createPauseSlotCard(slot));
            });
        }
    }

    function openPauseSaveMenu() {
        if (!canUseSaveSlots()) {
            return false;
        }

        setPauseMenuMode(PAUSE_MENU_MODE_SAVE);
        bridge.renderAfterStateChange(['status']);
        return true;
    }

    function openPauseLoadMenu() {
        if (!canUseSaveSlots()) {
            return false;
        }

        setPauseMenuMode(PAUSE_MENU_MODE_LOAD);
        bridge.renderAfterStateChange(['status']);
        return true;
    }

    function closePauseSlotMenu() {
        resetPauseMenuState();
        bridge.renderAfterStateChange(['status']);
    }

    function handlePauseSlotListClick(event) {
        const actionButton = event.target.closest('[data-pause-slot-id]');
        const slotId = Number(actionButton && actionButton.getAttribute('data-pause-slot-id'));

        if (!actionButton || actionButton.disabled || !Number.isInteger(slotId)) {
            return false;
        }

        const saveLoad = getSaveLoadSystem();
        if (!saveLoad) {
            return false;
        }

        if (pauseMenuMode === PAUSE_MENU_MODE_SAVE) {
            const savedRecord = typeof saveLoad.saveToSlot === 'function'
                ? saveLoad.saveToSlot(slotId, bridge.getGame().state)
                : null;

            setPauseMenuStatus(savedRecord
                ? `Слот ${slotId} сохранён.`
                : `Не удалось сохранить слот ${slotId}.`);
            bridge.renderAfterStateChange(['status']);
            return Boolean(savedRecord);
        }

        if (pauseMenuMode === PAUSE_MENU_MODE_LOAD) {
            const lifecycle = getGameLifecycle();
            const loaded = lifecycle && typeof lifecycle.loadGameFromSlot === 'function'
                ? lifecycle.loadGameFromSlot(slotId)
                : false;

            if (!loaded) {
                setPauseMenuStatus(`Слот ${slotId} пуст или повреждён.`);
                bridge.renderAfterStateChange(['status']);
                return false;
            }

            resetPauseMenuState();
            return true;
        }

        return false;
    }

    function ensureSleepOverlay() {
        const elements = bridge.getElements();
        const sceneViewport = elements.sceneViewport;

        if (!sceneViewport) {
            return null;
        }

        let overlay = document.getElementById('sleepTransitionOverlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sleepTransitionOverlay';
            overlay.className = 'sleep-transition-overlay';
            overlay.hidden = true;
            overlay.setAttribute('aria-hidden', 'true');
            sceneViewport.appendChild(overlay);
        }

        return overlay;
    }

    function playSleepTransition() {
        const overlay = ensureSleepOverlay();

        if (!overlay) {
            return false;
        }

        if (sleepOverlayAnimationFrameId) {
            cancelAnimationFrame(sleepOverlayAnimationFrameId);
            sleepOverlayAnimationFrameId = null;
        }

        overlay.hidden = false;
        overlay.classList.remove('is-active');
        overlay.removeEventListener('animationend', handleSleepTransitionEnd);
        void overlay.offsetWidth;

        sleepOverlayAnimationFrameId = requestAnimationFrame(() => {
            overlay.classList.add('is-active');
            overlay.addEventListener('animationend', handleSleepTransitionEnd, { once: true });
            sleepOverlayAnimationFrameId = null;
        });

        return true;
    }

    function handleSleepTransitionEnd(event) {
        const overlay = event.currentTarget;

        if (!overlay) {
            return;
        }

        overlay.classList.remove('is-active');
        overlay.hidden = true;
    }

    function updateStats() {
        const elements = bridge.getElements();
        bridge.setStat(elements.statHungerValue, elements.statHungerBar, bridge.getStatValue('hunger'));
        bridge.setStat(elements.statEnergyValue, elements.statEnergyBar, bridge.getStatValue('energy'));
        bridge.setStat(elements.statSleepValue, elements.statSleepBar, bridge.getStatValue('sleep'));
        bridge.setStat(elements.statColdValue, elements.statColdBar, bridge.getStatValue('cold'));
        bridge.setStat(elements.statFocusValue, elements.statFocusBar, bridge.getStatValue('focus'));
    }

    function updateLocationSummaries(displayPosition, tileInfo, activeHouse, activeInteraction) {
        const game = bridge.getGame();
        const elements = bridge.getElements();
        const encounter = bridge.getHouseEncounter(activeInteraction);

        if (elements.locationSummary) {
            if (encounter) {
                elements.locationSummary.textContent = `Рядом: ${encounter.label}`;
            } else {
                elements.locationSummary.textContent = activeHouse
                    ? `Локация: ${activeHouse.expedition ? (activeHouse.expedition.locationLabel || activeHouse.expedition.label) : activeHouse.id}`
                    : `Локация: ${bridge.getTileLabel(tileInfo ? tileInfo.tileType : 'grass')}`;
            }
        }

        if (!elements.routeSummary) {
            return;
        }

        const position = bridge.roundPosition(displayPosition);
        const routeBreakdown = bridge.getRouteBandBreakdown();
        const routeReasons = bridge.getRouteReasonBreakdown();
        const warningParts = [];

        if ((routeBreakdown.rough || 0) > 0) {
            warningParts.push(`тяжёлых ${routeBreakdown.rough}`);
        }

        if ((routeBreakdown.hazard || 0) > 0) {
            warningParts.push(`опасных ${routeBreakdown.hazard}`);
        }

        const reasonSummary = Object.entries(routeReasons)
            .sort((left, right) => right[1] - left[1])
            .slice(0, 2)
            .map(([label, count]) => `${label} ${count}`)
            .join(', ');

        if (game.state.route.length > 0) {
            const previewSuffix = game.state.routePreviewLength > game.state.route.length
                ? ` из ${game.state.routePreviewLength}`
                : '';
            const fullCostSuffix = game.state.routePreviewLength > game.state.route.length
                ? ` (всего ${bridge.formatRouteCost(game.state.routePreviewTotalCost)})`
                : '';
            const warningSuffix = warningParts.length > 0
                ? ` · ${warningParts.join(', ')}`
                : '';
            const reasonSuffix = reasonSummary
                ? ` · ${reasonSummary}`
                : '';

            elements.routeSummary.textContent = `Маршрут: ${game.state.route.length}${previewSuffix} клеток · цена ${bridge.formatRouteCost(game.state.routeTotalCost)}${fullCostSuffix}${warningSuffix}${reasonSuffix}`;
            return;
        }

        const travelLabel = tileInfo ? tileInfo.travelLabel || bridge.getTileLabel(tileInfo.tileType) : bridge.getTileLabel('grass');
        const bandLabel = tileInfo ? bridge.getTravelBandLabel(tileInfo.travelBand) : bridge.getTravelBandLabel('normal');
        const tileCost = tileInfo ? bridge.formatRouteCost(tileInfo.travelWeight) : '1.0';
        elements.routeSummary.textContent = `Координаты: ${position.x}, ${position.y} · ${travelLabel} · ${bandLabel} · x${tileCost}`;
    }

    function updateProgressSummaries(tileInfo) {
        const game = bridge.getGame();
        const elements = bridge.getElements();
        const progression = bridge.getCurrentProgression(tileInfo);
        const finalIslandIndex = game.systems.expedition.finalIslandIndex;
        const timeOfDayLabel = bridge.getTimeOfDayLabel();
        const penaltySummary = bridge.getActivePenaltySummary(tileInfo, 2);
        const rewardScaling = game.systems.rewardScaling || null;
        const weatherRuntime = game.systems.weatherRuntime || null;
        const weatherLabel = weatherRuntime && typeof weatherRuntime.getWeatherLabel === 'function'
            ? weatherRuntime.getWeatherLabel(tileInfo)
            : 'Ясно';
        const islandPressureSummary = rewardScaling && typeof rewardScaling.getIslandPressureSummary === 'function'
            ? rewardScaling.getIslandPressureSummary(tileInfo)
            : 'Нагрузка острова 0/5';
        const outsideDrainMultiplier = rewardScaling && typeof rewardScaling.getOutsidePreviewDrainMultiplier === 'function'
            ? rewardScaling.getOutsidePreviewDrainMultiplier(tileInfo)
            : (progression ? progression.movementCostMultiplier : 1);
        const outsideRecoveryMultiplier = rewardScaling && typeof rewardScaling.getOutsidePreviewRecoveryMultiplier === 'function'
            ? rewardScaling.getOutsidePreviewRecoveryMultiplier(tileInfo)
            : (progression ? progression.recoveryMultiplier : 1);

        if (elements.progressSummary) {
            elements.progressSummary.textContent = progression
                ? `Остров ${progression.islandIndex} из ${finalIslandIndex} · ${progression.chunkCount} чанков · ${timeOfDayLabel} · ${weatherLabel} · ${progression.label}`
                : `Остров 1 из ${finalIslandIndex} · ${timeOfDayLabel}`;
        }

        if (elements.economySummary) {
            elements.economySummary.textContent = progression
                ? `Золото: ${bridge.getGold()} · Вне дома x${outsideDrainMultiplier.toFixed(2)} · ${islandPressureSummary} · Клетка x${bridge.formatRouteCost(tileInfo ? tileInfo.travelFactor : 1)} · Эффективность ${Math.round(outsideRecoveryMultiplier * 100)}%${penaltySummary ? ` · ${penaltySummary}` : ''}`
                : `Золото: ${bridge.getGold()} · Цена шага x1.00${penaltySummary ? ` · ${penaltySummary}` : ''}`;
        }
    }

    function updateCharacterCard(displayPosition, tileInfo, activeHouse, activeInteraction) {
        const game = bridge.getGame();
        const elements = bridge.getElements();
        const profile = game.state.playerProfile || {};
        const roundedPosition = bridge.roundPosition(displayPosition);
        const tileLabel = bridge.getTileLabel(tileInfo ? tileInfo.tileType : 'grass');
        const encounter = bridge.getHouseEncounter(activeInteraction);
        let stateLabel = 'Ожидает команду';

        if (game.state.hasWon) {
            stateLabel = 'Экспедиция завершена';
        } else if (game.state.isGameOver) {
            stateLabel = 'Состояние критическое';
        } else if (game.state.isPaused) {
            stateLabel = 'Игра на паузе';
        } else if (game.state.isMoving) {
            stateLabel = 'Идёт по маршруту';
        } else if (encounter) {
            stateLabel = `Рядом: ${encounter.label}`;
        } else if (activeHouse && activeHouse.expedition) {
            stateLabel = `В доме: ${activeHouse.expedition.locationLabel || activeHouse.expedition.label}`;
        }

        if (elements.selectedCharacterName) {
            elements.selectedCharacterName.textContent = profile.name || 'Путешественник';
        }

        if (elements.selectedCharacterRole) {
            elements.selectedCharacterRole.textContent = profile.role || 'Исследователь архипелага';
        }

        if (elements.selectedCharacterState) {
            elements.selectedCharacterState.textContent = stateLabel;
        }

        if (elements.selectedCharacterTile) {
            const bandLabel = tileInfo ? bridge.getTravelBandLabel(tileInfo.travelBand) : bridge.getTravelBandLabel('normal');
            const weightLabel = tileInfo ? bridge.formatRouteCost(tileInfo.travelWeight) : '1.0';
            const travelLabel = tileInfo ? tileInfo.travelLabel || tileLabel : tileLabel;
            elements.selectedCharacterTile.textContent = `Коорд: ${roundedPosition.x}, ${roundedPosition.y} · ${travelLabel} · ${bandLabel} · x${weightLabel}`;
        }
    }

    function syncStatusOverlay() {
        const game = bridge.getGame();
        const elements = bridge.getElements();
        const showOverlay = Boolean(game.state.isPaused || game.state.hasWon || game.state.isGameOver);
        const isDefeat = Boolean(!game.state.hasWon && bridge.isAllStatsDepleted());
        const isSaveMode = pauseMenuMode === PAUSE_MENU_MODE_SAVE;
        const isLoadMode = pauseMenuMode === PAUSE_MENU_MODE_LOAD;
        const isMainMode = pauseMenuMode === PAUSE_MENU_MODE_MAIN;
        const canUseSlots = canUseSaveSlots();

        if (!showOverlay) {
            resetPauseMenuState();
        }

        if (elements.pauseOverlay) {
            elements.pauseOverlay.classList.toggle('is-visible', showOverlay);
            elements.pauseOverlay.setAttribute('aria-hidden', showOverlay ? 'false' : 'true');
        }

        if (elements.statusOverlayKicker) {
            elements.statusOverlayKicker.textContent = isSaveMode
                ? 'Меню сохранения'
                : (
                    isLoadMode
                        ? 'Меню загрузки'
                        : (
                            game.state.hasWon
                                ? 'Экспедиция'
                                : (isDefeat ? '' : (game.state.isGameOver ? 'Статус' : 'Пауза'))
                        )
                );
        }

        if (elements.statusOverlayTitle) {
            elements.statusOverlayTitle.textContent = isSaveMode
                ? 'Сохранить'
                : (
                    isLoadMode
                        ? 'Загрузить'
                        : (
                            game.state.hasWon
                                ? 'Победа'
                                : (isDefeat ? 'Ты умер' : 'Пауза')
                        )
                );
        }

        if (elements.statusOverlayMessage) {
            const overlayMessage = isSaveMode
                ? 'Текущее прохождение сохранится в выбранный слот.'
                : (
                    isLoadMode
                        ? 'Загрузка заменит текущее прохождение состоянием выбранного слота.'
                        : (
                            game.state.hasWon
                                ? (game.state.victoryMessage || 'Главный сундук найден. Экспедиция завершена.')
                                : (
                                    isDefeat
                                        ? ''
                                        : (
                                            game.state.isGameOver
                                                ? 'Все характеристики упали до нуля. Нажми "Новая игра", чтобы начать заново.'
                                                : ''
                                        )
                                )
                        )
                );

            elements.statusOverlayMessage.textContent = overlayMessage;
            elements.statusOverlayMessage.hidden = !overlayMessage;
        }

        if (elements.pauseResumeButton) {
            const canResume = Boolean(game.state.isPaused && !game.state.isGameOver && !game.state.hasWon && !isDefeat && isMainMode);
            elements.pauseResumeButton.hidden = !canResume;
            elements.pauseResumeButton.disabled = !canResume;
        }

        if (elements.pauseSaveButton) {
            elements.pauseSaveButton.disabled = !canUseSlots;
        }

        if (elements.pauseLoadButton) {
            elements.pauseLoadButton.disabled = !canUseSlots;
        }

        renderPauseSlotMenu();

        if (elements.pauseButton) {
            const pauseLabel = game.state.isPaused ? 'Продолжить' : 'Пауза';
            elements.pauseButton.textContent = pauseLabel;
            elements.pauseButton.setAttribute('aria-label', pauseLabel);
            elements.pauseButton.setAttribute('title', pauseLabel);
            elements.pauseButton.disabled = Boolean(game.state.isGameOver);
        }

        document.body.classList.toggle('is-paused', Boolean(game.state.isPaused));
        document.body.classList.toggle('is-game-over', Boolean(game.state.isGameOver));
        document.body.classList.toggle('is-defeat', isDefeat);
    }

    function syncConditionOverlay() {
        const elements = bridge.getElements();
        if (!elements.sceneViewport) {
            return;
        }

        const state = bridge.getConditionScreenState();

        elements.sceneViewport.style.setProperty('--scene-canvas-filter', state.canvasFilter);
        elements.sceneViewport.style.setProperty('--condition-red-opacity', state.redOpacity);
        elements.sceneViewport.style.setProperty('--condition-dark-opacity', state.darkOpacity);
        elements.sceneViewport.style.setProperty('--condition-glitch-opacity', state.glitchOpacity);

        if (elements.conditionOverlay) {
            const isOverlayActive = state.mode === 'critical' || state.mode === 'death';
            elements.conditionOverlay.classList.toggle('is-active', isOverlayActive);
            elements.conditionOverlay.setAttribute('aria-hidden', isOverlayActive ? 'false' : 'true');
        }

        if (elements.conditionDeathLabel) {
            elements.conditionDeathLabel.hidden = state.mode !== 'death';
        }
    }

    function togglePause(forceValue) {
        const game = bridge.getGame();
        if (game.state.isGameOver) {
            return false;
        }

        const nextValue = typeof forceValue === 'boolean' ? forceValue : !game.state.isPaused;

        if (!nextValue || (nextValue && !game.state.isPaused)) {
            resetPauseMenuState();
        }

        game.state.isPaused = nextValue;

        if (typeof bridge.renderAfterStateChange === 'function') {
            bridge.renderAfterStateChange([
                'status',
                'character',
                'actions',
                'merchant',
                'dialogue',
                'quests',
                'map',
                'actionHint'
            ]);
        }

        return nextValue;
    }

    function startNewGame() {
        const lifecycle = window.Game.systems.gameLifecycle || null;

        if (!lifecycle || typeof lifecycle.startNewGame !== 'function') {
            return false;
        }

        resetPauseMenuState();
        lifecycle.startNewGame();
        return true;
    }

    function applyMovementStepCosts() {
        const game = bridge.getGame();
        const tileInfo = game.state.activeTileInfo;
        const routeStep = Array.isArray(game.state.route) ? game.state.route[game.state.currentTargetIndex] : null;
        const focusMultiplier = bridge.getFocusMultiplier();
        const criticalDrainMultiplier = bridge.getCriticalDepletionMultiplier();
        const baseTraversalCost = Number.isFinite(routeStep && routeStep.travelCost)
            ? routeStep.travelCost
            : game.systems.expedition.getTraversalWeight(tileInfo);
        const traversalDrain = Math.max(0, baseTraversalCost * focusMultiplier * criticalDrainMultiplier);
        const energyDrain = Math.max(0.45, traversalDrain * bridge.getStepEnergyDrainMultiplier(tileInfo));
        const openingHungerDrainMultiplier = bridge.getOpeningHungerDrainMultiplier();
        const hungerDrain = Math.max(0.45 * openingHungerDrainMultiplier, traversalDrain * openingHungerDrainMultiplier);
        const coldDelta = game.state.activeHouse
            ? bridge.scaleRecovery(3)
            : -Math.max(0.2, game.systems.expedition.scaleTraversalDrain(1 / bridge.coldDrainDivider, tileInfo) * criticalDrainMultiplier);

        bridge.applyStatDeltas({
            energy: -energyDrain,
            hunger: -hungerDrain,
            cold: coldDelta
        });

        if (game.systems.rewardScaling && typeof game.systems.rewardScaling.recordIslandTraversalStep === 'function') {
            game.systems.rewardScaling.recordIslandTraversalStep(tileInfo);
        }

        if (game.systems.itemEffects && typeof game.systems.itemEffects.consumeTravelStep === 'function') {
            game.systems.itemEffects.consumeTravelStep();
        }
    }

    function applyPathCompletionCosts() {
        const game = bridge.getGame();
        const focusMultiplier = bridge.getFocusMultiplier();
        const sleepDrain = Math.max(1, bridge.scaleDrain(focusMultiplier) * bridge.getSleepDrainMultiplier(game.state.activeTileInfo));

        bridge.applyStatDeltas({
            sleep: -sleepDrain,
            focus: -Math.max(1, Math.round(bridge.scaleDrain(1) * 0.75))
        });

        if (!game.state.isGameOver) {
            bridge.setActionMessage('Путь завершён. Сон и фокус немного снизились.');
        }
    }

    Object.assign(statusUi, {
        closePauseSlotMenu,
        handlePauseSlotListClick,
        openPauseLoadMenu,
        openPauseSaveMenu,
        updateStats,
        updateLocationSummaries,
        updateProgressSummaries,
        updateCharacterCard,
        syncStatusOverlay,
        syncConditionOverlay,
        playSleepTransition,
        startNewGame,
        togglePause,
        applyMovementStepCosts,
        applyPathCompletionCosts
    });
})();
