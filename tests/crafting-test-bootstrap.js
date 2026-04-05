(() => {
    const game = window.Game;

    if (!game || !game.systems) {
        return;
    }

    const bridge = game.systems.uiBridge = game.systems.uiBridge || {};

    Object.assign(bridge, {
        lastActionMessage: '',
        renderCallCount: 0,
        setActionMessage(message = '') {
            this.lastActionMessage = message;
        },
        renderAfterStateChange() {
            this.renderCallCount += 1;
        },
        getElements() {
            return {
                actionButtons: []
            };
        },
        getHouseEncounter() {
            return null;
        },
        getTileLabel(tileType = '') {
            return tileType;
        },
        getCurrentProgression() {
            return {
                islandIndex: game.state && game.state.currentIslandIndex ? game.state.currentIslandIndex : 1,
                label: 'Тест'
            };
        },
        getTravelBandLabel(travelBand = 'normal') {
            return travelBand;
        },
        formatRouteCost(value = 0) {
            return String(value);
        },
        getActivePenaltySummary() {
            return '';
        }
    });
})();
