'use strict';

const assert = require('node:assert/strict');

function verifyLocalWaterFixture(macro) {
    const width = 7;
    const height = 5;
    const signed = new Array(width * height).fill(-0.1);
    for (const cell of [8, 9, 10, 15, 16, 17, 22, 23, 24]) signed[cell] = 0.4;
    signed[16] = 0.1;
    signed[19] = 0.2;
    const measure = (surface, supply, season) => {
        const wetness = new Array(surface.length).fill(supply);
        const drainage = macro.routeSurfaceDrainage({ signed: surface, width, wetness, receiverAt: () => 'ocean' });
        return macro.measureLocalWater({ signed: surface, width, drainage, wetness,
            seasonality: new Array(surface.length).fill(season) });
    };
    const wet = measure(signed, 0.25, 0);
    const dry = measure(signed, 0, 0);
    const seasonal = measure(signed, 0.25, 0.75);
    assert.equal(wet.branches.get(16).spillElevation, 0.4);
    assert(Math.abs(wet.branches.get(16).storageSpace - 0.3) < 1e-9);
    assert.equal(dry.branches.get(16).storageSpace, wet.branches.get(16).storageSpace);
    assert.equal(dry.distance[16], -1);
    assert.equal(wet.distance[16], 0);
    assert.equal(wet.distance[8], 2);
    assert.equal(wet.distance[19], -1, 'Water support cannot cross the sea between islands');
    assert.equal(seasonal.branches.get(16).inputPotential, wet.branches.get(16).inputPotential);
    assert.equal(seasonal.branches.get(16).lowInputPotential, wet.branches.get(16).inputPotential / 4);
    assert.equal(seasonal.lowFlow[16], wet.lowFlow[16] / 4);
    assert.equal(seasonal.sourceCell[8], wet.sourceCell[8]);
    const raisedRim = signed.map((value, cell) => cell !== 16 && value === 0.4 ? 0.6 : value);
    const taller = measure(raisedRim, 0.25, 0);
    assert(taller.branches.get(16).storageSpace > wet.branches.get(16).storageSpace);
    assert.equal(taller.branches.get(16).inputPotential, wet.branches.get(16).inputPotential);
    const joinedBowls = [-0.1, 0.8, 0.2, 0.5, 0.1, 0.9, -0.1];
    for (const terminal of [2, 4]) {
        const branch = measure(joinedBowls, 0.25, 0).branches.get(terminal);
        assert.equal(branch.spillElevation, 0.5);
        assert.equal(branch.retentionToSurfaceWater.spillElevation, 0.8);
        assert(branch.retentionToSurfaceWater.storageSpace > branch.storageSpace);
        const lowerBank = joinedBowls.slice();
        lowerBank[5] = 0.6;
        const opened = measure(lowerBank, 0.25, 0).branches.get(terminal);
        assert.equal(opened.spillElevation, 0.5);
        assert.equal(opened.retentionToSurfaceWater.spillElevation, 0.6);
        assert(opened.retentionToSurfaceWater.storageSpace < branch.retentionToSurfaceWater.storageSpace);
    }
    const sealed = measure([0.9, 0.8, 0.2, 0.5, 0.1, 0.9, 0.95], 0.25, 0);
    assert.equal(sealed.branches.get(4).retentionToSurfaceWater, null);
    assert.equal(sealed.branches.get(4).spillElevation, 0.5);

    const valley = new Array(49).fill(0.95);
    valley[3] = -0.1;
    for (let row = 1; row <= 5; row += 1) {
        const spine = row * width + 3;
        valley[spine] = 0.1 * row;
        valley[spine - 1] = valley[spine + 1] = valley[spine] + 0.08;
    }
    const budget = measure(valley, 0.25, 0.75);
    assert(budget.hasSource[10] && budget.hasSource[17]);
    assert(budget.allocatedLowInput[10] < budget.lowFlow[10]);
    const summary = macro.createWaterAccessSummary();
    for (const cell of budget.terminal.keys()) {
        if (budget.terminal[cell] >= 0) macro.addWaterAccessCell(summary, budget, cell);
    }
    assert(summary.allocatedSupply <= summary.inputPotential);
    assert(summary.allocatedLowSupply <= summary.lowInputPotential);
    assert(Math.abs(summary.allocatedSupply / 4 - summary.allocatedLowSupply) < 1e-9);

    const parts = [macro.createWaterAccessSummary(), macro.createWaterAccessSummary()];
    for (const cell of budget.terminal.keys()) {
        if (budget.terminal[cell] >= 0) macro.addWaterAccessCell(parts[cell % 2], budget, cell);
    }
    for (const field of ['allocatedSupply', 'allocatedLowSupply']) {
        assert(Math.abs(parts[0][field] + parts[1][field] - summary[field]) < 1e-9);
    }
    return { retainedSpaceRequiresRelief: true, dryBowlHasNoSupply: true, seasonChangesLowInputOnly: true,
        accessCannotCrossWater: true, nestedBowlsRequireSecondSaddle: true, sealedBowlHasNoMeasuredExit: true,
        nestedSourcesDoNotDoubleCountUpstreamWater: true };
}

