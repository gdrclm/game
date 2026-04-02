(() => {
    const game = window.Game;
    const weatherRuntime = game.systems.weatherRuntime = game.systems.weatherRuntime || {};
    const shared = game.systems.expeditionShared || {};
    const clamp = shared.clamp || ((value, min, max) => Math.max(min, Math.min(max, value)));
    const createIslandRandom = shared.createIslandRandom
        || ((islandIndex, salt = 0) => game.systems.utils.createSeededRandom(islandIndex * 173 + salt * 31, islandIndex * -97 - salt * 19));
    const weatherCache = new Map();

    const WEATHER_DEFINITIONS = {
        clear: {
            key: 'clear',
            label: 'Ясно',
            summary: 'Погода спокойная.',
            routeMultiplierRange: [1, 1],
            drainMultiplierRange: [1, 1],
            recoveryMultiplierRange: [1, 1],
            coldDrainMultiplierRange: [1, 1],
            sleepDrainMultiplierRange: [1, 1],
            overlayKey: 'clear'
        },
        rain: {
            key: 'rain',
            label: 'Дождь',
            summary: 'Сырость поднимает расход сил и мешает восстановлению.',
            routeMultiplierRange: [1.05, 1.09],
            drainMultiplierRange: [1.07, 1.12],
            recoveryMultiplierRange: [0.96, 0.90],
            coldDrainMultiplierRange: [1.20, 1.32],
            sleepDrainMultiplierRange: [1.03, 1.08],
            overlayKey: 'rain'
        },
        strongWind: {
            key: 'strongWind',
            label: 'Сильный ветер',
            summary: 'Порывы мешают движению и быстрее выматывают в дороге.',
            routeMultiplierRange: [1.07, 1.13],
            drainMultiplierRange: [1.05, 1.10],
            recoveryMultiplierRange: [0.98, 0.94],
            coldDrainMultiplierRange: [1.08, 1.18],
            sleepDrainMultiplierRange: [1.10, 1.18],
            overlayKey: 'wind'
        },
        thunderstorm: {
            key: 'thunderstorm',
            label: 'Гроза',
            summary: 'Гроза делает переходы тяжелее и сильнее режет восстановление.',
            routeMultiplierRange: [1.10, 1.17],
            drainMultiplierRange: [1.11, 1.19],
            recoveryMultiplierRange: [0.92, 0.86],
            coldDrainMultiplierRange: [1.24, 1.40],
            sleepDrainMultiplierRange: [1.12, 1.20],
            overlayKey: 'storm'
        }
    };

    function lerp(from, to, amount) {
        return from + (to - from) * amount;
    }

    function roundTo(value, digits = 2) {
        const factor = 10 ** digits;
        return Math.round(value * factor) / factor;
    }

    function getWeatherStageFactor(islandIndex) {
        if (islandIndex < 10) {
            return 0;
        }

        return clamp((islandIndex - 10) / 20, 0, 1);
    }

    function pickWeatherKey(islandIndex) {
        if (islandIndex < 10) {
            return 'clear';
        }

        const random = createIslandRandom(islandIndex, 91);
        const roll = random();

        if (roll < 0.34) {
            return 'rain';
        }

        if (roll < 0.68) {
            return 'strongWind';
        }

        return 'thunderstorm';
    }

    function buildWeatherProfile(islandIndex) {
        const key = pickWeatherKey(islandIndex);
        const definition = WEATHER_DEFINITIONS[key] || WEATHER_DEFINITIONS.clear;
        const stageFactor = getWeatherStageFactor(islandIndex);
        const routeMultiplier = roundTo(lerp(definition.routeMultiplierRange[0], definition.routeMultiplierRange[1], stageFactor));
        const drainMultiplier = roundTo(lerp(definition.drainMultiplierRange[0], definition.drainMultiplierRange[1], stageFactor));
        const recoveryMultiplier = roundTo(lerp(definition.recoveryMultiplierRange[0], definition.recoveryMultiplierRange[1], stageFactor));
        const coldDrainMultiplier = roundTo(lerp(definition.coldDrainMultiplierRange[0], definition.coldDrainMultiplierRange[1], stageFactor));
        const sleepDrainMultiplier = roundTo(lerp(definition.sleepDrainMultiplierRange[0], definition.sleepDrainMultiplierRange[1], stageFactor));

        return {
            ...definition,
            islandIndex,
            stageFactor,
            routeMultiplier,
            drainMultiplier,
            recoveryMultiplier,
            coldDrainMultiplier,
            sleepDrainMultiplier,
            intensity: roundTo(0.4 + stageFactor * 0.6)
        };
    }

    function getWeatherForIsland(islandIndex = 1) {
        const safeIslandIndex = Math.max(1, Math.round(islandIndex || 1));

        if (!weatherCache.has(safeIslandIndex)) {
            weatherCache.set(safeIslandIndex, buildWeatherProfile(safeIslandIndex));
        }

        return weatherCache.get(safeIslandIndex);
    }

    function getIslandIndexFromTileInfo(tileInfo = game.state.activeTileInfo) {
        if (tileInfo && tileInfo.progression && Number.isFinite(tileInfo.progression.islandIndex)) {
            return tileInfo.progression.islandIndex;
        }

        return Math.max(1, game.state.currentIslandIndex || 1);
    }

    function getWeather(tileInfo = game.state.activeTileInfo) {
        return getWeatherForIsland(getIslandIndexFromTileInfo(tileInfo));
    }

    function getWeatherLabel(tileInfo = game.state.activeTileInfo) {
        return getWeather(tileInfo).label;
    }

    function getWeatherSummary(tileInfo = game.state.activeTileInfo) {
        return getWeather(tileInfo).summary;
    }

    function drawRainLayer(weather, stormMode = false) {
        const context = game.ctx;
        const now = (window.performance && typeof window.performance.now === 'function' ? window.performance.now() : Date.now());
        const streakCount = Math.round(40 + weather.intensity * (stormMode ? 70 : 50));
        const width = game.canvas.width;
        const height = game.canvas.height;

        context.save();
        context.lineWidth = stormMode ? 1.3 : 1;
        context.strokeStyle = stormMode
            ? 'rgba(230, 240, 255, 0.34)'
            : 'rgba(212, 228, 255, 0.24)';

        for (let index = 0; index < streakCount; index++) {
            const seed = index + weather.islandIndex * 17;
            const x = ((seed * 83) + now * 0.55) % (width + 90) - 45;
            const y = ((seed * 37) + now * 1.8) % (height + 140) - 70;
            const length = stormMode ? 20 : 16;

            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(x - 7, y + length);
            context.stroke();
        }

        context.restore();
    }

    function drawWindLayer(weather) {
        const context = game.ctx;
        const now = (window.performance && typeof window.performance.now === 'function' ? window.performance.now() : Date.now());
        const streakCount = Math.round(22 + weather.intensity * 26);
        const width = game.canvas.width;
        const height = game.canvas.height;

        context.save();
        context.lineWidth = 2;
        context.strokeStyle = 'rgba(244, 248, 255, 0.18)';
        context.lineCap = 'round';

        for (let index = 0; index < streakCount; index++) {
            const seed = index + weather.islandIndex * 23;
            const x = ((seed * 101) + now * 0.9) % (width + 160) - 80;
            const y = ((seed * 41) + now * 0.18) % (height + 120) - 60;
            const length = 20 + (seed % 14);

            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(x + length, y - 4);
            context.stroke();
        }

        context.restore();
    }

    function drawLightning(weather) {
        const context = game.ctx;
        const elapsedSeconds = ((window.performance && typeof window.performance.now === 'function'
            ? window.performance.now()
            : Date.now()) / 1000);
        const cycle = (elapsedSeconds + weather.islandIndex * 0.41) % 5.4;
        let flashOpacity = 0;

        if (cycle > 5.05) {
            flashOpacity = 0.22;
        } else if (cycle > 4.8 && cycle < 4.9) {
            flashOpacity = 0.12;
        }

        if (flashOpacity <= 0) {
            return;
        }

        context.save();
        context.fillStyle = `rgba(244, 248, 255, ${flashOpacity})`;
        context.fillRect(0, 0, game.canvas.width, game.canvas.height);
        context.restore();
    }

    function drawCurrentWeatherOverlay(progression = game.state.activeTileInfo && game.state.activeTileInfo.progression
        ? game.state.activeTileInfo.progression
        : null) {
        const weather = progression ? getWeatherForIsland(progression.islandIndex) : getWeather();

        if (!weather || weather.key === 'clear') {
            return;
        }

        if (weather.overlayKey === 'rain') {
            drawRainLayer(weather, false);
            return;
        }

        if (weather.overlayKey === 'wind') {
            drawWindLayer(weather);
            return;
        }

        if (weather.overlayKey === 'storm') {
            drawRainLayer(weather, true);
            drawWindLayer(weather);
            drawLightning(weather);
        }
    }

    Object.assign(weatherRuntime, {
        WEATHER_DEFINITIONS,
        getWeatherForIsland,
        getWeather,
        getWeatherLabel,
        getWeatherSummary,
        drawCurrentWeatherOverlay
    });
})();
