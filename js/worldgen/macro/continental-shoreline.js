(() => {
    const macro = window.Game.systems.worldgenMacro;

    function continentMinimumSize(size) {
        return Math.max(12, Math.round(size * 0.025));
    }

    function selectContinentalShoreline(values, bounds, initialPercentile, collectComponents, findSupportedChain) {
        const sorted = values.slice().sort((a, b) => a - b);
        const minimumSize = continentMinimumSize(values.length);
        const thresholds = [initialPercentile];
        // Test the existing relief at bounded sea levels. The same elevation and RNG
        // feed each attempt. Leave single-body relief visible if no level separates it.
        for (let percentile = initialPercentile + 0.025; percentile < 0.81; percentile += 0.025) {
            thresholds.push(percentile);
        }
        // Lower water can bring a submerged shelf above sea level while leaving
        // the intervening ocean intact. Include it if the earlier search runs out.
        for (let percentile = initialPercentile - 0.025; percentile >= 0.30; percentile -= 0.025) {
            thresholds.push(percentile);
        }
        const attempts = [];
        let firstSlice;
        let firstContinentalSlice;
        for (const percentile of thresholds) {
            const cutoff = sorted[Math.floor((sorted.length - 1) * percentile)];
            const land = values.map(value => Number(value > cutoff));
            const bodies = collectComponents(land, bounds.width, bounds.height, 1);
            const majorSizes = bodies.map(body => body.cellCount)
                .filter(cellCount => cellCount >= minimumSize)
                .sort((a, b) => b - a);
            const attempt = { percentile, cutoff, majorSizes };
            attempts.push(attempt);
            const slice = { cutoff, percentile, land };
            firstSlice ??= slice;
            if (majorSizes.length < 2) continue;
            firstContinentalSlice ??= slice;
            if (!findSupportedChain) return { ...slice, attempts };
            const offshore = findSupportedChain(slice);
            attempt.supportedHotspotPeaks = offshore.hotspotChain?.peaks.length || 0;
            if (offshore.hotspotChain) return { ...slice, attempts, offshore };
        }
        return { ...(firstContinentalSlice || firstSlice), attempts };
    }

    macro.getContinentMinimumSize = continentMinimumSize;
    macro.selectContinentalShoreline = selectContinentalShoreline;
})();
