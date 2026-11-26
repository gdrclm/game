'use strict';

const assert = require('node:assert/strict');

function inspectRegionalArchipelago(result, macro) {
    const geography = result.phase1.macroGeographyPackage;
    const regional = geography.regionalArchipelago;
    assert(regional?.islandRecords.length, 'A published macro archipelago needs inherited regional terrain');
    assert.deepEqual(macro.validateRegionalArchipelago(regional, geography), []);
    const debug = result.diagnostics.physicalWorldDebugBundle;
    const { payload } = debug.intermediateOutputs.find(row => row.artifactId === 'foundation_geometry_regionalArchipelagoSurface');
    const { payload: macroElevation } = debug.fieldSnapshots.find(row => row.artifactId === 'foundation_field_finalRelativeElevationField');
    const { payload: topology } = debug.intermediateOutputs.find(row => row.artifactId === 'foundation_geometry_coastalAccessTopology');
    const { payload: seaLevel } = debug.intermediateOutputs.find(row => row.artifactId === 'foundation_geometry_seaLevelModel');
    const { payload: uplift } = debug.fieldSnapshots.find(row => row.artifactId === 'foundation_field_offshoreHotspotUpliftField');
    assert.equal(payload.archipelagoId, regional.archipelagoId);
    assert.equal(payload.sourceHotspotSeedId, seaLevel.hotspotChain.hotspotSeedId);
    assert.deepEqual(payload.islandRecords, regional.islandRecords);
    assert.deepEqual(payload.waterNetwork, regional.waterNetwork);
    assert(Object.isFrozen(regional.islandRecords[0]), 'Regional geography must freeze with Phase 1');
    assert.deepEqual(regional.processAttempts.at(-1).unresolvedMacroIslandIds, []);
    const { signedRelativeElevation: bed, grid } = payload;
    const { width, height, originX, originY, subdivision } = grid;
    assert.equal(bed.length, width * height);
    const expectedParents = new Map(topology.islands.map(row => [row.islandId, 0]));
    const vents = new Set(payload.vents.map(row => row.ventId));
    const availableUplift = uplift.values.reduce((sum, value) => sum + value, 0);
    const regionalUplift = payload.vents.reduce((sum, row) => sum + Math.PI * row.rise * row.radius ** 2 / 2, 0);
    assert(regionalUplift <= availableUplift + 1e-9);
    const macroGraph = debug.graphSnapshots.find(row => row.sourceLayerId === 'seaConnectivityGraph').payload;
    const onRegionalGrid = cell => [
        (cell % macroElevation.width - originX) * subdivision,
        (Math.floor(cell / macroElevation.width) - originY) * subdivision
    ];
    for (const edge of macroGraph.edges) {
        const path = edge.waterPathCellIndices || [];
        for (let i = 1; i < path.length; i += 1) {
            const [x, y] = onRegionalGrid(path[i - 1]);
            const [east, south] = onRegionalGrid(path[i]);
            for (let contact = 0; contact <= subdivision; contact += 1) {
                const column = x + Math.sign(east - x) * contact;
                const row = y + Math.sign(south - y) * contact;
                if (column >= 0 && column < width && row >= 0 && row < height) {
                    assert(bed[row * width + column] <= 0, `Regional shore blocks macro lane ${edge.edgeId}`);
                }
            }
        }
    }
    for (let y = 0; y < height; y += subdivision) {
        for (let x = 0; x < width; x += subdivision) {
            const sourceCell = (originY + y / subdivision) * macroElevation.width + originX + x / subdivision;
            assert(Math.abs(bed[y * width + x] - macroElevation.values[sourceCell]) < 1e-7, 'Regional height drift at parent anchor');
        }
    }
    for (const island of regional.islandRecords) {
        for (const id of island.physicalOrigin.macroIslandIds) {
            assert(expectedParents.has(id));
            if (island.physicalOrigin.macroIslandIds.length === 1) {
                expectedParents.set(id, expectedParents.get(id) + 1);
            }
        }
        const cells = island.landRuns.flatMap(([cell, length]) => Array.from({ length }, (_, offset) => cell + offset));
        assert(cells.every(cell => bed[cell] > 0));
        const unexplored = new Set(cells.slice(1));
        const queue = [cells[0]];
        for (let cursor = 0; cursor < queue.length; cursor += 1) {
            macro.forEachCardinalNeighbor(queue[cursor], width, bed.length, neighbor => {
                if (unexplored.delete(neighbor)) queue.push(neighbor);
            });
        }
        assert.equal(queue.length, cells.length, island.islandId);
        assert(island.shoreEdges.every(([land, water]) => bed[land] > 0 && bed[water] <= 0));
        const meanDepth = island.shoreEdges.reduce((sum, [, water]) => sum - bed[water], 0) / island.shoreEdges.length;
        assert(Math.abs(meanDepth - island.nearshoreDepth.mean) < 1e-6);
        if (island.physicalOrigin.mechanism === 'volcanic_satellite') {
            assert(island.physicalOrigin.volcanicRaisedCells > 0);
            assert(island.physicalOrigin.regionalVentIds.length > 0);
        }
        assert(island.physicalOrigin.regionalVentIds.every(id => vents.has(id)));
    }
    for (const [id, count] of expectedParents) assert(count >= 1, `Inherited island ${id} was removed or merged`);
    for (const link of regional.waterNetwork.links) {
        assert(link.waterPathCellIndices.every(cell => bed[cell] <= 0));
        assert.equal(link.distanceMacroCellUnits, (link.waterPathCellIndices.length - 1) / subdivision);
    }
    return regional.summary;
}

