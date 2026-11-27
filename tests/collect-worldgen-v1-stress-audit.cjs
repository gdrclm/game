#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const [directory] = process.argv.slice(2);
assert(directory, 'Usage: node tests/collect-worldgen-v1-stress-audit.cjs AUDIT_DIRECTORY');
const load = name => JSON.parse(readFileSync(join(directory, `${name}.json`), 'utf8'));
const reports = {};
const worlds = {};
const initial = load('regional-regression');
const { revision, node } = initial;
const browser = load('browser');
const phase0 = load('phase0');
const measured = new Map(load('measurements').map(row => [row.seed, row]));
const shoreline = load('shoreline');
const shorelineSupport = load('lowstand');
assert.equal(browser.revision, revision);
assert.equal(browser.node, node);
assert.deepEqual(browser.tests.map(test => [test.passed, test.failed, test.pageErrors.length]), [[5, 0, 0], [270, 0, 0]]);
assert.equal(browser.gameBoot.status, 200);
assert.deepEqual(browser.gameBoot.pageErrors, []);
assert.equal(shoreline.revision, revision);
assert.equal(shoreline.node, node);
assert.equal(shorelineSupport.revision, revision);
assert.equal(shorelineSupport.node, node);
assert(shorelineSupport.results.some(row => row.seed === 3019978005 && row.offshorePeaks >= 3));
assert(phase0.reverseOrderStable);
assert.equal(phase0.sample.total, 1031);

function inspectShoreline(row) {
    const { preMarineElevation: elevation, worldBounds: { width, height }, minimumContinentArea } = row;
    assert.equal(elevation.length, width * height);
    const order = elevation.map((_, cell) => cell).sort((a, b) => elevation[b] - elevation[a]);
    const sampled = new Map(row.sampledLevels.map(level => [level.cutoff, (level.leadingAreas[1] || 0) >= minimumContinentArea]));
    const parents = new Int32Array(elevation.length).fill(-1);
    const sizes = new Int32Array(elevation.length);
    let majorBodies = 0;
    let distinctLevels = 0;
    let splitLevels = 0;
    let splitInUsualRange = 0;
    let earliestSplit = null;
    let latestSplit = null;
    function root(cell) {
        while (cell !== parents[cell]) cell = parents[cell];
        return cell;
    }
    function joinBodies(cell, neighbor) {
        if (parents[neighbor] < 0) return;
        let left = root(cell);
        let right = root(neighbor);
        if (left === right) return;
        if (sizes[left] < sizes[right]) [left, right] = [right, left];
        majorBodies -= Number(sizes[left] >= minimumContinentArea) + Number(sizes[right] >= minimumContinentArea);
        sizes[left] += sizes[right];
        parents[right] = left;
        majorBodies += Number(sizes[left] >= minimumContinentArea);
    }
    for (const [index, cell] of order.entries()) {
        // Strict > cutoff: evaluate the exposed cells before adding this elevation group.
        if (index === 0 || elevation[order[index - 1]] !== elevation[cell]) {
            distinctLevels += 1;
            const sample = sampled.get(elevation[cell]);
            if (sample !== undefined) assert.equal(majorBodies >= 2, sample, `${row.seed}: sampled cutoff ${elevation[cell]}`);
            if (majorBodies >= 2) {
                splitLevels += 1;
                const percentile = (order.length - 1 - index) / (order.length - 1);
                latestSplit ??= percentile;
                earliestSplit = percentile;
                splitInUsualRange += Number(percentile >= 0.30 && percentile <= 0.81);
            }
        }
        parents[cell] = cell;
        sizes[cell] = 1;
        if (cell % width > 0) joinBodies(cell, cell - 1);
        if (cell % width < width - 1) joinBodies(cell, cell + 1);
        if (cell >= width) joinBodies(cell, cell - width);
        if (cell < elevation.length - width) joinBodies(cell, cell + width);
    }
    return { seed: row.seed, minimumContinentArea, distinctLevels, splitLevels, splitInUsualRange,
        splitPercentileRange: splitLevels ? [earliestSplit, latestSplit] : null,
        sampledLevels: row.sampledLevels.length,
        largestSampledSecondBody: Math.max(...row.sampledLevels.map(level => level.leadingAreas[1] || 0)) };
}

const shorelineControls = shoreline.worlds.map(inspectShoreline).sort((left, right) => left.seed - right.seed);
const shorelineBySeed = new Map(shorelineControls.map(row => [row.seed, row]));
assert(shorelineBySeed.get(3019978005).splitLevels > 0, 'Exhaustive coastline probe must find the historical highstand control');