function inspectLocalWater(result, macro) {
    const geography = result.phase1.macroGeographyPackage;
    const water = geography.environmentalCoverage.localWater;
    assert.deepEqual(macro.validateEnvironmentalCoverage(geography), []);
    assert.deepEqual(result.phase2.reliefWaterAccess, water.reliefRegions);
    const diagnostics = result.diagnostics.physicalWorldDebugBundle.intermediateOutputs;
    const get = id => diagnostics.find(row => row.artifactId === `foundation_geometry_${id}`).payload;
    const drainage = get('finalDrainage');
    const access = get('localWaterAccess');
    assert.equal(water.branches.length, drainage.outlets.length);
    assert.equal(water.branches.reduce((sum, branch) => sum + branch.contributingCells, 0), drainage.summary.landCellCount);
    const { width } = drainage.worldBounds;
    for (const [cell, outlet] of access.sourceCell.entries()) {
        if (outlet < 0) {
            assert.equal(access.distance[cell], -1);
            continue;
        }
        assert(drainage.terminalLandCellIndices[cell] >= 0);
        if (!access.distance[cell]) {
            assert.equal(cell, outlet);
            continue;
        }
        let connected = false;
        macro.forEachCardinalNeighbor(cell, width, access.distance.length, neighbor => {
            if (access.distance[neighbor] === access.distance[cell] - 1 && access.sourceCell[neighbor] === outlet) connected = true;
        });
        assert(connected, 'Measured source needs a contiguous downhill-distance chain over land');
    }
    const projection = new Map(result.phase2.regionalIslandEnvironmentalProjection.records.map(row => [row.islandId, row]));
    const islandEnvironment = geography.regionalArchipelago.islandEnvironment;
    const { cellAreaInMacroCells } = islandEnvironment;
    assert.equal(cellAreaInMacroCells, 1 / geography.regionalArchipelago.grid.subdivision ** 2);
    assert.equal(result.phase2.regionalIslandEnvironmentalProjection.cellAreaInMacroCells, cellAreaInMacroCells);
    let jointCells = 0;
    for (const row of islandEnvironment.records) {
        assert.equal(row.waterAccess.landCellCount, row.landCellCount);
        const projected = projection.get(row.islandId);
        assert.deepEqual(projected.waterAccess, row.waterAccess);
        const access = row.waterAccess;
        const coveredArea = access.reachableCellCount / geography.regionalArchipelago.grid.subdivision ** 2;
        assert(access.allocatedSupplyPerArea * coveredArea <= access.inputPotential + (coveredArea + 1) * 1e-6);
        assert(access.allocatedLowSupplyPerArea * coveredArea <= access.lowInputPotential + (coveredArea + 1) * 1e-6);
        assert(Math.abs(projected.localPressure.seasonalInflowReduction - (access.inputPotential - access.lowInputPotential)) <= 1e-6);
        assert(Math.abs(projected.localRecovery.lowSeasonAllocatedSupplyPerLandArea * row.landCellCount
            - access.allocatedLowSupplyPerArea * access.reachableCellCount) <= row.landCellCount * 1e-6);
        if (row.physicalSetting) {
            assert.deepEqual(projected.physicalSetting, row.physicalSetting);
            const shelter = row.physicalSetting.terrainShelter;
            const exposedCells = row.landCellCount - shelter.shelteredLandCells;
            assert(Math.abs(projected.localPressure.exposedLandStormContribution * row.landCellCount
                - shelter.meanStormOnExposedLand * exposedCells) <= row.landCellCount * 1e-6);
            const overlap = projected.localRecovery.windShelteredLandWithSourceAccess;
            const sheltered = row.shelteredWaterAccess;
            assert.deepEqual(projected.shelteredWaterAccess, sheltered);
            assert.deepEqual(overlap, { minLandCells: sheltered.reachableCellCount,
                maxLandCells: sheltered.reachableCellCount, exactLandCells: sheltered.reachableCellCount });
            assert(sheltered.reachableCellCount <= Math.min(shelter.shelteredLandCells, access.reachableCellCount));
            assert(sheltered.reachableCellCount >= Math.max(0, access.reachableCellCount - exposedCells));
            assert.equal(sheltered.landCellCount, shelter.shelteredLandCells);
            jointCells += overlap.exactLandCells;
            const density = projected.localRecovery.habitatInflowPerLandArea;
            const shelteredArea = sheltered.landCellCount * cellAreaInMacroCells;
            if (shelteredArea) {
                assert(Math.abs(density.windSheltered.lowSeason * shelteredArea - sheltered.lowInputPotential) <= shelteredArea * 1e-6);
            } else {
                assert.equal(density.windSheltered, null);
                assert.equal(projected.localRecovery.lowSeasonAllocatedSupplyPerShelteredLandArea, null);
            }
        }
    }
    return {
        branchCount: water.branches.length,
        largestBranchArea: Math.max(...water.branches.map(branch => branch.contributingCells)),
        reliefWithSources: Object.values(water.reliefRegions).filter(row => row.sourceCellCount > 0).length,
        islandsWithSources: islandEnvironment.records.filter(row => row.waterAccess.sourceCellCount > 0).length,
        islandsWithRetention: islandEnvironment.records.filter(row => row.waterAccess.storageSpace > 0).length,
        windShelteredCellsWithSourceAccess: jointCells,
        depressionsWithHigherWaterSpill: water.branches.filter(branch =>
            branch.retentionToSurfaceWater?.spillElevation > branch.spillElevation).length
    };
}

