#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
const { loadWorldGen } = require(resolve('js/worldgen/foundation/node.cjs'));

const args = process.argv.slice(2);
assert(args.length, 'Usage: node tests/measure-worldgen-v1-shoreline-support.cjs SEED:PERCENTILE[,PERCENTILE] ...');
const { worldgenMacro: macro, worldgenPhase0: phase0 } = loadWorldGen();
const original = macro.selectContinentalShoreline;
const worldBounds = { width: 256, height: 128 };
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const results = [];

for (const argument of args) {
    const [seedText, levels] = argument.split(':');
    const seed = Number(seedText);
    assert(/^\d+$/.test(seedText) && seed <= 0xffffffff && levels, argument);
    const percentiles = levels.split(',').map(value => {
        assert(value.trim() && Number(value) >= 0 && Number(value) <= 1, argument);
        return Number(value);
    });
    const phase0Export = phase0.createPhase0OrchestrationAdapter().run(seed).outputs;
    const profile = macro.intakeMasterConstraints(phase0Export.phase1SafeSummaryBundle);
    const input = { macroSeed: profile.macroSeed, macroSeedProfile: profile,
        phase1Constraints: macro.normalizePhase1SeedConstraints(profile), worldBounds, includeDebugArtifacts: false };

    macro.selectContinentalShoreline = (elevation, bounds, initialPercentile, collect, raiseChain) => {
        assert(raiseChain);
        const sorted = elevation.slice().sort((left, right) => left - right);
        const minimumSize = macro.getContinentMinimumSize(elevation.length);
        for (const percentile of percentiles) {
            const cutoff = sorted[Math.floor((sorted.length - 1) * percentile)];
            const land = elevation.map(value => Number(value > cutoff));
            const bodies = collect(land, bounds.width, bounds.height, 1).map(body => body.cellCount)
                .filter(count => count >= minimumSize).sort((left, right) => right - left);
            const slice = { land, cutoff, percentile };
            const normal = raiseChain(slice);
            const refined = raiseChain(slice, true);
            results.push({ seed, percentile, bodies, exposedLandFraction: land.filter(Boolean).length / land.length,
                offshorePeaks: normal.hotspotChain?.distinctEmergenceCount ?? 0,
                refinedOffshorePeaks: refined.hotspotChain?.distinctEmergenceCount ?? 0 });
        }
        return original(elevation, bounds, initialPercentile, collect, raiseChain);
    };
    try {
        const tectonicSkeleton = macro.generateTectonicSkeleton(input);
        macro.generateReliefElevation({ ...input, tectonicSkeleton });
    } finally {
        macro.selectContinentalShoreline = original;
    }
}

console.log(JSON.stringify({ revision, node: process.version, results }, null, 2));
