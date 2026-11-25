(() => {
    const phase2 = window.Game.systems.worldgenPhase2;

    function getEnvironmentalCoverage(input) {
        return (input.phase2InputBundle || input.inputBundle)?.rootSupport?.environmentalCoverage;
    }

    function meanCarrierScore(scores, cells, fallbackIds = [], totalCells) {
        const carriers = cells ? Object.entries(cells) : fallbackIds.map(id => [id, 1]);
        let amount = 0;
        let measuredCells = 0;
        for (const [id, weight] of carriers) {
            const value = Object.hasOwn(scores, id) ? scores[id] : undefined;
            if (!Number.isFinite(value)) continue;
            measuredCells += weight;
            amount += value * weight;
        }
        return measuredCells ? amount / (totalCells || measuredCells) : undefined;
    }

    function indexIsolationByRelief(reliefRegions, zones) {
        return Object.fromEntries(reliefRegions.map(region => [
            region.reliefRegionId, zones.filter(zone => Array.isArray(zone.reliefRegionIds)
                ? zone.reliefRegionIds.includes(region.reliefRegionId)
                : (zone.continentIds || []).some(id => (region.continentIds || []).includes(id))
            ).map(zone => zone.zoneId)
        ]));
    }

    function getReliefCarriers(context, reliefId) {
        const spatial = context.coverage?.reliefRegions[reliefId];
        const climateCells = spatial ? spatial.climateBandCells || {} : undefined;
        const basinCells = spatial ? spatial.riverBasinCells || {} : undefined;
        const climateBandIds = climateCells ? Object.keys(climateCells) : context.climateBandIdsByReliefRegion[reliefId] || [];
        const riverBasinIds = basinCells ? Object.keys(basinCells) : context.riverBasinIdsByReliefRegion[reliefId] || [];
        return {
            spatial, basinCells, riverBasinIds, climateBandIds,
            climateMean: scores => meanCarrierScore(scores, climateCells, climateBandIds) ?? 0,
            basinMean: scores => meanCarrierScore(scores, basinCells, riverBasinIds) ?? 0
        };
    }

    function catchmentWaterSupport(catchmentScale) {
        return catchmentScale / (catchmentScale + 0.04);
    }

    const sourceFields = {
        perReliefScores: 'reliefRegions',
        perBandScores: 'climateBands',
        perBasinScores: 'riverBasins'
    };

    function meanScoreByLand(rows, getLandCells) {
        let amount = 0;
        let landCells = 0;
        for (const row of rows) {
            const cells = getLandCells(row) || 0;
            if (!Number.isFinite(row.value)) continue;
            landCells += cells;
            amount += row.value * cells;
        }
        return landCells ? { value: amount / landCells, landCells } : null;
    }

    function landWeightedPressure(field, coverage) {
        if (!field || !coverage) return null;
        for (const [scoreField, carrier] of Object.entries(sourceFields)) {
            if (Array.isArray(field[scoreField])) {
                return meanScoreByLand(field[scoreField], row => coverage[carrier][row.recordId]?.landCellCount);
            }
        }
        return null;
    }

    Object.assign(phase2, {
        getEnvironmentalCoverage,
        meanCarrierScore,
        indexIsolationByRelief,
        getReliefCarriers,
        catchmentWaterSupport,
        meanScoreByLand,
        landWeightedPressure
    });
})();