const previous = {};
for (const file of ['highstand-scale-audit', 'independent-holdout-audit']) {
    const archived = require(`../docs/context/review/f8t/closure/${file}.json`);
    for (const cohort of Object.values(archived.cohorts)) {
        for (const row of cohort.seeds) {
            previous[row.seed] = { revision: archived.revision, pass: row.pass, phase: row.phase,
                gates: row.phase2Failures?.map(check => check.checkId) };
        }
    }
}
const recoveryHistory = 'review/f8r/macro-recovery-seasonality.md';
for (const seed of [4144686569, 2666689910, 2030830666]) {
    previous[seed] = { revision: 'c642b9b', pass: false, phase: 'phase2',
        gates: ['phase2.design.tension_vs_relief'], source: recoveryHistory };
}
previous[1683167796] = { revision: '0260b5d', pass: false, phase: 'phase2',
    gates: ['phase2.design.tension_vs_relief'], source: 'review/f8t/regional-relief-diversity.md' };
previous[1122193213] = { pass: false, phase: 'phase1', source: 'review/f8t/continental-shoreline/README.md' };

function classify(row, evidence) {
    if (row.phase === 'phase1' && row.message.includes('"continents" must contain at least 2')) {
        assert(evidence?.shorelineProbe);
        const interval = evidence.shorelineProbe.splitPercentileRange;
        const lowstandOnly = interval && interval[1] < 0.30;
        let firstObservedCause = 'pre-marine relief has no cutoff with two minimum-sized bodies';
        let disposition = 'author review of single-continent worlds';
        if (lowstandOnly) {
            firstObservedCause = 'two minimum-sized bodies form only below the ordinary lower sea-level bound';
            disposition = 'author review of lowstand land coverage';
        } else if (interval) {
            firstObservedCause = 'a pre-marine split exists and the final candidate has one major body';
            disposition = 'shoreline selection and archipelago support review';
        }
        return { family: 'continental_minimum', contract: 'MacroGeographyPackage.continents',
            firstObservedCause, disposition };
    }
    if (row.phase === 'phase2') {
        const ids = row.phase2Failures.map(check => check.checkId);
        if (ids.includes('phase2.design.tension_vs_relief')) {
            assert(evidence?.balance);
            const family = evidence.balance.tensionReliefDelta < 0 ? 'excess_recovery' : 'insufficient_recovery';
            return { family, contract: 'EnvironmentalRhythmPackage.synthesized.recoveryProfile',
                firstObservedCause: 'recovery synthesis and mean pressure violate the design balance',
                disposition: 'recovery mechanism review' };
        }
        if (ids.includes('phase2.distribution.pressure_rhythm_differentiation')) {
            return { family: 'pressure_rhythm_distribution', contract: 'Phase 2 synthesized field distribution',
                firstObservedCause: 'sorted synthesized axes converge despite distinct local inputs',
                disposition: 'independent distribution review' };
        }
        if (ids.some(id => id === 'phase2.distribution.relief_presence' || id === 'phase2.gameplay.relief_relevance')) {
            return { family: 'weak_relief_signals', contract: 'EnvironmentalRhythmPackage.domains.recovery',
                firstObservedCause: 'world-level recovery outputs fail presence or gameplay relevance',
                disposition: 'recovery mechanism review' };
        }
    }
    return { family: 'other', contract: row.phase, disposition: 'structural review' };
}

function compact(row) {
    if (row.pass) {
        assert(Object.values(row.determinism).every(Boolean));
        return {
            pass: true, hashes: row.hashes, determinism: row.determinism,
            archivedComparison: previous[row.seed],
            geography: row.map,
            terrain: { deepest: row.terrain.deepest, highest: row.terrain.highest,
                landForms: row.terrain.landForms, seaForms: row.terrain.seaForms, origins: row.terrain.origins },
            climate: { quantiles: row.environment.landClimate, landCellsByType: row.environment.climateCellsByType },
            islands: { origins: row.regionalArchipelago.originCounts, capacity: row.regionalArchipelago.areaSensitivity
                .map(item => item.largestConnectedEligibleCount) },
            recovery: row.phase2.recovery,
            maritime: { status: row.maritime.status, supportedCount: row.maritime.supportedCount }
        };
    }
    assert(row.repeatedFailureMatches, `Unreproduced rejection: ${row.seed}`);
    const evidence = measured.get(row.seed);
    assert(evidence, `Missing diagnostic snapshot: ${row.seed}`);
    assert.equal(evidence.revision, revision);
    assert(!evidence.exported);
    const shorelineProbe = shorelineBySeed.get(row.seed);
    if (shorelineProbe) {
        evidence.shorelineProbe = shorelineProbe;
        evidence.shorelineSupportSamples = shorelineSupport.results.filter(sample => sample.seed === row.seed);
    }
    return {
        pass: false, phase: row.phase, message: row.message, issues: row.issues,
        phase1Errors: row.phase1Report?.diagnostics?.errors,
        gates: row.phase2Failures, repeatedFailureMatches: row.repeatedFailureMatches,
        classification: classify(row, evidence), archivedComparison: previous[row.seed] || null,
        reproduction: [row.seed], evidence
    };
}

