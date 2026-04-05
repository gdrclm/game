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

    const stationDefinitions = [
        {
            id: 'hand',
            label: 'Руки',
            aliases: ['hands'],
            unlockedFromIsland: 1,
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
            role: 'Навигация, метки и контрактная логистика.',
            outputs: ['Маршрутные чернила', 'Пропуска', 'Карты', 'Торговые бумаги'],
            status: 'active',
            notes: 'Есть в craft-доках, но пока не используется текущими рецептами.'
        },
        {
            id: 'altar',
            label: 'Алтарь',
            aliases: [],
            unlockedFromIsland: null,
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

    function getCurrentActiveHouse(options = {}) {
        if (options.activeHouse) {
            return options.activeHouse;
        }

        return game.state && game.state.activeHouse ? game.state.activeHouse : null;
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

        const activeHouse = getCurrentActiveHouse(options);
        const expedition = activeHouse && activeHouse.expedition ? activeHouse.expedition : activeHouse;

        if (!expedition) {
            return [...stations];
        }

        const houseKind = typeof expedition.kind === 'string' ? expedition.kind.trim().toLowerCase() : '';
        const buildingType = typeof expedition.buildingType === 'string' ? expedition.buildingType.trim().toLowerCase() : '';

        if (houseKind === 'shelter') {
            stations.add('camp');
        }

        if (houseKind === 'artisan' || buildingType === 'workshop' || buildingType === 'bridgehouse') {
            stations.add('bench');
            stations.add('workbench');
        }

        return [...stations];
    }

    Object.assign(stationRuntime, {
        stationDefinitions,
        normalizeStationId,
        normalizeStationList,
        stationMatches,
        getStationDefinition,
        getStationDefinitions,
        getStationLabel,
        resolveAvailableStations
    });
})();
