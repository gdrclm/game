(() => {
    const statusUi = window.Game.systems.statusUi = window.Game.systems.statusUi || {};
    const bridge = window.Game.systems.uiBridge;
    let sleepOverlayAnimationFrameId = null;

    if (!bridge) {
        return;
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
                    ? `Локация: ${activeHouse.expedition ? activeHouse.expedition.label : activeHouse.id}`
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
            stateLabel = `В доме: ${activeHouse.expedition.label}`;
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
        const showOverlay = Boolean(game.state.isPaused || game.state.hasWon);
        const isDefeat = Boolean(!game.state.hasWon && bridge.isAllStatsDepleted());

        if (elements.pauseOverlay) {
            elements.pauseOverlay.classList.toggle('is-visible', showOverlay);
            elements.pauseOverlay.setAttribute('aria-hidden', showOverlay ? 'false' : 'true');
        }

        if (elements.statusOverlayKicker) {
            elements.statusOverlayKicker.textContent = game.state.hasWon
                ? 'Экспедиция'
                : (isDefeat ? '' : (game.state.isGameOver ? 'Статус' : 'Пауза'));
        }

        if (elements.statusOverlayTitle) {
            elements.statusOverlayTitle.textContent = game.state.hasWon
                ? 'Победа'
                : (isDefeat ? 'Ты умер' : 'Пауза');
        }

        if (elements.statusOverlayMessage) {
            elements.statusOverlayMessage.textContent = game.state.hasWon
                ? (game.state.victoryMessage || 'Главный сундук найден. Экспедиция завершена.')
                : (
                    isDefeat
                        ? ''
                        : (
                            game.state.isGameOver
                                ? 'Все характеристики упали до нуля. Обнови страницу, чтобы начать заново.'
                                : ''
                        )
                );
        }

        if (elements.pauseButton) {
            const pauseLabel = game.state.isPaused ? 'Продолжить' : 'Пауза';
            elements.pauseButton.textContent = pauseLabel;
            elements.pauseButton.setAttribute('aria-label', pauseLabel);
            elements.pauseButton.setAttribute('title', pauseLabel);
            elements.pauseButton.disabled = Boolean(game.state.isGameOver);
        }

        if (elements.pauseResumeButton) {
            const canResume = Boolean(game.state.isPaused && !game.state.isGameOver && !game.state.hasWon && !isDefeat);
            elements.pauseResumeButton.hidden = !canResume;
            elements.pauseResumeButton.disabled = !canResume;
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
        const hungerDrain = Math.max(0.45, traversalDrain);
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
        updateStats,
        updateLocationSummaries,
        updateProgressSummaries,
        updateCharacterCard,
        syncStatusOverlay,
        syncConditionOverlay,
        playSleepTransition,
        togglePause,
        applyMovementStepCosts,
        applyPathCompletionCosts
    });
})();
