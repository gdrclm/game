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
    const raisedRim = signed.map((value, cell) => cell !== 16 && value === 0.4 ? 0.6 : value);
    const taller = measure(raisedRim, 0.25, 0);
    assert(taller.branches.get(16).storageSpace > wet.branches.get(16).storageSpace);
    assert.equal(taller.branches.get(16).inputPotential, wet.branches.get(16).inputPotential);
    return { retainedSpaceRequiresRelief: true, dryBowlHasNoSupply: true, seasonChangesLowInputOnly: true,
        accessCannotCrossWater: true };
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
    for (const row of islandEnvironment.records) {
        assert.equal(row.waterAccess.landCellCount, row.landCellCount);
        assert.deepEqual(projection.get(row.islandId).waterAccess, row.waterAccess);
    }
    return {
        branchCount: water.branches.length,
        largestBranchArea: Math.max(...water.branches.map(branch => branch.contributingCells)),
        reliefWithSources: Object.values(water.reliefRegions).filter(row => row.sourceCellCount > 0).length,
        islandsWithSources: islandEnvironment.records.filter(row => row.waterAccess.sourceCellCount > 0).length,
        islandsWithRetention: islandEnvironment.records.filter(row => row.waterAccess.storageSpace > 0).length
    };
}

module.exports = { verifyLocalWaterFixture, inspectLocalWater };
