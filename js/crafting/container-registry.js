(() => {
    const game = window.Game;
    const containerRegistry = game.systems.containerRegistry = game.systems.containerRegistry || {};

    function cloneValue(value) {
        if (Array.isArray(value)) {
            return value.map(cloneValue);
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
            );
        }

        return value;
    }

    const containerDefinitions = [
        {
            id: 'waterFlask',
            label: 'Фляга',
            states: [
                {
                    id: 'waterFlaskEmpty',
                    itemId: 'flask_empty',
                    label: 'Пустая фляга',
                    stateLabel: 'пустая',
                    stateSummary: 'Нужна, чтобы набрать воду.',
                    drinkable: false,
                    recipeReady: false,
                    useTransitionStateId: null,
                    craftIngredientReturnStateId: null,
                    fillTargets: {
                        waterSource: 'waterFlaskDirty'
                    }
                },
                {
                    id: 'waterFlaskDirty',
                    itemId: 'flask_water_dirty',
                    label: 'Фляга сырой воды',
                    stateLabel: 'сырая вода',
                    stateSummary: 'Пригодна для питья, но не подходит для рецептов.',
                    drinkable: true,
                    recipeReady: false,
                    useTransitionStateId: 'waterFlaskEmpty',
                    craftIngredientReturnStateId: null,
                    fillTargets: null
                },
                {
                    id: 'waterFlaskFull',
                    itemId: 'flask_water_full',
                    label: 'Фляга кипячёной воды',
                    stateLabel: 'кипячёная вода',
                    stateSummary: 'Пригодна для питья и для обычных лагерных рецептов.',
                    drinkable: true,
                    recipeReady: true,
                    useTransitionStateId: 'waterFlaskEmpty',
                    craftIngredientReturnStateId: 'waterFlaskEmpty',
                    fillTargets: null
                },
                {
                    id: 'waterFlaskAlchemy',
                    itemId: 'flask_water_alchemy',
                    label: 'Фляга алхимической воды',
                    stateLabel: 'алхимическая вода',
                    stateSummary: 'Подготовлена для лагерной алхимии и сложных настоев.',
                    drinkable: false,
                    recipeReady: true,
                    useTransitionStateId: null,
                    craftIngredientReturnStateId: 'waterFlaskEmpty',
                    fillTargets: null
                }
            ]
        }
    ];

    const containerById = Object.create(null);
    const stateById = Object.create(null);
    const stateByItemId = Object.create(null);

    containerDefinitions.forEach((definition) => {
        const normalizedDefinition = {
            ...cloneValue(definition),
            states: Array.isArray(definition.states)
                ? definition.states.map((state) => ({
                    ...cloneValue(state),
                    containerId: definition.id
                }))
                : []
        };

        containerById[normalizedDefinition.id] = normalizedDefinition;
        normalizedDefinition.states.forEach((state) => {
            stateById[state.id] = state;
            stateByItemId[state.itemId] = state;
        });
    });

    function getContainerDefinition(containerId) {
        return containerById[containerId] ? cloneValue(containerById[containerId]) : null;
    }

    function getContainerDefinitions() {
        return containerDefinitions.map((definition) => cloneValue(containerById[definition.id]));
    }

    function getContainerStateDefinition(stateId) {
        return stateById[stateId] ? cloneValue(stateById[stateId]) : null;
    }

    function getContainerStateByItemId(itemId) {
        return stateByItemId[itemId] ? cloneValue(stateByItemId[itemId]) : null;
    }

    function getGameplayItemIdForState(stateId) {
        const state = stateById[stateId];
        return state && state.itemId ? state.itemId : '';
    }

    function getContainerStateIdForItem(itemId) {
        const state = stateByItemId[itemId];
        return state && state.id ? state.id : '';
    }

    function isContainerItem(itemId) {
        return Boolean(stateByItemId[itemId]);
    }

    function getFillTargetStateId(stateId, sourceKind) {
        const state = stateById[stateId];
        if (!state || !state.fillTargets || typeof state.fillTargets !== 'object') {
            return '';
        }

        return typeof state.fillTargets[sourceKind] === 'string'
            ? state.fillTargets[sourceKind]
            : '';
    }

    Object.assign(containerRegistry, {
        containerDefinitions: getContainerDefinitions(),
        getContainerDefinition,
        getContainerDefinitions,
        getContainerStateDefinition,
        getContainerStateByItemId,
        getGameplayItemIdForState,
        getContainerStateIdForItem,
        getFillTargetStateId,
        isContainerItem
    });
})();
