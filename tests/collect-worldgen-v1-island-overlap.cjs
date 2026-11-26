#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { loadWorldGen } = require('../js/worldgen/foundation/node.cjs');

function collectIsland(seed, islandId) {
    const { worldgenMacro: macro, worldgenFoundation } = loadWorldGen();
    const { buildRegionalIslandEnvironment, measureLocalWater, measureIslandPhysicalSetting } = macro;
    let result;
    macro.buildRegionalIslandEnvironment = (islands, surface, ...args) => {
        const island = islands.find(row => row.islandId === islandId);
        assert(island, `No island ${islandId} on seed ${seed}`);
        const firstCell = island.landRuns[0][0];
        let water;
        let samples;
        macro.measureLocalWater = options => {
            water = measureLocalWater(options);
            return water;
        };
        macro.measureIslandPhysicalSetting = options => {
            if (options.cells[0] !== firstCell) return measureIslandPhysicalSetting(options);
            const sheltered = new Set();
            const physicalSetting = measureIslandPhysicalSetting({ ...options, visitShelteredCell(cell) {
                sheltered.add(cell);
                options.visitShelteredCell(cell);
            } });
            samples = options.cells.map(cell => {
                const source = water.sourceCell[cell];
                return {
                    x: cell % surface.grid.width,
                    y: Math.floor(cell / surface.grid.width),
                    sheltered: sheltered.has(cell),
                    reachable: source >= 0,
                    source: cell === source,
                    ordinary: water.input[cell] / water.cellArea,
                    lowSeason: water.lowInput[cell] / water.cellArea,
                    allocatedLow: source < 0 ? 0 : water.allocatedLowInput[source] / (water.areaServed[source] * water.cellArea)
                };
            });
            return physicalSetting;
        };
        try {
            const environment = buildRegionalIslandEnvironment(islands, surface, ...args);
            const record = environment.records.find(row => row.islandId === islandId);
            assert.equal(samples.length, record.landCellCount);
            assert.equal(samples.filter(row => row.sheltered && row.reachable).length, record.shelteredWaterAccess.reachableCellCount);
            result = { seed, islandId, subdivision: surface.grid.subdivision, record, samples };
            return environment;
        } finally {
            macro.measureLocalWater = measureLocalWater;
            macro.measureIslandPhysicalSetting = measureIslandPhysicalSetting;
        }
    };
    try {
        worldgenFoundation.runWorldGenFoundation(seed);
        result.exported = true;
    } catch (error) {
        if (error.phase !== 'phase2' || !result) throw error;
        result.exported = false;
        result.rejectionChecks = Object.values(error.evidence.phase2Report).flatMap(section => section?.checks ?? [])
            .filter(check => check.status !== 'pass').map(check => check.checkId);
    }
    return result;
}

const pairs = process.argv.slice(2);
assert(pairs.length, 'Usage: node tests/collect-worldgen-v1-island-overlap.cjs SEED:ISLAND_ID ...');
const cases = pairs.map(pair => {
    assert(/^\d+:regional_island_\d+_\d+$/.test(pair), `Invalid island case: ${pair}`);
    const [seed, islandId] = pair.split(':');
    return collectIsland(Number(seed), islandId);
});
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
console.log(JSON.stringify({ revision, cases }));
