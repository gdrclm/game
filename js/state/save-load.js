(() => {
    const saveLoad = window.Game.systems.saveLoad = window.Game.systems.saveLoad || {};
    const stateSchema = window.Game.systems.stateSchema;
    const STORAGE_KEY = 'iso_game_save';

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function cloneValue(value) {
        return stateSchema.cloneValue(value);
    }

    function buildSaveSnapshot(state = window.Game.state) {
        const domains = stateSchema.splitStateByDomain(state);
        const uiSystem = window.Game.systems.ui;

        return {
            saveVersion: stateSchema.SAVE_VERSION,
            player: cloneValue(domains.player),
            world: cloneValue(domains.world),
            narrative: cloneValue(domains.narrative),
            ui: {
                ...cloneValue(domains.ui),
                lastActionMessage: uiSystem && typeof uiSystem.lastActionMessage === 'string'
                    ? uiSystem.lastActionMessage
                    : domains.ui.lastActionMessage,
                openMerchantHouseId: uiSystem && typeof uiSystem.openMerchantHouseId === 'string'
                    ? uiSystem.openMerchantHouseId
                    : domains.ui.openMerchantHouseId
            }
        };
    }

    function migrateLegacyStateToVersion1(state) {
        const domains = stateSchema.splitStateByDomain(state);
        return {
            saveVersion: stateSchema.SAVE_VERSION,
            player: domains.player,
            world: domains.world,
            narrative: domains.narrative,
            ui: domains.ui
        };
    }

    function normalizeSnapshot(snapshot) {
        const normalizedDomains = stateSchema.normalizeDomains({
            meta: {
                saveVersion: typeof snapshot.saveVersion === 'number'
                    ? snapshot.saveVersion
                    : stateSchema.SAVE_VERSION
            },
            player: isPlainObject(snapshot.player) ? snapshot.player : {},
            world: isPlainObject(snapshot.world) ? snapshot.world : {},
            narrative: isPlainObject(snapshot.narrative) ? snapshot.narrative : {},
            ui: isPlainObject(snapshot.ui) ? snapshot.ui : {}
        });

        return {
            saveVersion: normalizedDomains.meta.saveVersion,
            player: normalizedDomains.player,
            world: normalizedDomains.world,
            narrative: normalizedDomains.narrative,
            ui: normalizedDomains.ui
        };
    }

    function migrateSnapshot(rawSnapshot) {
        if (!rawSnapshot || typeof rawSnapshot !== 'object') {
            return normalizeSnapshot(buildSaveSnapshot(stateSchema.createInitialState()));
        }

        if (rawSnapshot.player || rawSnapshot.world || rawSnapshot.narrative || rawSnapshot.ui) {
            return normalizeSnapshot({
                ...rawSnapshot,
                saveVersion: typeof rawSnapshot.saveVersion === 'number'
                    ? rawSnapshot.saveVersion
                    : stateSchema.SAVE_VERSION
            });
        }

        return normalizeSnapshot(migrateLegacyStateToVersion1(rawSnapshot));
    }

    function hydrateStateFromSnapshot(snapshot) {
        const migrated = migrateSnapshot(snapshot);

        return stateSchema.createStateFromDomains({
            meta: {
                saveVersion: migrated.saveVersion
            },
            player: migrated.player,
            world: migrated.world,
            narrative: migrated.narrative,
            ui: migrated.ui,
            runtime: stateSchema.createDomainState().runtime
        });
    }

    function resetRuntimeState(targetState) {
        const nextState = stateSchema.createInitialState();
        const destination = targetState && typeof targetState === 'object' ? targetState : {};

        Object.keys(destination).forEach((key) => {
            delete destination[key];
        });
        Object.assign(destination, nextState);
        return destination;
    }

    function applySnapshotToState(targetState, snapshot) {
        const nextState = hydrateStateFromSnapshot(snapshot);
        const destination = targetState && typeof targetState === 'object' ? targetState : {};

        Object.keys(destination).forEach((key) => {
            delete destination[key];
        });
        Object.assign(destination, nextState);
        return destination;
    }

    function serializeState(state = window.Game.state) {
        return JSON.stringify(buildSaveSnapshot(state));
    }

    function parseState(serializedState) {
        return hydrateStateFromSnapshot(JSON.parse(serializedState));
    }

    function saveToStorage(state = window.Game.state, storageKey = STORAGE_KEY) {
        if (typeof localStorage === 'undefined') {
            return false;
        }

        localStorage.setItem(storageKey, serializeState(state));
        return true;
    }

    function loadFromStorage(storageKey = STORAGE_KEY) {
        if (typeof localStorage === 'undefined') {
            return null;
        }

        const serializedState = localStorage.getItem(storageKey);
        if (!serializedState) {
            return null;
        }

        return parseState(serializedState);
    }

    function clearStorage(storageKey = STORAGE_KEY) {
        if (typeof localStorage === 'undefined') {
            return false;
        }

        localStorage.removeItem(storageKey);
        return true;
    }

    Object.assign(saveLoad, {
        STORAGE_KEY,
        applySnapshotToState,
        buildSaveSnapshot,
        clearStorage,
        hydrateStateFromSnapshot,
        loadFromStorage,
        migrateLegacyStateToVersion1,
        migrateSnapshot,
        parseState,
        resetRuntimeState,
        saveToStorage,
        serializeState
    });
})();
