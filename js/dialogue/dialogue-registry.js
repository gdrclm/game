(() => {
    const dialogueRegistry = window.Game.systems.dialogueRegistry = window.Game.systems.dialogueRegistry || {};

    const dialogueDefinitions = {
        merchantGreeting: {
            id: 'merchantGreeting',
            getStartNodeId(context) {
                const questRuntime = window.Game.systems.questRuntime || null;
                const quest = questRuntime && typeof questRuntime.getEncounterQuest === 'function'
                    ? questRuntime.getEncounterQuest(context.source)
                    : (context.encounter && context.encounter.quest ? context.encounter.quest : null);

                if (quest && quest.completed) {
                    return 'merchantCompleted';
                }

                return 'merchantIntro';
            },
            nodes: {
                merchantIntro: {
                    condition: (context) => Boolean(context.encounter && context.encounter.kind === 'merchant'),
                    text: (context) => `${context.encounter.label}: ${context.encounter.summary}`,
                    effects: [
                        { type: 'setActionMessage', value: (context) => `${context.encounter.label}: открыто меню торговли.` },
                        { type: 'openMerchantPanel' }
                    ],
                    autoClose: true
                },
                merchantCompleted: {
                    condition: (context) => Boolean(context.encounter && context.encounter.kind === 'merchant'),
                    text: (context) => `${context.encounter.label}: квест уже закрыт, но торговля всё ещё доступна.`,
                    effects: [
                        { type: 'setActionMessage', value: (context) => `${context.encounter.label}: квест уже закрыт, торговля открыта.` },
                        { type: 'openMerchantPanel' }
                    ],
                    autoClose: true
                }
            }
        },
        artisanGreeting: {
            id: 'artisanGreeting',
            getStartNodeId(context) {
                const questRuntime = window.Game.systems.questRuntime || null;
                const quest = questRuntime && typeof questRuntime.getEncounterQuest === 'function'
                    ? questRuntime.getEncounterQuest(context.source)
                    : (context.encounter && context.encounter.quest ? context.encounter.quest : null);

                if (quest && quest.completed) {
                    return 'artisanCompleted';
                }

                return 'artisanIntro';
            },
            nodes: {
                artisanIntro: {
                    condition: (context) => Boolean(context.encounter && context.encounter.kind === 'artisan'),
                    text: (context) => `${context.encounter.label}: ${context.encounter.summary}`,
                    effects: [
                        { type: 'setActionMessage', value: (context) => `${context.encounter.label}: открыт ремесленный заказ.` },
                        { type: 'openMerchantPanel' }
                    ],
                    autoClose: true
                },
                artisanCompleted: {
                    condition: (context) => Boolean(context.encounter && context.encounter.kind === 'artisan'),
                    text: (context) => `${context.encounter.label}: работа завершена, но мастер всё ещё может оценить твою сумку.`,
                    effects: [
                        { type: 'setActionMessage', value: (context) => `${context.encounter.label}: сумка уже расширена, панель мастера открыта.` },
                        { type: 'openMerchantPanel' }
                    ],
                    autoClose: true
                }
            }
        }
    };

    function getDialogueDefinition(dialogueId) {
        return dialogueDefinitions[dialogueId] || null;
    }

    Object.assign(dialogueRegistry, {
        dialogueDefinitions,
        getDialogueDefinition
    });
})();