function verifyIslandExposureFixture(macro, phase2) {
    const width = 5;
    const inherited = new Array(25).fill(-0.1);
    inherited[11] = 0.8;
    inherited[12] = 0.2;
    inherited[13] = 0.2;
    const settings = (signed, wind, cells = [12]) => macro.measureIslandPhysicalSetting({ cells,
        surface: { signed, inherited, grid: { width, height: 5, subdivision: 1 } },
        readClimate: (cell, channel) => {
            if (channel === 'storm') return cell === 12 ? 0.7 : 0.2;
            return channel === 'temperature' ? 0.7 : 0.5;
        },
        readWind: () => [wind, 0],
        landTravel: macro.traceDryLandAccess(signed, width, cell => signed[cell] > 0, [13]),
        landfall: { landCell: 13 }, seaLinkCount: 2 });
    const sheltered = settings(inherited, 1);
    const exposed = settings(inherited, -1);
    assert.equal(sheltered.terrainShelter.shelteredLandCells, 1);
    assert.equal(exposed.terrainShelter.shelteredLandCells, 0);
    const mixed = settings(inherited, 1, [11, 12, 13]);
    const reversed = settings(inherited, -1, [11, 12, 13]);
    assert.deepEqual(mixed.climateRange.storm, reversed.climateRange.storm);
    assert.equal(mixed.terrainShelter.meanStormOnShelteredLand, 0.7);
    assert.equal(mixed.terrainShelter.meanStormOnExposedLand, 0.2);
    assert.equal(reversed.terrainShelter.meanStormOnShelteredLand, null);
    assert.equal(reversed.terrainShelter.meanStormOnExposedLand, mixed.climateRange.storm.mean);
    assert.equal(sheltered.transport.meanDistanceToLandfall, 1);
    const raised = inherited.slice();
    raised[12] += 0.3;
    const cooled = settings(raised, 1);
    assert(cooled.climateRange.temperature.mean < sheltered.climateRange.temperature.mean);
    assert(cooled.climateRange.coldLoad.mean > sheltered.climateRange.coldLoad.mean);
    assert.deepEqual(cooled.climateRange.wetness, sheltered.climateRange.wetness);
    assert.equal(cooled.transport.seaLinkCount, sheltered.transport.seaLinkCount);

    const { interpretRegionalIslandEnvironment: interpret } = phase2;
    const waterAccess = { inputPotential: 0.6, lowInputPotential: 0.3, allocatedLowSupplyPerArea: 0.09,
        reachableCellCount: 2, storageSpace: 0.3, meanDistance: 3, meanAscent: 0.4 };
    const project = (physicalSetting, water = waterAccess) => interpret({ landCellCount: 3, physicalSetting, waterAccess: water });
    const protectedLand = project(mixed);
    const unprotectedLand = project(reversed);
    assert.deepEqual(protectedLand, {
        localPressure: { seasonalInflowReduction: 0.3, exposedLandStormContribution: 0.133333 },
        localRecovery: { lowSeasonAllocatedSupplyPerLandArea: 0.06,
            windShelteredLandWithSourceAccess: { minLandCells: 0, maxLandCells: 1 } }
    });
    assert.equal(unprotectedLand.localPressure.exposedLandStormContribution, 0.366667);
    assert.equal(unprotectedLand.localRecovery.lowSeasonAllocatedSupplyPerLandArea, 0.06);
    assert.deepEqual(unprotectedLand.localRecovery.windShelteredLandWithSourceAccess, { minLandCells: 0, maxLandCells: 0 });

    const inaccessibleWater = { ...waterAccess, reachableCellCount: 0, allocatedLowSupplyPerArea: null };
    const inaccessible = project(mixed, inaccessibleWater);
    assert.deepEqual(inaccessible.localPressure, protectedLand.localPressure);
    assert.equal(inaccessible.localRecovery.lowSeasonAllocatedSupplyPerLandArea, 0);
    assert.deepEqual(inaccessible.localRecovery.windShelteredLandWithSourceAccess, { minLandCells: 0, maxLandCells: 0 });
    const dry = project(mixed, { ...inaccessibleWater, inputPotential: 0, lowInputPotential: 0 });
    assert.equal(dry.localRecovery.lowSeasonAllocatedSupplyPerLandArea, 0);
    assert.deepEqual(dry.localRecovery.windShelteredLandWithSourceAccess, { minLandCells: 0, maxLandCells: 0 });
    assert.equal(dry.localPressure.exposedLandStormContribution, protectedLand.localPressure.exposedLandStormContribution);
    const seasonal = project(mixed, { ...waterAccess, lowInputPotential: 0.1, allocatedLowSupplyPerArea: 0.03 });
    assert.equal(seasonal.localPressure.seasonalInflowReduction, 0.5);
    assert.equal(seasonal.localRecovery.lowSeasonAllocatedSupplyPerLandArea, 0.02);
    assert.deepEqual(seasonal.localRecovery.windShelteredLandWithSourceAccess, protectedLand.localRecovery.windShelteredLandWithSourceAccess);
    assert.deepEqual(project({ ...mixed, transport: { ...mixed.transport, seaLinkCount: 0, meanDistanceToLandfall: 12 } },
        { ...waterAccess, storageSpace: 12,
        meanDistance: 8, meanAscent: 0.8 }), protectedLand);
    assert.deepEqual(interpret({ landCellCount: 3 }), {});
    assert.deepEqual(project({ terrainShelter: { shelteredLandCells: 0 } },
        { ...waterAccess, allocatedLowSupplyPerArea: undefined }), {
        localPressure: { seasonalInflowReduction: 0.3 },
        localRecovery: { windShelteredLandWithSourceAccess: { minLandCells: 0, maxLandCells: 0 } }
    });
    return { windDirectionChangesShelter: true, upliftCoolsLand: true, shelterLeavesWaterAndSeaLinksIndependent: true,
        localPressureAndRecoveryExerciseIndependentDrivers: true };
}

