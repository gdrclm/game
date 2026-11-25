(() => {
    const macro = window.Game.systems.worldgenMacro;

    function continentMinimumSize(size) {
        return Math.max(12, Math.round(size * 0.025));
    }

    function selectContinentalShoreline(values, bounds, initialPercentile, collectComponents) {
        const sorted = values.slice().sort((a, b) => a - b);
        const minimumSize = continentMinimumSize(values.length);
        const thresholds = [initialPercentile];
        // Test the existing relief at bounded sea levels. The same elevation and RNG
        // feed each attempt. Leave single-body relief visible if no level separates it.
        for (let percentile = initialPercentile + 0.025; percentile < 0.81; percentile += 0.025) {
            thresholds.push(percentile);
        }
        const attempts = [];
        let waterline;
        for (const percentile of thresholds) {
            const cutoff = sorted[Math.floor((sorted.length - 1) * percentile)];
            const land = values.map(value => Number(value > cutoff));
            const bodies = collectComponents(land, bounds.width, bounds.height, 1);
            const majorSizes = bodies.map(body => body.cellCount)
                .filter(cellCount => cellCount >= minimumSize)
                .sort((a, b) => b - a);
            attempts.push({ percentile, cutoff, majorSizes });
            waterline ??= { cutoff, percentile, land };
            if (majorSizes.length >= 2) {
                waterline = { cutoff, percentile, land };
                break;
            }
        }
        return { ...waterline, attempts };
    }

    macro.getContinentMinimumSize = continentMinimumSize;
    macro.selectContinentalShoreline = selectContinentalShoreline;
})();
