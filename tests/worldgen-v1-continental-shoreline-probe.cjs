#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { loadWorldGen } = require('../js/worldgen/foundation/node.cjs');

const seeds = process.argv.slice(2).map(seed => {
    assert(/^\d+$/.test(seed) && Number(seed) <= 0xffffffff, 'Expected uint32 seed');
    return Number(seed);
});
assert(seeds.length, 'Supply at least one seed');

const { worldgenMacro: macro, worldgenPhase0: phase0 } = loadWorldGen();
const adapter = phase0.createPhase0OrchestrationAdapter();
const selectShoreline = macro.selectContinentalShoreline;
const worldBounds = { width: 256, height: 128 };

function describeShoreline(seed) {
    const phase0Export = adapter.run(seed).outputs;
    const profile = macro.intakeMasterConstraints(phase0Export.phase1SafeSummaryBundle);
    const input = { macroSeed: profile.macroSeed, macroSeedProfile: profile,
        phase1Constraints: macro.normalizePhase1SeedConstraints(profile), worldBounds, includeDebugArtifacts: false };
    const tectonicSkeleton = macro.generateTectonicSkeleton(input);
    let evidence;
    macro.selectContinentalShoreline = (elevation, bounds, initialPercentile, collectComponents, raiseChain) => {
        const production = selectShoreline(elevation, bounds, initialPercentile, collectComponents, raiseChain);
        const sortedElevation = elevation.slice().sort((a, b) => a - b);
        const sampledLevels = [];
        for (let basisPoints = 2000; basisPoints <= 9600; basisPoints += 20) {
            const percentile = basisPoints / 10000;
            const cutoff = sortedElevation[Math.floor((sortedElevation.length - 1) * percentile)];
            const land = elevation.map(value => Number(value > cutoff));
            const leadingAreas = collectComponents(land, bounds.width, bounds.height, 1)
                .map(component => component.cellCount).sort((a, b) => b - a).slice(0, 3);
            sampledLevels.push({ percentile, cutoff, leadingAreas });
        }
        evidence = { seed, worldBounds: bounds, minimumContinentArea: macro.getContinentMinimumSize(elevation.length),
            chosen: { percentile: production.percentile, cutoff: production.cutoff, attempts: production.attempts },
            sampledLevels, preMarineElevation: elevation };
        return production;
    };
    try {
        const relief = macro.generateReliefElevation({ ...input, tectonicSkeleton });
        evidence.chosen.supportedHotspotPeaks =
            relief.outputs.fields.seaLevelAppliedElevationField.seaLevelModel.hotspotChain?.distinctEmergenceCount ?? 0;
        return evidence;
    } finally {
        macro.selectContinentalShoreline = selectShoreline;
    }
}

const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
console.log(JSON.stringify({ revision, node: process.version, worlds: seeds.map(describeShoreline) }));
