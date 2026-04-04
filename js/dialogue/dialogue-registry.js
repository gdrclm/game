(() => {
    const dialogueRegistry = window.Game.systems.dialogueRegistry = window.Game.systems.dialogueRegistry || {};

    function buildIslandOriginalNode(scene, options = {}) {
        return {
            condition: (context) => Boolean(context.encounter && context.encounter.kind === 'islandOriginalNpc'),
            text: '',
            effects: [{
                type: 'playIslandOriginalScene',
                scene,
                grantReward: Boolean(options.grantReward),
                advanceTopic: Boolean(options.advanceTopic)
            }],
            autoClose: true
        };
    }

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
        },
        islandOriginalGreeting: {
            id: 'islandOriginalGreeting',
            getStartNodeId(context) {
                const encounter = context && context.encounter ? context.encounter : null;
                const state = context && context.npc && context.npc.state ? context.npc.state : {};
                const reward = encounter && encounter.reward ? encounter.reward : null;
                const rewardStateKey = reward && reward.stateKey ? reward.stateKey : 'giftClaimed';
                const repeatScenes = encounter
                    && encounter.dialogueProfile
                    && Array.isArray(encounter.dialogueProfile.repeatScenes)
                    && encounter.dialogueProfile.repeatScenes.length > 0
                    ? encounter.dialogueProfile.repeatScenes
                    : ['repeat', 'teaching', 'path', 'meaning'];

                if (reward && !state[rewardStateKey]) {
                    return state.metCount > 0
                        ? 'islandOriginalPendingGift'
                        : 'islandOriginalIntroGift';
                }

                if (!state.metCount) {
                    return 'islandOriginalIntro';
                }

                const scene = repeatScenes[Math.abs(state.topicIndex || 0) % repeatScenes.length] || 'repeat';
                switch (scene) {
                case 'teaching':
                    return 'islandOriginalTeaching';
                case 'path':
                    return 'islandOriginalPath';
                case 'meaning':
                    return 'islandOriginalMeaning';
                default:
                    return 'islandOriginalRepeat';
                }
            },
            nodes: {
                islandOriginalIntroGift: buildIslandOriginalNode('intro', { grantReward: true }),
                islandOriginalPendingGift: buildIslandOriginalNode('pendingGift', { grantReward: true }),
                islandOriginalIntro: buildIslandOriginalNode('intro'),
                islandOriginalRepeat: buildIslandOriginalNode('repeat', { advanceTopic: true }),
                islandOriginalTeaching: buildIslandOriginalNode('teaching', { advanceTopic: true }),
                islandOriginalPath: buildIslandOriginalNode('path', { advanceTopic: true }),
                islandOriginalMeaning: buildIslandOriginalNode('meaning', { advanceTopic: true })
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
