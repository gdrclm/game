(() => {
    const questRegistry = window.Game.systems.questRegistry = window.Game.systems.questRegistry || {};

    const questTemplates = {
        merchantDelivery: {
            id: 'merchantDelivery',
            objectiveType: 'deliverItem',
            repeatable: false,
            status: 'available'
        },
        bagUpgrade: {
            id: 'bagUpgrade',
            objectiveType: 'bagLoadout',
            repeatable: false,
            status: 'available'
        }
    };

    function getQuestTemplate(questType = 'merchantDelivery') {
        return questTemplates[questType] || null;
    }

    function createQuestFromTemplate(questType = 'merchantDelivery', overrides = {}) {
        const template = getQuestTemplate(questType);

        return {
            ...(template || {}),
            ...overrides,
            questType: overrides.questType || (template ? template.id : questType),
            objectiveType: overrides.objectiveType || (template ? template.objectiveType : 'generic'),
            repeatable: overrides.repeatable !== undefined
                ? Boolean(overrides.repeatable)
                : Boolean(template && template.repeatable),
            status: overrides.status || (template ? template.status : 'available')
        };
    }

    Object.assign(questRegistry, {
        questTemplates,
        getQuestTemplate,
        createQuestFromTemplate
    });
})();
