(() => {
    const game = window.Game;
    const effects = game.systems.effects = game.systems.effects || {};
    const activeEffectsBuffer = [];

    function getNow() {
        if (window.performance && typeof window.performance.now === 'function') {
            return window.performance.now();
        }

        return Date.now();
    }

    function getEffectList() {
        game.state.transientEffects = Array.isArray(game.state.transientEffects) ? game.state.transientEffects : [];
        return game.state.transientEffects;
    }

    function pruneExpiredEffects(timestamp = getNow()) {
        const effectList = getEffectList();
        let writeIndex = 0;

        for (let readIndex = 0; readIndex < effectList.length; readIndex++) {
            const effect = effectList[readIndex];

            if (!effect || timestamp >= effect.startTime + effect.duration) {
                continue;
            }

            effectList[writeIndex] = effect;
            writeIndex += 1;
        }

        effectList.length = writeIndex;
        return effectList;
    }

    function stopEffectLoop() {
        if (game.state.effectAnimationRequestId) {
            cancelAnimationFrame(game.state.effectAnimationRequestId);
            game.state.effectAnimationRequestId = null;
        }
    }

    function pushEffect(effect) {
        getEffectList().push(effect);

        if (game.systems.render && typeof game.systems.render.render === 'function') {
            game.systems.render.render();
        }
    }

    function snapshotInteraction(interaction) {
        return {
            id: interaction.id,
            kind: interaction.kind,
            worldX: interaction.worldX,
            worldY: interaction.worldY
        };
    }

    function snapshotPosition(position, kind = 'reward') {
        const worldX = Math.round(position.x);
        const worldY = Math.round(position.y);

        return {
            id: `effect:${kind}:${worldX},${worldY}`,
            kind,
            worldX,
            worldY
        };
    }

    function spawnRewardFloats(snapshot, rewardDrops = [], startTime = getNow()) {
        const visibleDrops = Array.isArray(rewardDrops) ? rewardDrops.slice(0, 3) : [];

        visibleDrops.forEach((drop, index) => {
            pushEffect({
                type: 'rewardFloat',
                interaction: snapshot,
                startTime: startTime + index * 110,
                duration: 1200,
                drop,
                driftX: (index - (visibleDrops.length - 1) / 2) * 10
            });
        });
    }

    function spawnChestResolution(interaction, lootDrops = []) {
        const now = getNow();
        const snapshot = snapshotInteraction(interaction);

        pushEffect({
            type: 'chestBurst',
            interaction: snapshot,
            startTime: now,
            duration: 520
        });

        spawnRewardFloats(snapshot, lootDrops, now);
    }

    function spawnInventoryUse(position, rewardDrops = []) {
        if (!position) {
            return;
        }

        spawnRewardFloats(snapshotPosition(position, 'inventory'), rewardDrops);
    }

    function getActiveEffects(timestamp = getNow()) {
        const effectList = pruneExpiredEffects(timestamp);
        activeEffectsBuffer.length = 0;

        for (let index = 0; index < effectList.length; index++) {
            const effect = effectList[index];

            if (timestamp >= effect.startTime) {
                activeEffectsBuffer.push(effect);
            }
        }

        return activeEffectsBuffer;
    }

    function clearAllEffects() {
        const effectList = getEffectList();
        effectList.length = 0;
        activeEffectsBuffer.length = 0;
        stopEffectLoop();
    }

    Object.assign(effects, {
        getNow,
        getActiveEffects,
        pruneExpiredEffects,
        spawnChestResolution,
        spawnInventoryUse,
        clearAllEffects
    });
})();
