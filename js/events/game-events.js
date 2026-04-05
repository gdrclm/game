(() => {
    const game = window.Game;
    const gameEvents = game.systems.gameEvents = game.systems.gameEvents || {};
    const listenersByType = new Map();

    const EVENTS = Object.freeze({
        RESOURCE_GATHERED: 'resource:gathered',
        CRAFT_COMPLETED: 'craft:completed',
        CONTAINER_CHANGED: 'container:changed',
        STATION_USED: 'station:used',
        RECIPE_UNLOCKED: 'recipe:unlocked'
    });

    function getEventType(type) {
        return typeof type === 'string' ? type.trim() : '';
    }

    function getListeners(type, createIfMissing = false) {
        const eventType = getEventType(type);

        if (!eventType) {
            return null;
        }

        if (!listenersByType.has(eventType) && createIfMissing) {
            listenersByType.set(eventType, new Set());
        }

        return listenersByType.get(eventType) || null;
    }

    function off(type, listener) {
        const listeners = getListeners(type);

        if (!listeners || typeof listener !== 'function') {
            return false;
        }

        const removed = listeners.delete(listener);

        if (listeners.size === 0) {
            listenersByType.delete(getEventType(type));
        }

        return removed;
    }

    function on(type, listener) {
        if (typeof listener !== 'function') {
            return () => {};
        }

        const listeners = getListeners(type, true);

        if (!listeners) {
            return () => {};
        }

        listeners.add(listener);
        return () => off(type, listener);
    }

    function once(type, listener) {
        if (typeof listener !== 'function') {
            return () => {};
        }

        let unsubscribe = null;
        const wrappedListener = (event) => {
            if (unsubscribe) {
                unsubscribe();
            }
            listener(event);
        };

        unsubscribe = on(type, wrappedListener);
        return unsubscribe;
    }

    function emit(type, payload = {}) {
        const eventType = getEventType(type);

        if (!eventType) {
            return null;
        }

        const listeners = getListeners(eventType);
        const event = {
            type: eventType,
            payload,
            emittedAt: Date.now()
        };

        if (!listeners || listeners.size === 0) {
            return event;
        }

        [...listeners].forEach((listener) => {
            try {
                listener(event);
            } catch (error) {
                console.error(`[game-events] Listener failed for "${eventType}".`, error);
            }
        });

        return event;
    }

    function clear(type) {
        const eventType = getEventType(type);

        if (!eventType) {
            return false;
        }

        return listenersByType.delete(eventType);
    }

    function clearAll() {
        listenersByType.clear();
    }

    function getListenerCount(type) {
        const listeners = getListeners(type);
        return listeners ? listeners.size : 0;
    }

    function emitResourceGathered(payload = {}) {
        return emit(EVENTS.RESOURCE_GATHERED, payload);
    }

    function emitCraftCompleted(payload = {}) {
        return emit(EVENTS.CRAFT_COMPLETED, payload);
    }

    function emitContainerChanged(payload = {}) {
        return emit(EVENTS.CONTAINER_CHANGED, payload);
    }

    function emitStationUsed(payload = {}) {
        return emit(EVENTS.STATION_USED, payload);
    }

    function emitRecipeUnlocked(payload = {}) {
        return emit(EVENTS.RECIPE_UNLOCKED, payload);
    }

    Object.assign(gameEvents, {
        EVENTS,
        clear,
        clearAll,
        emit,
        emitContainerChanged,
        emitCraftCompleted,
        emitRecipeUnlocked,
        emitResourceGathered,
        emitStationUsed,
        getListenerCount,
        off,
        on,
        once
    });
})();
