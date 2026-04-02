(() => {
    const pricing = window.Game.systems.pricing = window.Game.systems.pricing || {};

    function getItemRegistry() {
        return window.Game.systems.itemRegistry || window.Game.systems.loot || null;
    }

    function getItemBaseValue(itemId) {
        const itemRegistry = getItemRegistry();

        if (itemRegistry && typeof itemRegistry.getItemBaseValue === 'function') {
            return itemRegistry.getItemBaseValue(itemId);
        }

        return 1;
    }

    function normalizeIslandIndex(islandIndex = 1) {
        return Math.max(1, Math.round(islandIndex || 1));
    }

    function getModifierSnapshot(context = {}) {
        const itemEffects = window.Game.systems.itemEffects || null;
        return itemEffects && typeof itemEffects.getModifierSnapshot === 'function'
            ? itemEffects.getModifierSnapshot(context)
            : {
                merchantBuyMultiplier: 1,
                merchantSellMultiplier: 1
            };
    }

    function getMerchantBuyPrice(itemId, islandIndex = 1) {
        const normalizedIslandIndex = normalizeIslandIndex(islandIndex);
        const snapshot = getModifierSnapshot({ currentIslandIndex: normalizedIslandIndex });
        const basePrice = Math.max(2, Math.round(getItemBaseValue(itemId) * 1.22 + normalizedIslandIndex * 0.35));
        return Math.max(1, Math.round(basePrice * (snapshot.merchantBuyMultiplier || 1)));
    }

    function getMerchantSellPrice(itemId, islandIndex = 1) {
        const normalizedIslandIndex = normalizeIslandIndex(islandIndex);
        const snapshot = getModifierSnapshot({ currentIslandIndex: normalizedIslandIndex });
        return Math.max(1, Math.round(getMerchantBuyPrice(itemId, islandIndex) * 0.55 * (snapshot.merchantSellMultiplier || 1)));
    }

    Object.assign(pricing, {
        getItemBaseValue,
        getMerchantBuyPrice,
        getMerchantSellPrice
    });
})();
