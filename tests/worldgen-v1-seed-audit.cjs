'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { loadWorldGen } = require('../js/worldgen/foundation/node.cjs');

const { worldgenPhase0: phase0, worldgenMacro: macro } = loadWorldGen();
const adapter = phase0.createPhase0OrchestrationAdapter();
const edges = [0, 1, 2, 2147483647, 2147483648, 4294967294, 4294967295];
const consecutive = Array.from({ length: 512 }, (_, index) => index + 10000);
const distributed = Array.from({ length: 512 }, (_, index) => {
    const digest = createHash('sha256').update(`Paths/phase0/512/${index}`).digest();
    return index * 2 ** 23 + (digest.readUInt32BE() & (2 ** 23 - 1));
});
const seeds = [...edges, ...consecutive, ...distributed];
assert.equal(new Set(seeds).size, 1031);

const axes = phase0.getWorldSeedProfileAxisFieldIds();
const channelValues = Object.fromEntries(axes.map(id => [id, []]));
const categories = {};
const namespaces = {};
const collisions = new Map();
const bundles = new Map();
for (const seed of seeds) {
    const { phase0Bundle, phase1SafeSummaryBundle } = adapter.run(seed).outputs;
    const { worldSeedProfile, derivedWorldTendencies, worldSubSeedMap } = phase0Bundle;
    assert(phase0.validatePhase0Export(phase0Bundle).isValid, seed);
    assert.equal(worldSeedProfile.worldSeed, seed);
    assert.equal(macro.intakeMasterConstraints(phase1SafeSummaryBundle).macroSeed, worldSubSeedMap.macroGeographySeed);
    for (const id of axes) {
        const value = worldSeedProfile[id];
        assert(value >= 0 && value <= 1, `${seed} ${id}`);
        channelValues[id].push(value);
    }
    for (const [id, value] of Object.entries({ worldTone: worldSeedProfile.worldTone, ...derivedWorldTendencies })) {
        const values = categories[id] ??= {};
        values[value] = (values[value] || 0) + 1;
    }
    for (const [id, value] of Object.entries(worldSubSeedMap)) {
        assert(Number.isInteger(value) && value >= 0 && value <= 0xffffffff, id);
        const keys = namespaces[id] ??= new Set();
        assert(!keys.has(value), `Seed collision in namespace ${id}`);
        keys.add(value);
        const matchedKey = collisions.get(value);
        if (matchedKey) {
            (categories.crossNamespaceCollision ??= {})[`${matchedKey} → ${id}/${seed}`] = value;
        } else {
            collisions.set(value, `${id}/${seed}`);
        }
    }
    bundles.set(seed, JSON.stringify(phase0Bundle));
}
for (const seed of [...seeds].reverse()) {
    assert.equal(JSON.stringify(adapter.run(seed).outputs.phase0Bundle), bundles.get(seed), seed);
}

const distribution = Object.fromEntries(Object.entries(channelValues).map(([id, values]) => {
    const sorted = [...values].sort((left, right) => left - right);
    const at = fraction => sorted[Math.floor(fraction * (sorted.length - 1))];
    return [id, { min: at(0), p05: at(0.05), median: at(0.5), p95: at(0.95), max: at(1),
        mean: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(6)) }];
}));
console.log(JSON.stringify({
    sample: { edges, consecutive: consecutive.length, distributed: distributed.length, total: seeds.length },
    reverseOrderStable: true,
    namespaceUniqueValueCounts: Object.fromEntries(Object.entries(namespaces).map(([id, keys]) => [id, keys.size])),
    distribution,
    categories
}, null, 2));