function verifyIslandOverlapFixture(macro, phase2) {
    const grid = { width: 9, height: 5, subdivision: 1 };
    const signed = new Array(grid.width * grid.height).fill(-0.1);
    const wetness = signed.map(() => 0);
    const cells = [];
    // Two disconnected test patches let reachability differ within the measured footprint.
    for (const offset of [1, 5]) {
        for (let y = 1; y <= 3; y += 1) {
            for (let x = offset; x < offset + 3; x += 1) {
                const cell = y * grid.width + x;
                cells.push(cell);
                signed[cell] = y === 2 && x === offset + 1 ? 0.1 : 0.4;
                wetness[cell] = offset === 1 ? 0.25 : 0;
            }
        }
    }
    const landTravel = macro.traceDryLandAccess(signed, grid.width, cell => signed[cell] > 0, [24]);
    const build = (wind, supply = wetness, season = 0) => {
        const drainage = macro.routeSurfaceDrainage({ signed, width: grid.width, wetness: supply, receiverAt: () => 'ocean' });
        const water = macro.measureLocalWater({ signed, width: grid.width, drainage, wetness: supply,
            seasonality: signed.map(() => season) });
        const whole = macro.createWaterAccessSummary();
        const subset = macro.createWaterAccessSummary();
        for (const cell of cells) macro.addWaterAccessCell(whole, water, cell);
        const physicalSetting = macro.measureIslandPhysicalSetting({ cells, surface: { signed, inherited: signed, grid },
            readClimate: () => 0.5, readWind: cell => [wind(cell), 0], landTravel, landfall: { landCell: 24 },
            seaLinkCount: 1, visitShelteredCell: cell => macro.addWaterAccessCell(subset, water, cell) });
        const row = { landCellCount: cells.length, physicalSetting, waterAccess: macro.summarizeWaterAccess(whole),
            shelteredWaterAccess: macro.summarizeWaterAccess(subset) };
        assert(macro.validateWaterAccessSubset(row.shelteredWaterAccess, row.waterAccess,
            physicalSetting.terrainShelter.shelteredLandCells, 1));
        return row;
    };
    const left = cell => +(cell % grid.width < 4);
    const overlap = build(left);
    const disjoint = build(cell => 1 - left(cell));
    assert.deepEqual(overlap.waterAccess, disjoint.waterAccess);
    assert.deepEqual(overlap.physicalSetting.transport, disjoint.physicalSetting.transport);
    assert.equal(overlap.shelteredWaterAccess.landCellCount, 1);
    assert.equal(disjoint.shelteredWaterAccess.landCellCount, 1);
    assert.equal(overlap.shelteredWaterAccess.reachableCellCount, 1);
    assert.equal(disjoint.shelteredWaterAccess.reachableCellCount, 0, 'Landfall access is distinct from source access');
    assert.equal(disjoint.shelteredWaterAccess.inputPotential, 0);
    const project = row => phase2.interpretRegionalIslandEnvironment(row, 1).localRecovery;
    assert.deepEqual(project(disjoint).windShelteredLandWithSourceAccess, { minLandCells: 0, maxLandCells: 0, exactLandCells: 0 });
    assert.equal(project(overlap).windShelteredLandWithSourceAccess.exactLandCells, 1);
    assert.deepEqual(project(overlap).habitatInflowPerLandArea.windSheltered, { ordinary: 0.25, lowSeason: 0.25 });
    assert.equal(project(overlap).lowSeasonAllocatedSupplyPerShelteredLandArea, overlap.shelteredWaterAccess.allocatedSupplyPerArea);
    const drySeason = build(left, wetness, 0.75);
    assert.equal(drySeason.shelteredWaterAccess.reachableCellCount, 1);
    assert.equal(drySeason.shelteredWaterAccess.inputPotential, overlap.shelteredWaterAccess.inputPotential);
    assert.equal(drySeason.shelteredWaterAccess.lowInputPotential, overlap.shelteredWaterAccess.inputPotential / 4);

    const allReachable = build(left, signed.map(value => value > 0 ? 0.25 : 0));
    const noneReachable = build(left, wetness.map(() => 0));
    assert.equal(allReachable.waterAccess.reachableCellCount, cells.length);
    assert.equal(allReachable.shelteredWaterAccess.reachableCellCount, 1);
    assert.equal(noneReachable.waterAccess.reachableCellCount, 0);
    assert.equal(noneReachable.shelteredWaterAccess.reachableCellCount, 0);
    assert.equal(project(noneReachable).lowSeasonAllocatedSupplyPerShelteredLandArea, 0);
    assert(macro.validateWaterAccessSubset(allReachable.waterAccess, allReachable.waterAccess, cells.length, 1));
    assert(!macro.validateWaterAccessSubset(disjoint.shelteredWaterAccess, allReachable.waterAccess, 1, 1));
    assert(!macro.validateWaterAccessSubset(overlap.shelteredWaterAccess, noneReachable.waterAccess, 1, 1));
    assert(!macro.validateWaterAccessSubset({ ...overlap.shelteredWaterAccess, allocatedSupplyPerArea: 100 },
        overlap.waterAccess, 1, 1));
    return { sameMarginalsDisjointAndOverlapping: true, seasonalInputIndependentOfReachability: true,
        validBoundsAndConservedAllocation: true };
}

module.exports = { verifyLocalWaterFixture, inspectLocalWater, verifyIslandExposureFixture, verifyIslandOverlapFixture };
