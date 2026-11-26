(() => {
    const macro = window.Game.systems.worldgenMacro;
    // Strength of the elevation term in the macro temperature envelope.
    const THERMAL_ELEVATION_RESPONSE = 0.52;
    const COLD_LOAD_TEMPERATURE_RESPONSE = 0.72;
    const climateChannels = ['temperature', 'coldLoad', 'wetness', 'storm', 'seasonality'];
    const round = value => Number(value.toFixed(6));
    const clampUnit = value => Math.max(0, Math.min(1, value));

    function windwardBarrier(surface, cell, windX, windY) {
        const { grid, signed } = surface;
        const x = cell % grid.width;
        const y = Math.floor(cell / grid.width);
        let barrier = 0;
        for (let step = 1; step <= grid.subdivision; step += 1) {
            const upwindX = Math.round(x - step * windX);
            const upwindY = Math.round(y - step * windY);
            if (upwindX < 0 || upwindY < 0 || upwindX >= grid.width || upwindY >= grid.height) break;
            const distance = Math.hypot(upwindX - x, upwindY - y) / grid.subdivision;
            if (distance > 0) {
                barrier = Math.max(barrier, (signed[upwindY * grid.width + upwindX] - signed[cell]) / distance);
            }
        }
        return barrier;
    }

    function measureIslandPhysicalSetting({ cells, surface, readClimate, readWind, landTravel, landfall, seaLinkCount }) {
        const ranges = Object.fromEntries(climateChannels.map(key => [key, {
            min: Infinity, max: -Infinity, sum: 0
        }]));
        let shelteredLandCells = 0;
        let shelteredStormTotal = 0;
        let exposedStormTotal = 0;
        let barrierSum = 0;
        let reachableLandCells = 0;
        let travelDistance = 0;
        let travelAscent = 0;
        for (const cell of cells) {
            const residual = surface.signed[cell] - surface.inherited[cell];
            const baseline = readClimate(cell, 'temperature');
            const localTemperature = clampUnit(baseline - residual * THERMAL_ELEVATION_RESPONSE);
            const local = { temperature: localTemperature,
                coldLoad: clampUnit(readClimate(cell, 'coldLoad') + (baseline - localTemperature) * COLD_LOAD_TEMPERATURE_RESPONSE),
                wetness: readClimate(cell, 'wetness'), storm: readClimate(cell, 'storm'), seasonality: readClimate(cell, 'seasonality') };
            for (const key of climateChannels) {
                const range = ranges[key];
                range.min = Math.min(range.min, local[key]);
                range.max = Math.max(range.max, local[key]);
                range.sum += local[key];
            }
            const [windX, windY] = readWind(cell);
            const barrier = windwardBarrier(surface, cell, windX, windY);
            if (barrier > 0) {
                shelteredLandCells += 1;
                shelteredStormTotal += local.storm;
            } else {
                exposedStormTotal += local.storm;
            }
            barrierSum += barrier;
            if (landTravel.distance[cell] >= 0) {
                reachableLandCells += 1;
                travelDistance += landTravel.distance[cell] / surface.grid.subdivision;
                travelAscent += landTravel.ascent[cell];
            }
        }
        const climateRange = Object.fromEntries(Object.entries(ranges).map(([key, range]) => [key, {
            min: round(range.min), mean: round(range.sum / cells.length), max: round(range.max)
        }]));
        const exposedLandCells = cells.length - shelteredLandCells;
        return { climateRange, terrainShelter: { shelteredLandCells, meanUpwindBarrierSlope: round(barrierSum / cells.length),
            meanStormOnShelteredLand: shelteredLandCells ? round(shelteredStormTotal / shelteredLandCells) : null,
            meanStormOnExposedLand: exposedLandCells ? round(exposedStormTotal / exposedLandCells) : null },
            transport: { landfallCellIndex: landfall?.landCell ?? null, seaLinkCount, reachableLandCells,
                meanDistanceToLandfall: reachableLandCells ? round(travelDistance / reachableLandCells) : null,
                meanAscentToLandfall: reachableLandCells ? round(travelAscent / reachableLandCells) : null } };
    }

    function validateIslandPhysicalSetting(setting, island, landfall, seaLinkCount) {
        if (setting === undefined) return true;
        const nonnegative = value => Number.isFinite(value) && value >= 0;
        const rangeIsValid = range => range && nonnegative(range.min) && Number.isFinite(range.mean)
            && range.mean >= range.min && range.mean <= range.max && range.max <= 1;
        const sheltered = setting?.terrainShelter?.shelteredLandCells;
        const transport = setting?.transport;
        const storm = setting?.climateRange?.storm;
        const shelteredStorm = setting?.terrainShelter?.meanStormOnShelteredLand;
        const exposedStorm = setting?.terrainShelter?.meanStormOnExposedLand;
        const exposed = island.areaCells - sheltered;
        const validStorm = (value, cells) => cells ? Number.isFinite(value) && storm.min <= value && value <= storm.max
            : value === null;
        return climateChannels.every(key => rangeIsValid(setting?.climateRange?.[key]))
            && Number.isSafeInteger(sheltered) && sheltered >= 0 && sheltered <= island.areaCells
            && nonnegative(setting.terrainShelter.meanUpwindBarrierSlope)
            && (shelteredStorm === undefined && exposedStorm === undefined
                || (validStorm(shelteredStorm, sheltered) && validStorm(exposedStorm, exposed)
                    && Math.abs((shelteredStorm * sheltered + exposedStorm * exposed) / island.areaCells - storm.mean) <= 2e-6))
            && transport?.landfallCellIndex === (landfall?.landCell ?? null) && transport.seaLinkCount === seaLinkCount
            && (landfall ? transport.reachableLandCells === island.areaCells && nonnegative(transport.meanDistanceToLandfall)
                && nonnegative(transport.meanAscentToLandfall) : transport.reachableLandCells === 0
                && transport.meanDistanceToLandfall === null && transport.meanAscentToLandfall === null);
    }

    Object.assign(macro, { measureIslandPhysicalSetting, validateIslandPhysicalSetting });
})();
