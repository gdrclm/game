'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');

const [destination, repository, ...seeds] = process.argv.slice(2);
assert(destination && repository && seeds.length && seeds.every(seed => /^\d+$/.test(seed) && Number(seed) <= 0xffffffff),
    'Usage: node tests/capture-worldgen-v1-quality.cjs <output-dir> <checkout> <uint32 seeds...>');
const repo = resolve(repository);
const revision = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const { worldgenFoundation, worldgenMacro } = require(join(repo, 'js/worldgen/foundation/node.cjs')).loadWorldGen();

const diagnosticOutputs = {
    continentalCohesion: ['corePotentialAnalysis', 'continentalCohesionSummaries', 'fracturedPeripheryAnalysis'],
    isolationPeriphery: ['isolationAnalysis', 'peripheryClusters'],
    strategicRegionSynthesis: ['strategicRegionCandidates'],
    validationRebalance: ['macroValidationDiagnostics']
};
// The baseline exposes the same stage results as summaries. Preserve the full
// debug rows at this boundary without changing its generator or canonical export.
const buildDebug = worldgenMacro.buildFoundationSpatialDebug;
worldgenMacro.buildFoundationSpatialDebug = (input, makeEntry, categories) => {
    buildDebug(input, makeEntry, categories);
    for (const [stageId, ids] of Object.entries(diagnosticOutputs)) {
        for (const outputId of ids) {
            const artifactId = 'foundation_geometry_' + outputId;
            const payload = input[stageId]?.outputs?.intermediateOutputs?.[outputId];
            if (!payload || categories.intermediateOutputs.some(entry => entry.artifactId === artifactId)) continue;
            categories.intermediateOutputs.push(makeEntry({
                artifactId, artifactKind: 'intermediateOutput', stageId, sourceLayerId: outputId, payload
            }, 'intermediateOutputs'));
        }
    }
};

mkdirSync(destination, { recursive: true });
for (const value of seeds) {
    const seed = Number(value);
    let snapshot;
    try {
        const result = worldgenFoundation.runWorldGenFoundation(seed, { includeDebugArtifacts: true, includeCausalDiagnostics: true });
        snapshot = { seed, revision, ...result };
    } catch (error) {
        process.exitCode = 1;
        console.error(seed, error.message);
        snapshot = { seed, revision, error: error.message, phase: error.phase, diagnostics: error.evidence };
    }
    writeFileSync(join(destination, `seed-${seed}.json`), JSON.stringify(snapshot));
}
