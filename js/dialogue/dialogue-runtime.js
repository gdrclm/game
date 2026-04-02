(() => {
    const game = window.Game;
    const dialogueRuntime = game.systems.dialogueRuntime = game.systems.dialogueRuntime || {};

    let activeSource = null;
    let activeNpc = null;

    function getDialogueRegistry() {
        return game.systems.dialogueRegistry || null;
    }

    function getNpcRuntime() {
        return game.systems.npcRuntime || null;
    }

    function evaluateValue(value, context) {
        return typeof value === 'function' ? value(context) : value;
    }

    function clearDialogue() {
        game.state.activeDialogueId = null;
        game.state.activeDialogueNodeId = null;
        activeSource = null;
        activeNpc = null;
    }

    function buildContext(source, npc = null) {
        const resolvedNpc = npc || (getNpcRuntime() && typeof getNpcRuntime().resolveNpcForInteraction === 'function'
            ? getNpcRuntime().resolveNpcForInteraction(source)
            : null);

        if (!resolvedNpc) {
            return null;
        }

        return {
            game,
            source,
            npc: resolvedNpc,
            encounter: resolvedNpc.encounter
        };
    }

    function applyEffect(effect, context) {
        if (!effect || !effect.type) {
            return;
        }

        if (effect.type === 'setActionMessage') {
            const ui = game.systems.ui;
            const message = evaluateValue(effect.value, context);
            if (ui && typeof ui.setActionMessage === 'function' && message) {
                ui.setActionMessage(message);
            }
            return;
        }

        if (effect.type === 'openMerchantPanel') {
            const merchantUi = game.systems.merchantUi;
            if (merchantUi && typeof merchantUi.openMerchantPanel === 'function') {
                merchantUi.openMerchantPanel(context.source, { silent: true });
            }
        }
    }

    function applyEffects(effects, context) {
        (effects || []).forEach((effect) => {
            applyEffect(effect, context);
        });
    }

    function resolveNode(dialogue, nodeId, context) {
        const node = dialogue && dialogue.nodes ? dialogue.nodes[nodeId] : null;

        if (!node) {
            return null;
        }

        if (node.condition && !node.condition(context)) {
            return null;
        }

        return node;
    }

    function runNode(dialogue, nodeId, context) {
        const node = resolveNode(dialogue, nodeId, context);
        if (!node) {
            clearDialogue();
            return null;
        }

        game.state.activeDialogueId = dialogue.id;
        game.state.activeDialogueNodeId = nodeId;
        activeSource = context.source;
        activeNpc = context.npc;

        const result = {
            dialogueId: dialogue.id,
            nodeId,
            speaker: context.npc.label,
            text: evaluateValue(node.text, context) || '',
            autoClose: Boolean(node.autoClose),
            choices: Array.isArray(node.choices)
                ? node.choices.filter((choice) => !choice.condition || choice.condition(context)).map((choice) => ({
                    ...choice,
                    label: evaluateValue(choice.label, context)
                }))
                : []
        };

        applyEffects(node.effects, context);

        if (result.autoClose || result.choices.length === 0) {
            clearDialogue();
        }

        return result;
    }

    function startDialogue(source) {
        const npcRuntime = getNpcRuntime();
        const registry = getDialogueRegistry();
        const npc = npcRuntime && typeof npcRuntime.resolveNpcForInteraction === 'function'
            ? npcRuntime.resolveNpcForInteraction(source)
            : null;

        if (!npc || !registry || typeof registry.getDialogueDefinition !== 'function') {
            clearDialogue();
            return null;
        }

        const dialogue = registry.getDialogueDefinition(npc.dialogueId);
        if (!dialogue) {
            clearDialogue();
            return null;
        }

        const context = buildContext(source, npc);
        const startNodeId = typeof dialogue.getStartNodeId === 'function'
            ? dialogue.getStartNodeId(context)
            : dialogue.startNodeId;

        if (!startNodeId) {
            clearDialogue();
            return null;
        }

        return runNode(dialogue, startNodeId, context);
    }

    function getActiveDialogueState() {
        if (!game.state.activeDialogueId || !game.state.activeDialogueNodeId || !activeSource || !activeNpc) {
            return null;
        }

        const registry = getDialogueRegistry();
        const dialogue = registry && typeof registry.getDialogueDefinition === 'function'
            ? registry.getDialogueDefinition(game.state.activeDialogueId)
            : null;

        if (!dialogue) {
            clearDialogue();
            return null;
        }

        const context = buildContext(activeSource, activeNpc);
        if (!context) {
            clearDialogue();
            return null;
        }

        const node = resolveNode(dialogue, game.state.activeDialogueNodeId, context);
        if (!node) {
            clearDialogue();
            return null;
        }

        return {
            dialogue,
            context,
            nodeId: game.state.activeDialogueNodeId,
            speaker: context.npc.label,
            text: evaluateValue(node.text, context) || '',
            choices: Array.isArray(node.choices)
                ? node.choices.filter((choice) => !choice.condition || choice.condition(context)).map((choice) => ({
                    ...choice,
                    label: evaluateValue(choice.label, context)
                }))
                : []
        };
    }

    function chooseChoice(choiceIndex) {
        const active = getActiveDialogueState();

        if (!active || !active.choices[choiceIndex]) {
            return false;
        }

        const choice = active.choices[choiceIndex];
        applyEffects(choice.effects, active.context);

        if (choice.nextNodeId) {
            runNode(active.dialogue, choice.nextNodeId, active.context);
            return true;
        }

        clearDialogue();
        return true;
    }

    function canStartDialogue(source) {
        const npcRuntime = getNpcRuntime();
        return Boolean(npcRuntime && typeof npcRuntime.resolveNpcForInteraction === 'function'
            && npcRuntime.resolveNpcForInteraction(source));
    }

    Object.assign(dialogueRuntime, {
        clearDialogue,
        getActiveDialogueState,
        chooseChoice,
        startDialogue,
        canStartDialogue
    });
})();
