'use strict';

const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { compileFunction } = require('node:vm');

const repo = resolve(__dirname, '../../..');
const phase2Scripts = [
    'index.js', 'contracts/index.js', 'deterministic-rng.js', 'normalization.js',
    'intake/index.js', 'binding/index.js', 'pressure/index.js', 'recovery/index.js',
    'rhythm/index.js', 'summaries/index.js', 'validation/index.js', 'rebalance/index.js',
    'debug/index.js', 'export/index.js', 'orchestration/index.js'
].map(file => `js/worldgen/phase2/${file}`);

function loadWorldGen({ includeFixtureHarness = false } = {}) {
    const html = readFileSync(resolve(repo, 'index.html'), 'utf8');
    const macroScripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)]
        .map(match => match[1])
        .filter(file => /^js\/worldgen\/(phase0|macro)\//.test(file));
    const window = { Game: { systems: {} } };
    const scripts = [...macroScripts, ...phase2Scripts,
        'js/worldgen/foundation/record-references.js', 'js/worldgen/foundation/index.js'];
    if (includeFixtureHarness) scripts.push('js/worldgen/phase2/tests/index.js');
    for (const file of scripts) {
        compileFunction(readFileSync(resolve(repo, file), 'utf8'), ['window'], { filename: file })(window);
    }
    return window.Game.systems;
}

module.exports = { loadWorldGen };
