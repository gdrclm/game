(() => {
    const game = window.Game;
    const dialogueUi = game.systems.dialogueUi = game.systems.dialogueUi || {};
    const bridge = game.systems.uiBridge;

    if (!bridge) {
        return;
    }

    function syncDialogueState() {
        const runtime = game.systems.dialogueRuntime;
        const active = runtime && typeof runtime.getActiveDialogueState === 'function'
            ? runtime.getActiveDialogueState()
            : null;

        if (!active) {
            return;
        }

        if (active.text) {
            bridge.setActionMessage(active.text);
        }
    }

    Object.assign(dialogueUi, {
        syncDialogueState
    });
})();
