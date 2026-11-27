(() => {
    const phase2 = window.Game.systems.worldgenPhase2;

    function getEnvironmentalCoverage(input) {
        return (input.phase2InputBundle || input.inputBundle)?.rootSupport?.environmentalCoverage;
    }

    function getReliefWaterAccess(input) {
        return (input.phase2InputBundle || input.inputBundle)?.rootSupport?.reliefWaterAccess;
    }

    function describeReliefRecoveryWater(water) {
        if (!water?.landCellCount) return undefined;
        const { landCellCount, inputPotential, lowInputPotential, reachableCellCount } = water;
        return {
            meanInflowPerLandArea: inputPotential / landCellCount,
            lowSeasonInflowPerLandArea: lowInputPotential / landCellCount,
            seasonalInflowFraction: inputPotential > 0 ? lowInputPotential / inputPotential : null,
            sourceAccess: Object.freeze({
                reachableLandFraction: reachableCellCount / landCellCount,
                allocatedLowSupplyPerReachableArea: water.allocatedLowSupplyPerArea ?? null,
                meanDistance: water.meanDistance,
                meanAscent: water.meanAscent
            }),
            potentialRetention: water.storageSpace
        };
    }

    function describeReliefRefuge(coverage, reliefId) {
        const measured = coverage?.reliefRefuges?.regions[reliefId];
        const landCells = coverage?.reliefRegions[reliefId]?.landCellCount;
        if (!measured?.classifiedLandCells || !landCells) return undefined;
        const { ordinaryInput, lowSeasonInput, shelteredLandCells } = measured;
        const shelteredLandFraction = shelteredLandCells / landCells;
        const lowSeasonFraction = ordinaryInput > 0 ? lowSeasonInput / ordinaryInput : null;
        // Assess the share of local land with a sheltered replenishment
        // opportunity and the share of its ordinary input still arriving in
        // the low season. The general support window separately covers dry
        // shelters; neither term converts potential into a duration.
        return Object.freeze({ shelteredLandFraction, lowSeasonFraction,
            replenishedShelterSupport: shelteredLandFraction * (lowSeasonFraction ?? 0) });
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

    function interpretRegionalIslandEnvironment({ landCellCount, waterAccess, physicalSetting, shelteredWaterAccess }, cellAreaInMacroCells) {
        const shelter = physicalSetting?.terrainShelter;
        const round = value => Number(value.toFixed(6));
        const pressure = {};
        const recovery = {};

        if (waterAccess) {
            const { inputPotential, lowInputPotential, reachableCellCount, allocatedLowSupplyPerArea } = waterAccess;
            pressure.seasonalInflowReduction = round(inputPotential - lowInputPotential);
            if (allocatedLowSupplyPerArea !== undefined) {
                // Convert the density on serviced land to a density over all island land.
                recovery.lowSeasonAllocatedSupplyPerLandArea = round(
                    (allocatedLowSupplyPerArea ?? 0) * reachableCellCount / landCellCount
                );
            }
            if (shelter) {
                const sheltered = shelter.shelteredLandCells;
                const exact = shelteredWaterAccess?.reachableCellCount;
                recovery.windShelteredLandWithSourceAccess = exact !== undefined ? {
                    minLandCells: exact, maxLandCells: exact, exactLandCells: exact
                } : {
                    minLandCells: Math.max(0, sheltered + reachableCellCount - landCellCount),
                    maxLandCells: Math.min(sheltered, reachableCellCount)
                };
                if (shelteredWaterAccess) {
                    recovery.lowSeasonAllocatedSupplyPerShelteredLandArea = sheltered
                        ? round((shelteredWaterAccess.allocatedLowSupplyPerArea ?? 0) * exact / sheltered) : null;
                }
            }
            if (cellAreaInMacroCells !== undefined) {
                const inflowPerArea = access => {
                    const area = access.landCellCount * cellAreaInMacroCells;
                    return area ? {
                        ordinary: round(access.inputPotential / area),
                        lowSeason: round(access.lowInputPotential / area)
                    } : null;
                };
                recovery.habitatInflowPerLandArea = {
                    island: inflowPerArea(waterAccess),
                    ...(shelteredWaterAccess && { windSheltered: inflowPerArea(shelteredWaterAccess) })
                };
            }
        }
        if (shelter?.meanStormOnExposedLand !== undefined) {
            // Isolate the contribution of exposed land to the inherited storm index.
            // Storm intensity on sheltered land after local attenuation is unknown.
            const exposed = landCellCount - shelter.shelteredLandCells;
            pressure.exposedLandStormContribution = round(
                (shelter.meanStormOnExposedLand ?? 0) * exposed / landCellCount
            );
        }

        return {
            ...(Object.keys(pressure).length && { localPressure: pressure }),
            ...(Object.keys(recovery).length && { localRecovery: recovery })
        };
    }

    Object.assign(phase2, {
        getEnvironmentalCoverage,
        getReliefWaterAccess,
        describeReliefRecoveryWater,
        describeReliefRefuge,
        meanCarrierScore,
        indexIsolationByRelief,
        getReliefCarriers,
        catchmentWaterSupport,
        meanScoreByLand,
        landWeightedPressure,
        interpretRegionalIslandEnvironment
    });
})();
