(() => {
    const game = window.Game;
    const stationRuntime = game.systems.stationRuntime = game.systems.stationRuntime || {};

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

    const STATION_CRAFT_TRACKS = Object.freeze({
        compression: 'compression',
        survival: 'survival',
        route: 'route',
        construction: 'construction',
        heavy: 'heavy',
        economy: 'economy',
        ritual: 'ritual'
    });

    const STATION_CRAFT_TRACK_LABELS = Object.freeze({
        compression: 'Сжатие сырья',
        survival: 'Выживание и алхимия',
        route: 'Маршрутная утилита',
        construction: 'Строительство и ремонт',
        heavy: 'Тяжёлое ремесло',
        economy: 'Экономика и контракты',
        ritual: 'Ритуалы'
    });

    const stationDefinitions = [
        {
            id: 'hand',
            label: 'Руки',
            aliases: ['hands'],
            unlockedFromIsland: 1,
            craftTracks: [STATION_CRAFT_TRACKS.compression],
            role: 'Сжатие и упаковка сырья.',
            outputs: ['5 сырья -> 1 компонент', 'Наполнение фляги', 'Простые сборки'],
            status: 'active',
            notes: 'Стартовый способ крафта из craft-доков.'
        },
        {
            id: 'camp',
            label: 'Лагерь',
            aliases: [],
            unlockedFromIsland: 1,
            craftTracks: [STATION_CRAFT_TRACKS.survival],
            role: 'Пища, вода и простая алхимия.',
            outputs: ['Пайки', 'Отвары', 'Зелья', 'Варка воды'],
            status: 'active',
            notes: 'Базовая станция выживания на всём маршруте.'
        },
        {
            id: 'bench',
            label: 'Верстак',
            aliases: [],
            unlockedFromIsland: 3,
            craftTracks: [STATION_CRAFT_TRACKS.route],
            role: 'Утилита и полевой инструмент.',
            outputs: ['Верёвки', 'Крюки', 'Базовый мост', 'Лодочный каркас'],
            status: 'active',
            notes: 'Канонический id для станции "Верстак".'
        },
        {
            id: 'workbench',
            label: 'Мастерская',
            aliases: ['workshop'],
            unlockedFromIsland: 6,
            craftTracks: [STATION_CRAFT_TRACKS.route, STATION_CRAFT_TRACKS.construction],
            role: 'Строительство и ремонт.',
            outputs: ['Переносной мост', 'Лодка', 'Ремонтные наборы'],
            status: 'active',
            notes: 'Канонический id для станции "Мастерская".'
        },
        {
            id: 'smithy',
            label: 'Кузница',
            aliases: ['forge'],
            unlockedFromIsland: 10,
            craftTracks: [STATION_CRAFT_TRACKS.heavy],
            role: 'Тяжёлые инструменты и топовые предметы.',
            outputs: ['Кирки', 'Дрели', 'Ключи', 'Поздние артефакты'],
            status: 'active',
            notes: 'Поздняя тяжёлая ремесленная станция.'
        },
        {
            id: 'scribe',
            label: 'Писарь',
            aliases: [],
            unlockedFromIsland: 8,
            craftTracks: [STATION_CRAFT_TRACKS.economy],
            role: 'Навигация, метки и контрактная логистика.',
            outputs: ['Маршрутные чернила', 'Пропуска', 'Карты', 'Торговые бумаги', 'Рыночные печати'],
            status: 'active',
            notes: 'Станция для маршрутной и дешёвой экономической переработки.'
        },
        {
            id: 'altar',
            label: 'Алтарь',
            aliases: [],
            unlockedFromIsland: null,
            craftTracks: [STATION_CRAFT_TRACKS.ritual],
            role: 'Ритуальные и особые поздние сборки.',
            outputs: ['Ритуальные предметы', 'Особые преобразования'],
            status: 'reserved',
            notes: 'Резервный тип станции для расширения системы.'
        }
    ];

    const stationById = Object.fromEntries(stationDefinitions.map((station) => [station.id, station]));
    const stationAliasToId = Object.create(null);

    stationDefinitions.forEach((station) => {
        [station.id, station.label, ...(station.aliases || [])].forEach((alias) => {
            if (typeof alias !== 'string') {
                return;
            }

            const normalizedAlias = alias.trim().toLowerCase();
            if (normalizedAlias) {
                stationAliasToId[normalizedAlias] = station.id;
            }
        });
    });

    function normalizeStationId(stationIdOrAlias) {
        if (typeof stationIdOrAlias !== 'string') {
            return '';
        }

        const normalizedInput = stationIdOrAlias.trim().toLowerCase();
        return stationAliasToId[normalizedInput] || normalizedInput;
    }

    function normalizeStationList(stations = []) {
        const normalizedStations = new Set();

        (Array.isArray(stations) ? stations : []).forEach((station) => {
            const normalizedStationId = normalizeStationId(station);
            if (normalizedStationId) {
                normalizedStations.add(normalizedStationId);
            }
        });

        return [...normalizedStations];
    }

    function stationMatches(leftStationIdOrAlias, rightStationIdOrAlias) {
        const leftStationId = normalizeStationId(leftStationIdOrAlias);
        const rightStationId = normalizeStationId(rightStationIdOrAlias);
        return Boolean(leftStationId) && leftStationId === rightStationId;
    }

    function getStationDefinition(stationIdOrAlias) {
        const normalizedStationId = normalizeStationId(stationIdOrAlias);
        return stationById[normalizedStationId] ? cloneValue(stationById[normalizedStationId]) : null;
    }

    function getStationDefinitions() {
        return stationDefinitions.map((station) => cloneValue(station));
    }

    function getStationLabel(stationIdOrAlias, fallback = '') {
        const station = getStationDefinition(stationIdOrAlias);
        return station && station.label ? station.label : (fallback || stationIdOrAlias || '');
    }

    function normalizeCraftTrack(craftTrack) {
        return typeof craftTrack === 'string' ? craftTrack.trim().toLowerCase() : '';
    }

    function getCraftTrackLabel(craftTrack, fallback = '') {
        const normalizedCraftTrack = normalizeCraftTrack(craftTrack);
        return STATION_CRAFT_TRACK_LABELS[normalizedCraftTrack] || fallback || craftTrack || '';
    }

    function getStationCraftTracks(stationIdOrAlias) {
        const station = getStationDefinition(stationIdOrAlias);
        return Array.isArray(station && station.craftTracks)
            ? cloneValue(station.craftTracks)
            : [];
    }

    function stationSupportsCraftTrack(stationIdOrAlias, craftTrack) {
        const normalizedCraftTrack = normalizeCraftTrack(craftTrack);
        if (!normalizedCraftTrack) {
            return false;
        }

        return getStationCraftTracks(stationIdOrAlias)
            .some((supportedTrack) => normalizeCraftTrack(supportedTrack) === normalizedCraftTrack);
    }

    function getCurrentActiveHouse(options = {}) {
        if (options.activeHouse) {
            return options.activeHouse;
        }

        return game.state && game.state.activeHouse ? game.state.activeHouse : null;
    }

    function getCurrentActiveInteraction(options = {}) {
        if (options.activeInteraction) {
            return options.activeInteraction;
        }

        return game.state && game.state.activeInteraction ? game.state.activeInteraction : null;
    }

    function getSourceExpedition(source) {
        return source && source.expedition ? source.expedition : source;
    }

    function buildStationSourceContext(source) {
        const expedition = getSourceExpedition(source);

        if (!expedition || typeof expedition !== 'object') {
            return null;
        }

        const sourceKind = normalizeStationId(expedition.kind);
        const buildingType = normalizeStationId(expedition.buildingType);
        let primaryStationId = '';
        let stationIds = [];
        let contextLabel = '';
        let contextSummary = '';

        if (sourceKind === 'camp') {
            primaryStationId = 'camp';
            stationIds = ['camp'];
            contextLabel = 'Лагерь';
            contextSummary = 'Явная лагерная станция для воды, пищи и походных рецептов.';
        } else if (sourceKind === 'workbench') {
            const configuredStationIds = normalizeStationList(
                Array.isArray(expedition.stationIds)
                    ? expedition.stationIds
                    : [expedition.stationId]
            );

            primaryStationId = normalizeStationId(expedition.stationId)
                || (configuredStationIds.includes('workbench')
                    ? 'workbench'
                    : (configuredStationIds[0]
                        || (buildingType === 'workshop' || buildingType === 'bridgehouse' ? 'workbench' : 'bench')));
            stationIds = normalizeStationList([primaryStationId, ...configuredStationIds]);
            contextLabel = primaryStationId === 'workbench' ? 'Мастерская' : 'Верстак';
            contextSummary = primaryStationId === 'workbench'
                ? 'Явная ремесленная станция для мостов, ремонта и тяжёлой утилиты.'
                : 'Явный полевой верстак для верёвок, простых сборок и утилиты.';
        } else {
            return null;
        }

        const sourceLabel = typeof expedition.locationLabel === 'string' && expedition.locationLabel.trim()
            ? expedition.locationLabel
            : (typeof expedition.label === 'string' && expedition.label.trim()
                ? expedition.label
                : contextLabel);

        return {
            sourceId: source && source.id ? source.id : `${sourceKind}:${sourceLabel}`,
            sourceKind,
            buildingType,
            sourceLabel,
            contextLabel,
            contextSummary,
            primaryStationId,
            primaryStationLabel: getStationLabel(primaryStationId),
            stationIds,
            stationLabels: stationIds.map((stationId) => getStationLabel(stationId))
        };
    }

    function buildSourceContexts(options = {}) {
        const contexts = [];
        const seen = new Set();
        const sources = [
            getCurrentActiveInteraction(options),
            getCurrentActiveHouse(options)
        ];

        sources.forEach((source) => {
            const context = buildStationSourceContext(source);

            if (!context || seen.has(context.sourceId)) {
                return;
            }

            seen.add(context.sourceId);
            contexts.push(context);
        });

        return contexts;
    }

    function resolveAvailableStations(options = {}) {
        const explicitStations = Array.isArray(options.availableStations)
            ? options.availableStations
            : (typeof options.station === 'string' ? [options.station] : []);
        const stations = new Set(['hand']);

        normalizeStationList(explicitStations).forEach((station) => {
            stations.add(station);
        });

        if (stations.size > 1 || explicitStations.length > 0) {
            return [...stations];
        }

        buildSourceContexts(options).forEach((context) => {
            context.stationIds.forEach((stationId) => {
                stations.add(stationId);
            });
        });

        return [...stations];
    }

    function getActiveStationContext(options = {}) {
        const sourceContexts = buildSourceContexts(options);
        const activeContext = sourceContexts[0] || null;
        const availableStations = [...new Set(resolveAvailableStations(options)
            .map((stationId) => normalizeStationId(stationId))
            .filter(Boolean))];
        const activeStationId = activeContext && activeContext.primaryStationId
            ? activeContext.primaryStationId
            : 'hand';

        return cloneValue({
            activeStationId,
            activeStationLabel: getStationLabel(activeStationId),
            activeSourceLabel: activeContext ? activeContext.contextLabel : 'Руки',
            activeSourceSummary: activeContext
                ? activeContext.contextSummary
                : 'Стартовая станция, доступная без привязки к объекту.',
            activeSourceName: activeContext ? activeContext.sourceLabel : 'Руки',
            contextStationIds: activeContext ? activeContext.stationIds : ['hand'],
            contextStationLabels: activeContext ? activeContext.stationLabels : [getStationLabel('hand')],
            sourceContexts,
            availableStations,
            availableStationLabels: availableStations.map((stationId) => getStationLabel(stationId))
        });
    }

    Object.assign(stationRuntime, {
        stationDefinitions,
        normalizeStationId,
        normalizeStationList,
        stationMatches,
        getStationDefinition,
        getStationDefinitions,
        getStationLabel,
        buildStationSourceContext,
        getCraftTrackLabel,
        getActiveStationContext,
        getStationCraftTracks,
        resolveAvailableStations
        ,
        stationSupportsCraftTrack,
        STATION_CRAFT_TRACKS
    });
})();
