(() => {
    const game = window.Game;
    const npcRuntime = game.systems.npcRuntime = game.systems.npcRuntime || {};

    function getNpcRegistry() {
        return game.systems.npcRegistry || null;
    }

    function getNpcStateStore() {
        game.state.npcStateByNpcId = game.state.npcStateByNpcId || {};
        return game.state.npcStateByNpcId;
    }

    function buildNpcId(source, encounter) {
        if (!encounter) {
            return null;
        }

        if (source && source.houseId && encounter.kind) {
            return `${encounter.kind}:${source.houseId}`;
        }

        if (source && source.id && encounter.kind) {
            return `${encounter.kind}:${source.id}`;
        }

        return encounter.kind || null;
    }

    function resolveNpcForInteraction(source) {
        const encounter = source && source.expedition ? source.expedition : null;
        const registry = getNpcRegistry();
        const definition = registry && typeof registry.getNpcDefinitionByEncounter === 'function'
            ? registry.getNpcDefinitionByEncounter(encounter)
            : null;

        if (!encounter || !definition) {
            return null;
        }

        const npcId = buildNpcId(source, encounter);
        if (!npcId) {
            return null;
        }

        const stateStore = getNpcStateStore();
        stateStore[npcId] = stateStore[npcId] || {};

        return {
            npcId,
            source,
            encounter,
            definition,
            label: encounter.label || definition.label,
            dialogueId: encounter.dialogueId || definition.defaultDialogueId,
            state: stateStore[npcId]
        };
    }

    Object.assign(npcRuntime, {
        getNpcStateStore,
        buildNpcId,
        resolveNpcForInteraction
    });
})();
