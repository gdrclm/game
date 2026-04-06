(() => {
    const game = window.Game;

    if (!game || !game.systems) {
        return;
    }

    const bridge = game.systems.uiBridge = game.systems.uiBridge || {};
    const ui = game.systems.ui = game.systems.ui || {};

    function clampStat(value) {
        return Math.max(0, Math.min(100, value));
    }

    function ensureStats() {
        if (!game.state || typeof game.state !== 'object') {
            return {};
        }

        game.state.survivalStats = game.state.survivalStats || {
            hunger: 100,
            energy: 100,
            sleep: 100,
            cold: 100,
            focus: 100
        };
        return game.state.survivalStats;
    }

    function createNoopContext() {
        return {
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            font: '',
            textAlign: 'center',
            textBaseline: 'middle',
            save() {},
            restore() {},
            translate() {},
            beginPath() {},
            moveTo() {},
            lineTo() {},
            closePath() {},
            fill() {},
            stroke() {},
            fillRect() {},
            arc() {},
            ellipse() {},
            quadraticCurveTo() {},
            fillText() {}
        };
    }

    Object.assign(bridge, {
        lastActionMessage: '',
        renderCallCount: 0,
        pathCompletionCostCount: 0,
        lastActionContextKey: '',
        coldDrainDivider: 6,
        setActionMessage(message = '') {
            this.lastActionMessage = message;
            ui.lastActionMessage = message;
        },
        renderAfterStateChange() {
            this.renderCallCount += 1;
        },
        applyPathCompletionCosts() {
            this.pathCompletionCostCount += 1;
            return true;
        },
        getElements() {
            return {
                actionButtons: []
            };
        },
        getHouseEncounter(interaction = null) {
            return interaction && interaction.expedition
                ? interaction.expedition
                : null;
        },
        getTileLabel(tileType = '') {
            return tileType;
        },
        getCurrentProgression() {
            const activeTileInfo = game.state && game.state.activeTileInfo ? game.state.activeTileInfo : null;
            if (activeTileInfo && activeTileInfo.progression) {
                return activeTileInfo.progression;
            }

            return {
                islandIndex: game.state && game.state.currentIslandIndex ? game.state.currentIslandIndex : 1,
                label: 'Тест'
            };
        },
        getTravelBandLabel(travelBand = 'normal') {
            return travelBand;
        },
        formatRouteCost(value = 0) {
            return String(Math.round(Number(value || 0) * 100) / 100);
        },
        getActivePenaltySummary(tileInfo, maxEntries) {
            const rewardScaling = game.systems.rewardScaling || null;
            return rewardScaling && typeof rewardScaling.getActivePenaltySummary === 'function'
                ? rewardScaling.getActivePenaltySummary(tileInfo, maxEntries)
                : '';
        },
        getFocusMultiplier() {
            const rewardScaling = game.systems.rewardScaling || null;
            return rewardScaling && typeof rewardScaling.getFocusMultiplier === 'function'
                ? rewardScaling.getFocusMultiplier()
                : 1;
        },
        getCriticalDepletionMultiplier() {
            const rewardScaling = game.systems.rewardScaling || null;
            return rewardScaling && typeof rewardScaling.getCriticalDepletionMultiplier === 'function'
                ? rewardScaling.getCriticalDepletionMultiplier()
                : 1;
        },
        getOpeningHungerDrainMultiplier() {
            return 1;
        },
        getStepEnergyDrainMultiplier(tileInfo) {
            const rewardScaling = game.systems.rewardScaling || null;
            return rewardScaling && typeof rewardScaling.getStepEnergyDrainMultiplier === 'function'
                ? rewardScaling.getStepEnergyDrainMultiplier(tileInfo)
                : 1;
        },
        getRouteLengthLimit() {
            const rewardScaling = game.systems.rewardScaling || null;
            return rewardScaling && typeof rewardScaling.getRouteLengthLimit === 'function'
                ? rewardScaling.getRouteLengthLimit()
                : Math.max(1, game.config.maxMoveCellsPerTurn || 5);
        },
        getStatValue(statKey) {
            const stats = ensureStats();
            return Number.isFinite(stats[statKey]) ? stats[statKey] : 0;
        },
        setStatValue(statKey, value) {
            const stats = ensureStats();
            stats[statKey] = clampStat(Number(value) || 0);
            return stats[statKey];
        },
        getAdjustedRecoveryAmount(statKey, value) {
            void statKey;
            return Math.max(0, Number(value) || 0);
        },
        ensureGameOverState() {
            return false;
        },
        getStatLabel(statKey = '') {
            const labels = {
                hunger: 'Голод',
                energy: 'Энергия',
                sleep: 'Сон',
                cold: 'Холод',
                focus: 'Фокус'
            };
            return labels[statKey] || statKey;
        },
        getStatEffectIcon(statKey = '') {
            const icons = {
                hunger: 'HG',
                energy: 'EN',
                sleep: 'SL',
                cold: 'CL',
                focus: 'FC'
            };
            return icons[statKey] || '+';
        },
        describeAppliedRewards(applied = {}) {
            return Object.entries(applied)
                .filter(([, value]) => Number.isFinite(value) && value > 0)
                .map(([statKey, value]) => `${this.getStatLabel(statKey)} +${value}`)
                .join(', ');
        },
        applyStatDeltas(deltas = {}) {
            const stats = ensureStats();

            Object.entries(deltas).forEach(([key, delta]) => {
                if (!Number.isFinite(delta)) {
                    return;
                }

                stats[key] = clampStat((stats[key] || 0) + delta);
            });
        },
        getItemDescription(itemId = '') {
            const itemRegistry = game.systems.itemRegistry || null;
            return itemRegistry && typeof itemRegistry.describeItem === 'function'
                ? itemRegistry.describeItem(itemId)
                : itemId;
        },
        inspectActiveHouse() {
            return false;
        },
        isHouseResolved(interaction = null) {
            return Boolean(interaction && game.state && game.state.resolvedHouseIds && game.state.resolvedHouseIds[interaction.houseId]);
        },
        performSleep() {
            this.setActionMessage('Сон в тестовом окружении не активирован.');
            this.renderAfterStateChange();
        },
        resolveHouseUse(interaction = null) {
            this.setActionMessage(interaction && interaction.label
                ? `Тестовое использование: ${interaction.label}.`
                : 'Использование недоступно в тестовом окружении.');
            this.renderAfterStateChange();
        }
    });

    Object.assign(ui, {
        lastActionMessage: '',
        setActionMessage(message = '') {
            bridge.setActionMessage(message);
        },
        renderAfterStateChange() {
            bridge.renderAfterStateChange();
        },
        applyPathCompletionCosts() {
            return bridge.applyPathCompletionCosts();
        }
    });

    game.systems.itemEffects = game.systems.itemEffects || {};
    Object.assign(game.systems.itemEffects, {
        canUseInventoryItem() {
            return false;
        },
        useInventoryItem() {
            return {
                message: 'Тестовый активный эффект недоступен.'
            };
        },
        canUseBridgeCharge() {
            return false;
        },
        useBridgeCharge() {
            return {
                message: 'Тестовый мостовой заряд недоступен.'
            };
        },
        isBridgeBuilderItem() {
            return false;
        },
        buildItemEffectDrop(item) {
            return item ? { ...item } : null;
        },
        consumeTravelStep() {},
        getModifierSnapshot() {
            return {
                drainMultiplier: 1,
                recoveryMultiplier: 1,
                foodRecoveryMultiplier: 1,
                routeLengthBonus: 0
            };
        }
    });

    game.systems.dialogueRuntime = game.systems.dialogueRuntime || {};
    Object.assign(game.systems.dialogueRuntime, {
        canStartDialogue() {
            return false;
        }
    });

    game.systems.effects = game.systems.effects || {};
    Object.assign(game.systems.effects, {
        spawnInventoryUse() {}
    });

    game.systems.expedition = game.systems.expedition || {};
    Object.assign(game.systems.expedition, {
        scaleTraversalDrain(value = 0) {
            return Math.max(0, Number(value) || 0);
        },
        getTraversalWeight(tileInfo = null) {
            return tileInfo && Number.isFinite(tileInfo.travelWeight)
                ? Math.max(0.25, tileInfo.travelWeight)
                : 1;
        },
        getBridgeDurability() {
            return 2;
        }
    });

    game.systems.render = game.systems.render || {};
    Object.assign(game.systems.render, {
        advanceTimeOfDay(stepCount = 1) {
            const phases = [
                { key: 'dawn', label: 'Рассвет' },
                { key: 'day', label: 'День' },
                { key: 'dusk', label: 'Сумерки' },
                { key: 'night', label: 'Ночь' }
            ];
            const currentIndex = Number.isFinite(game.state.timeOfDayIndex) ? game.state.timeOfDayIndex : 0;
            const nextIndex = (currentIndex + Math.max(1, Math.floor(stepCount))) % phases.length;
            game.state.timeOfDayIndex = nextIndex;
            return phases[nextIndex];
        }
    });

    game.systems.weatherRuntime = game.systems.weatherRuntime || {};
    Object.assign(game.systems.weatherRuntime, {
        getWeather(tileInfo = null) {
            const weatherKey = tileInfo && typeof tileInfo.weatherKey === 'string'
                ? tileInfo.weatherKey
                : 'clear';

            if (weatherKey === 'storm') {
                return {
                    key: 'storm',
                    label: 'Шторм',
                    routeMultiplier: 1.15,
                    drainMultiplier: 1.12,
                    recoveryMultiplier: 0.92,
                    coldDrainMultiplier: 1.15,
                    sleepDrainMultiplier: 1.12
                };
            }

            if (weatherKey === 'rain') {
                return {
                    key: 'rain',
                    label: 'Дождь',
                    routeMultiplier: 1.05,
                    drainMultiplier: 1.06,
                    recoveryMultiplier: 0.97,
                    coldDrainMultiplier: 1.05,
                    sleepDrainMultiplier: 1.04
                };
            }

            return {
                key: 'clear',
                label: 'Ясно',
                routeMultiplier: 1,
                drainMultiplier: 1,
                recoveryMultiplier: 1,
                coldDrainMultiplier: 1,
                sleepDrainMultiplier: 1
            };
        }
    });

    game.systems.courierRuntime = game.systems.courierRuntime || {};
    Object.assign(game.systems.courierRuntime, {
        processDueCourierJobs() {
            return null;
        }
    });

    game.systems.houseLayout = game.systems.houseLayout || {};
    Object.assign(game.systems.houseLayout, {
        tileKey(x, y) {
            return `${x},${y}`;
        }
    });

    game.systems.content = game.systems.content || {};
    Object.assign(game.systems.content, {
        isGroundTile(tileType = '') {
            return tileType !== 'void';
        },
        getTileRouteBand(tileType = '') {
            if (tileType === 'rock' || tileType === 'rubble') {
                return 'rough';
            }

            if (tileType === 'bad' || tileType === 'lava') {
                return 'hazard';
            }

            return 'normal';
        },
        getTravelZoneDefinition(travelZoneKey = 'none') {
            if (travelZoneKey === 'badSector') {
                return { routeBand: 'hazard' };
            }

            if (travelZoneKey === 'roughSector') {
                return { routeBand: 'rough' };
            }

            return { routeBand: 'normal' };
        }
    });

    game.systems.camera = game.systems.camera || {};
    Object.assign(game.systems.camera, {
        isoToScreen(x, y) {
            return { x, y };
        }
    });

    game.ctx = game.ctx || createNoopContext();
})();