function verifyRegionalNetworkFixture(macro) {
    const width = 5;
    const height = 5;
    const signed = [
        -1, -1, -1, -1, -1,
        -1, 0.5, 0.5, 0.5, -1,
        -1, 0.5, -0.2, 0.5, -1,
        -1, 0.5, 0.5, 0.5, -1,
        -1, -1, -1, -1, -1
    ];
    const island = { islandId: 'region', shoreEdges: [[7, 12], [6, 5]] };
    const { landfalls } = macro.buildRegionalArchipelagoWaterNetwork([island], { grid: { width, height, subdivision: 1 }, signed });
    assert.deepEqual(landfalls, [{ islandId: 'region', landCell: 6, waterCell: 5 }], 'Landfall must reach outside water');
    return { enclosedWaterRejected: true };
}

function verifyRegionalProcessFixture(macro) {
    const width = 13;
    const cells = width * width;
    const source = {
        bed: { width, height: width, values: new Array(cells).fill(-0.003) },
        hotspotUplift: new Array(cells).fill(0),
        fracture: new Array(cells).fill(0),
        storm: new Array(cells).fill(0),
        topology: { islands: [{ cellIndices: [84] }] },
        chain: { trailVector: { x: 1, y: 0 }, peaks: [{ x: 6, y: 6, radius: 3, cellIndex: 84 }] },
        regionalSeed: 427
    };
    const control = macro.buildRegionalArchipelagoSurface(source);
    assert.equal(control.vents.length, 0);
    assert(control.signed.every(value => value <= 0), 'Submerged crust without uplift must stay submerged');
    const volcanicSupport = [...source.hotspotUplift];
    volcanicSupport[84] = 0.24;
    const volcanic = macro.buildRegionalArchipelagoSurface({ ...source, hotspotUplift: volcanicSupport });
    assert(volcanic.vents.length > 0);
    assert(volcanic.signed.every((value, cell) => value >= control.signed[cell]), 'Volcanic lift cannot excavate the shelf');
    const fractured = macro.buildRegionalArchipelagoSurface({ ...source, fracture: new Array(cells).fill(1) });
    assert(fractured.mechanisms.some((value, index) => value === 2 && fractured.signed[index] > 0));
    const wetSource = { ...source, bed: { ...source.bed, values: new Array(cells).fill(0.002) } };
    const eroded = macro.buildRegionalArchipelagoSurface({ ...wetSource, storm: new Array(cells).fill(1) });
    assert(eroded.mechanisms.some((value, index) => value === 3 && eroded.signed[index] <= 0));

    const grid = { originX: 0, originY: 0, width: 7, height: 5, subdivision: 1 };
    const inherited = new Array(35).fill(-0.02);
    inherited[15] = 0.3;
    inherited[19] = 0.3;
    const signed = [...inherited];
    signed[16] = 0.08;
    signed[17] = 0.01;
    signed[18] = 0.06;
    signed[29] = 0.05;
    const mechanisms = new Uint8Array(35);
    const separated = macro.preserveRegionalWaterSeparations({ grid, signed, inherited, mechanisms },
        [{ cellIndices: [15] }, { cellIndices: [19] }], 7);
    assert.equal(separated, 1);
    assert.equal(signed[17], inherited[17]);
    assert.equal(mechanisms[17], 4);
    assert.deepEqual([signed[16], signed[18], signed[29]], [0.08, 0.06, 0.05]);
    return { noUnsupportedEmergence: true, faultUpliftExercised: true, erosionExercised: true,
        inheritedSaddlePreservesIndependentUplift: true };
}

module.exports = { inspectRegionalArchipelago, verifyRegionalNetworkFixture, verifyRegionalProcessFixture };
