(() => {
    const macro = window.Game.systems.worldgenMacro;

    function continentMinimumSize(size) {
        return Math.max(12, Math.round(size * 0.025));
    }

    const STANDARD_MIN_PERCENTILE = 0.30;
    const STANDARD_MAX_PERCENTILE = 0.81;
    const SEA_LEVEL_PERCENTILE_STEP = 0.025;

    function exposedCountAtPercentile(size, percentile) {
        return size - 1 - Math.floor((size - 1) * percentile);
    }

    function findExposedContinentIntervals(values, bounds, minimumSize, lowerPercentile) {
        const cellCount = values.length;
        const roots = new Int32Array(cellCount).fill(-1);
        const sizes = new Int32Array(cellCount);
        const order = Array.from({ length: cellCount }, (_, cell) => cell)
            .sort((a, b) => values[b] - values[a] || a - b);
        const limit = exposedCountAtPercentile(cellCount, lowerPercentile);
        let majorBodyCount = 0;
        let interval;
        const intervals = [];
        function findRoot(cell) {
            while (roots[cell] !== cell) {
                roots[cell] = roots[roots[cell]];
                cell = roots[cell];
            }
            return cell;
        }
        // Lower water in elevation order. Each active component exactly
        // describes a body above the next distinct cutoff.
        for (let exposed = 0; exposed <= limit; exposed += 1) {
            const cell = order[exposed];
            const cutoff = values[cell];
            if (exposed === 0 || values[order[exposed - 1]] > cutoff) {
                if (majorBodyCount >= 2) {
                    interval ??= { highest: exposed, lowest: exposed };
                    interval.lowest = exposed;
                } else if (interval) {
                    intervals.push(interval);
                    interval = null;
                }
            }
            roots[cell] = cell;
            sizes[cell] = 1;
            let parent = cell;
            macro.forEachCardinalNeighbor(cell, bounds.width, cellCount, neighbor => {
                if (roots[neighbor] < 0) return;
                const connected = findRoot(neighbor);
                if (connected === parent) return;
                majorBodyCount -= Number(sizes[connected] >= minimumSize) + Number(sizes[parent] >= minimumSize);
                const mergedSize = sizes[parent] + sizes[connected];
                if (sizes[parent] < sizes[connected]) {
                    roots[parent] = connected;
                    parent = connected;
                } else {
                    roots[connected] = parent;
                }
                sizes[parent] = mergedSize;
                majorBodyCount += Number(sizes[parent] >= minimumSize);
            });
        }
        if (interval) intervals.push(interval);
        return { order, intervals: intervals.reverse() };
    }

    function selectContinentalShoreline(values, bounds, initialPercentile, collectComponents, findSupportedChain) {
        const sorted = values.slice().sort((a, b) => a - b);
        const minimumSize = continentMinimumSize(values.length);
        const thresholds = [initialPercentile];
        // Test the existing relief at bounded sea levels. The same elevation and RNG
        // feed each attempt. Leave single-body relief visible if no level separates it.
        for (let percentile = initialPercentile + SEA_LEVEL_PERCENTILE_STEP; percentile < STANDARD_MAX_PERCENTILE; percentile += SEA_LEVEL_PERCENTILE_STEP) {
            thresholds.push(percentile);
        }
        // Lower water can bring a submerged shelf above sea level while leaving
        // the intervening ocean intact. Include it if the earlier search runs out.
        for (let percentile = initialPercentile - SEA_LEVEL_PERCENTILE_STEP; percentile >= STANDARD_MIN_PERCENTILE; percentile -= SEA_LEVEL_PERCENTILE_STEP) {
            thresholds.push(percentile);
        }
        const attempts = [];
        let firstSlice;
        let firstContinentalSlice;
        function inspectLevel(percentile, cutoff = sorted[Math.floor((sorted.length - 1) * percentile)]) {
            const land = values.map(value => Number(value > cutoff));
            const bodies = collectComponents(land, bounds.width, bounds.height, 1);
            const majorSizes = bodies.map(body => body.cellCount)
                .filter(cellCount => cellCount >= minimumSize)
                .sort((a, b) => b - a);
            const attempt = { percentile, cutoff, majorSizes };
            attempts.push(attempt);
            const slice = { cutoff, percentile, land };
            return { slice, attempt };
        }

        function resolveSupportedChain(slice, attempt) {
            if (!findSupportedChain) return { ...slice, attempts };
            const offshore = findSupportedChain(slice);
            attempt.supportedHotspotPeaks = offshore.hotspotChain?.distinctEmergenceCount || 0;
            return attempt.supportedHotspotPeaks >= 3 ? { ...slice, attempts, offshore } : null;
        }

        for (const percentile of thresholds) {
            const { slice, attempt } = inspectLevel(percentile);
            firstSlice ??= slice;
            if (attempt.majorSizes.length < 2) continue;
            firstContinentalSlice ??= slice;
            const supported = resolveSupportedChain(slice, attempt);
            if (supported) return supported;
        }
        if (!firstContinentalSlice) {
            // An isthmus can survive throughout the usual window even when
            // two inherited continental masses stand above a higher sea.
            // Retain an ordinary split whenever it exists. The highstand is
            // feasible only while two full continent footprints can fit.
            const { order, intervals } = findExposedContinentIntervals(values, bounds, minimumSize, STANDARD_MAX_PERCENTILE);
            const stride = Math.max(1, Math.round(SEA_LEVEL_PERCENTILE_STEP * (values.length - 1)));
            for (const { highest, lowest } of intervals) {
                for (let exposed = lowest; exposed >= highest; exposed = Math.max(highest, exposed - stride)) {
                    const percentile = (values.length - 1 - exposed) / (values.length - 1);
                    const { slice, attempt } = inspectLevel(percentile, values[order[exposed]]);
                    attempt.highstand = true;
                    if (attempt.majorSizes.length >= 2) {
                        const supported = resolveSupportedChain(slice, attempt);
                        if (supported) return supported;
                    }
                    if (exposed === highest) break;
                }
            }

            // The coarse ordinary scan can skip a narrow expression of the
            // inherited split between two sampled levels. Keep existing
            // supported shorelines in preference to this final fallback.
            const ordinary = findExposedContinentIntervals(values, bounds, minimumSize, STANDARD_MIN_PERCENTILE);
            const firstOrdinary = exposedCountAtPercentile(values.length, STANDARD_MAX_PERCENTILE) + 1;
            const triedCutoffs = new Set(attempts.map(attempt => attempt.cutoff));
            for (const { lowest } of ordinary.intervals) {
                if (lowest < firstOrdinary) continue;
                const cutoff = values[ordinary.order[lowest]];
                if (triedCutoffs.has(cutoff)) continue;
                const percentile = Math.max(STANDARD_MIN_PERCENTILE, (values.length - 1 - lowest) / (values.length - 1));
                const { slice, attempt } = inspectLevel(percentile, cutoff);
                attempt.observedOrdinarySplit = true;
                if (attempt.majorSizes.length < 2) continue;
                const supported = resolveSupportedChain(slice, attempt);
                if (supported) return supported;
            }
        }
        return { ...(firstContinentalSlice || firstSlice), attempts };
    }

    macro.getContinentMinimumSize = continentMinimumSize;
    macro.selectContinentalShoreline = selectContinentalShoreline;
})();