function addReport(name, expected) {
    const report = load(name);
    assert.equal(report.revision, revision);
    assert.equal(report.node, node);
    assert.equal(report.seeds.length, expected);
    assert.equal(new Set(report.seeds.map(row => row.seed)).size, expected);
    assert(report.checks.every(check => check.pass), name);
    for (const row of report.seeds) {
        const value = compact(row);
        if (worlds[row.seed]) assert.deepEqual(worlds[row.seed], value, `Duplicate seed ${row.seed}`);
        worlds[row.seed] = value;
    }
    reports[name] = { seeds: report.seeds.map(row => row.seed), passed: report.seeds.filter(row => row.pass).length,
        checks: report.checks.map(check => check.name) };
}

function aggregate(names, expected) {
    const seeds = names.flatMap(name => reports[name].seeds);
    assert.equal(new Set(seeds).size, expected);
    const accepted = seeds.map(seed => worlds[seed]).filter(row => row.pass);
    const failures = {};
    for (const seed of seeds) {
        if (worlds[seed].pass) continue;
        const { family } = worlds[seed].classification;
        (failures[family] ||= []).push(seed);
    }
    const range = select => {
        if (!accepted.length) return null;
        const values = accepted.map(select);
        return [Math.min(...values), Math.max(...values)];
    };
    function sumCounters(select) {
        const totals = {};
        for (const row of accepted) {
            for (const [key, count] of Object.entries(select(row))) totals[key] = (totals[key] || 0) + count;
        }
        return totals;
    }
    return { reports: names, total: expected, accepted: accepted.length, failures,
        exportedPhysicalRange: {
            landFraction: range(row => row.geography.landRatio),
            seaFraction: range(row => 1 - row.geography.landRatio),
            highestElevation: range(row => row.terrain.highest), deepestElevation: range(row => row.terrain.deepest),
            medianLandClimate: Object.fromEntries(Object.keys(accepted[0]?.climate.quantiles || {})
                .map(field => [field, range(row => row.climate.quantiles[field][1])])),
            landForms: sumCounters(row => row.terrain.landForms), seafloorForms: sumCounters(row => row.terrain.seaForms),
            islandOrigins: sumCounters(row => row.islands.origins),
            supportedMaritimeOpportunities: range(row => row.maritime.supportedCount)
        },
        acceptedWith30ConnectedAtThreshold: [0, 1, 2, 3].map(index =>
            accepted.filter(row => row.islands.capacity[index] >= 30).length) };
}

addReport('regional-regression', 49);
for (let index = 0; index < 4; index += 1) {
    addReport(`stress-${index}`, 16);
    addReport(`final-holdout-${index}`, 16);
}
addReport('edges', 7);
addReport('additional', 11);
addReport('recovery-controls', 4);

const consecutive = prefix => [0, 1, 2, 3].map(index => `${prefix}-${index}`);
const aggregates = {
    mandatory: aggregate(['regional-regression'], 49),
    originalStress: aggregate(consecutive('stress'), 64),
    independentHoldout: aggregate(consecutive('final-holdout'), 64),
    edges: aggregate(['edges'], 7),
    additional: aggregate(['additional'], 11),
    recoveryControls: aggregate(['recovery-controls'], 4)
};
const recoveryControls = reports['recovery-controls'].seeds.map(seed => {
    const row = measured.get(seed);
    assert(row?.exported && row.revision === revision);
    return row;
});
const allCases = Object.values(worlds);
const combined = { uniqueSeeds: allCases.length, accepted: allCases.filter(row => row.pass).length,
    rejected: allCases.filter(row => !row.pass).length };
console.log(JSON.stringify({ schema: 'paths-prompt-04-stress-audit-v1', revision, node,
    phase0, browser, reports, aggregates, combined, causalChecks: initial.checks, recoveryControls,
    shorelineControls, shorelineSupport: shorelineSupport.results, worlds }, null, 2));
