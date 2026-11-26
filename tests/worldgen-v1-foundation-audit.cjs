#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { loadWorldGen } = require('../js/worldgen/foundation/node.cjs');
const { runCausalChecks } = require('./worldgen-v1-causal.cjs');
const { inspectPassageEndpoints, verifyPassageFixture, verifyHotspotFixture, verifyCoastalAccessFixture } = require('./worldgen-v1-quality.cjs');
const { verifySpatialAggregation, verifyLocalRecovery, verifySeasonalRecovery } = require('./worldgen-v1-recovery.cjs');
const { inspectClimateAndPressure, inspectFinalTerrain, verifyFinalTerrainFixture, verifyFinalDrainageFixture,
    verifySaddleFixture, verifySeaBoundaryFixture, verifyInlandChokepointFixture,
    verifyContinentalShorelineFixture } = require('./worldgen-v1-terrain.cjs');
const { inspectRegionalArchipelago, verifyRegionalNetworkFixture, verifyRegionalProcessFixture, verifyRegionalCarrierFixture, verifyRegionalEnvironmentFixture } = require('./worldgen-v1-regional-archipelago.cjs');
const { verifyLocalWaterFixture, inspectLocalWater, verifyIslandExposureFixture } = require('./worldgen-v1-local-water.cjs');

const canonical = [42, 137, 2026];
const holdout = [4194307, 271828183, 698377633, 1258291229, 1908874353, 2576980379, 3405691582, 4286578687];
const expanded = [73537, 16908799, 422095321, 894213317, 1536241709, 2269445513, 3071624507, 4011398309];
// Preserve the historical 19-seed cohort; regression includes every F8-Q case.
const f8q = [40681987, 359393571, 801384629, 1431655765, 2018958301, 2764796977, 3669891307, 4264079171];
const f8qFormerBlind = [64847321, 958614127, 2345998979, 3900041903];
const all = canonical.concat(holdout, expanded);
const regression = all.concat(f8q, f8qFormerBlind);
const recoveryRegression = regression.concat(3508323923);
const knownPhysical = [1122193213, 2337086253, 4144686569, 1665754063, 2727244283, 2964753490, 4085637119,
    3019978005, 1240171611, 3928839710, 1054323503, 2094783996, 2402593754, 2917478163, 3206964149, 4286438917];
const foundationRegression = recoveryRegression.concat(2337086253, 2727244283, 2964753490, 4085637119);
const originalRegionalRegression = foundationRegression.concat(2856344, 640306144, 1880886041, 3271942068,
    792866484, 2220939230, 2546155002);
const regionalRegression = originalRegionalRegression.concat(3840024598,
    3019978005, 2402593754, 82211472, 3338251652, 1715244351);
const edges = [0, 1, 2, 2147483647, 2147483648, 4294967294, 4294967295];
function stratifiedSeeds(namespace) {
    return Array.from({ length: 64 }, (_, index) => {
        const digest = createHash('sha256').update(`${namespace}/${index}`).digest();
        return index * 2 ** 26 + (digest.readUInt32BE() & (2 ** 26 - 1));
    });
}
const stress = stratifiedSeeds('Paths/F8-S/2026-11-26');
const finalHoldout = stratifiedSeeds('Paths/F8-Final/Independent-v1');
const previouslyKnown = new Set([...stress, ...originalRegionalRegression, ...knownPhysical, ...edges]);
assert(finalHoldout.every(seed => !previouslyKnown.has(seed)), 'The new holdout must exclude previously tested seeds');
assert.equal(new Set(regression).size, 31, 'Regression cohort must preserve all reviewed seeds');
assert.equal(new Set(recoveryRegression).size, 32, 'Recovery regression must include the F8-R area case');
assert.equal(new Set(foundationRegression).size, 36, 'Foundation regression must include the physical repairs');
assert.equal(new Set(originalRegionalRegression).size, 43, 'Preserve every mandatory regional regression');
const cohorts = { canonical, holdout, expanded, all, f8q, regression, 'recovery-regression': recoveryRegression,
    'foundation-regression': foundationRegression, 'regional-regression': regionalRegression,
    'known-physical': knownPhysical, edges,
    ...Object.fromEntries([0, 1, 2, 3].flatMap(id => [
        [`stress-${id}`, stress.filter((_, index) => index % 4 === id)],
        [`final-holdout-${id}`, finalHoldout.filter((_, index) => index % 4 === id)]
    ]))
};
const args = process.argv.slice(2);
const seeds = [];
let cohort = 'canonical';
let snapshots;
let runCausal = false;
for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === '--cohort') cohort = args[++index];
    else if (token === '--snapshots') snapshots = args[++index];
    else if (token === '--causal') runCausal = true;
    else {
        assert(/^\d+$/.test(token) && Number(token) <= 0xffffffff, `Expected uint32 seed, got ${token}`);
        seeds.push(Number(token));
    }
}
assert(Object.hasOwn(cohorts, cohort), `Unknown cohort ${cohort}`);
if (!seeds.length) seeds.push(...cohorts[cohort]);
if (snapshots) mkdirSync(snapshots, { recursive: true });

const systems = loadWorldGen({ includeFixtureHarness: true });
const { worldgenFoundation, worldgenMacro: macro, worldgenPhase0: phase0, worldgenPhase2: phase2 } = systems;
const revision = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const report = { schema: 'worldgen-foundation-audit-v2', revision, node: process.version, checks: [], seeds: [] };
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const geometry = (debug, id) => debug.intermediateOutputs.find(entry => entry.artifactId === `foundation_geometry_${id}`)?.payload;
const field = (debug, id) => debug.fieldSnapshots.find(entry => entry.payload.fieldId === id)?.payload;
const failedChecks = data => Object.values(data || {}).flatMap(section => section?.checks || [])
    .filter(row => row.status !== 'pass').map(({ checkId, status, details }) => ({ checkId, status, details: details.slice(0, 5) }));

function check(name, run) {
    try {
        report.checks.push({ name, pass: true, details: run() });
    } catch (error) {
        report.checks.push({ name, pass: false, error: error.stack });
        console.error(name, error.message);
    }
}

check('Phase 0 official intake and seed tamper rejection', () => {
    const { outputs } = phase0.createPhase0OrchestrationAdapter().run(42);
    const { phase0Bundle: bundle, phase1SafeSummaryBundle } = outputs;
    assert(phase0.validatePhase0Export(bundle).isValid);
    const invalid = structuredClone(bundle);
    invalid.worldSubSeedMap.pressureSeed = (invalid.worldSubSeedMap.pressureSeed + 1) >>> 0;
    assert(!phase0.validatePhase0Export(invalid).isValid);
    const profile = macro.intakeMasterConstraints(phase1SafeSummaryBundle);
    assert.equal(profile.macroSeed, bundle.worldSubSeedMap.macroGeographySeed);
    assert.equal(profile.coastJaggedness, 0.5);
    assert.equal(macro.ingestMacroSeedProfile({ ...profile, coastJaggedness: 0.8 }).coastJaggedness, 0.8);
    const namespace = macro.buildMacroSubSeedNamespace('hydrosphere', 'riverBasins', 'watershed001');
    assert.equal(namespace, 'macro.hydrosphere.riverBasins.watershed001');
    return bundle.validationReport.isValid;
});

check('Maritime demand requires supported sea routes', () => {
    const zone = { seaRegionIds: ['sea1', 'sea2'], detectionConfidence: 0.7 };
    const support = { routeRows: [{ routeMode: 'marine_assisted', meanEdgeRouteCost: 0.25 }], corridorRows: [] };
    const score = (context, value) => macro.computeArchipelagoSignificanceMetrics(zone, context, {}, value);
    const low = score(support, 0.1), neutral = score(support, 0.5), high = score(support, 0.9);
    assert(low.connectiveValue < neutral.connectiveValue && neutral.connectiveValue < high.connectiveValue);
    assert.equal(low.fragility, high.fragility);
    assert.equal(low.contestScore, high.contestScore);
    assert.equal(score({ routeRows: [] }, 0.1).connectiveValue, score({ routeRows: [] }, 0.9).connectiveValue);
    return [low.connectiveValue, neutral.connectiveValue, high.connectiveValue];
});

check('Phase 2 fixture harness', () => {
    const result = phase2.runPhase2TestHarness();
    assert.equal(result.overallStatus, 'pass');
    return { smoke: result.smokeSuite.summary, regression: result.regressionSuite.summary };
});
check('Physical passage closure and terminal negative controls', () => verifyPassageFixture(macro));
check('A coast node must enter a connected water segment', () => verifyCoastalAccessFixture(macro));
check('Hotspot curvature follows shallow crust at fixed plate drift', () => verifyHotspotFixture(macro));
check('Land-weighted pressure and local recovery timing', () => verifySpatialAggregation(phase2));
check('Signed final terrain and carved-bed controls', () => verifyFinalTerrainFixture(macro));
check('Boundary-only water stays physical without becoming a macro sea', () => verifySeaBoundaryFixture(macro));
check('Inland bottlenecks bind measured relief while retaining segment provenance', () => verifyInlandChokepointFixture(macro));
check('High sea reaches measured continental saddles with supported offshore islands', () => verifyContinentalShorelineFixture(macro));
check('Final downhill routing and water receiver controls', () => verifyFinalDrainageFixture(macro));
check('Saddles require both rising and falling transects', () => verifySaddleFixture(macro));
check('Regional landfalls require open water', () => verifyRegionalNetworkFixture(macro));
check('Regional surface requires local physical support', () => verifyRegionalProcessFixture(macro));
check('Regional carrier capacity and complete raster-backed island geometry', () => verifyRegionalCarrierFixture(macro));
check('Regional drainage conserves land and responds to wetness', () => verifyRegionalEnvironmentFixture(macro));
check('Local water retains geometry, seasonal input, and travel evidence independently', () => verifyLocalWaterFixture(macro));
check('Regional pressure and recovery follow independent water, shelter and movement measurements', () => verifyIslandExposureFixture(macro, phase2));

function inspectGeometry(result) {
    const debug = result.diagnostics.physicalWorldDebugBundle;
    macro.assertPhysicalWorldDebugBundle(debug);
    const mask = field(debug, 'coastJaggednessControlledLandWaterMaskField');
    const { width, values, threshold } = mask;
    const isLand = cell => values[cell] >= threshold;
    const adjacent = (a, b) => Math.abs(a % width - b % width) + Math.abs(Math.floor(a / width) - Math.floor(b / width)) === 1;
    const topology = geometry(debug, 'coastalAccessTopology');
    const sea = debug.graphSnapshots.find(snapshot => snapshot.sourceLayerId === 'seaConnectivityGraph').payload;
    for (const port of topology.ports) {
        assert(isLand(port.landCellIndex) && !isLand(port.waterCellIndex) && adjacent(port.landCellIndex, port.waterCellIndex), port.coastalNodeId);
    }
    for (const edge of sea.edges) {
        assert(edge.waterPathCellIndices.length > 1, edge.edgeId);
        edge.waterPathCellIndices.forEach((cell, index, path) => {
            assert(cell >= 0 && cell < values.length && !isLand(cell), edge.edgeId);
            if (index > 0) assert(adjacent(cell, path[index - 1]), edge.edgeId);
        });
    }
    const routeIds = new Set(result.phase1.macroGeographyPackage.macroRoutes.map(route => route.routeId));
    const corridors = geometry(debug, 'macroCorridors');
    const corridorSummary = corridors.summary;
    const checkedPassages = inspectPassageEndpoints(topology, sea, mask);
    assert(checkedPassages.every(check => check.recordedBypassMatches
        && ['disconnected_after_closure', 'measured_detour'].includes(check.status)), 'Unproven passage dependence');
    const sampledCosts = new Map(geometry(debug, 'macroRoutes').candidateRoutes.map(route => [route.routeId, route.totalRouteCost]));
    for (const corridor of corridors.macroCorridors) {
        for (const sample of corridor.dependenceSampleRows) {
            if (sample.blockedWithoutCorridor) continue;
            const originalCost = sampledCosts.get(sample.routeId);
            assert(sample.alternativeRouteCost >= originalCost - 0.001, sample.routeId);
            const expectedPenalty = Math.min(1, Math.max(0, (sample.alternativeRouteCost - originalCost) / originalCost));
            assert(Math.abs(sample.relativeDetourPenalty - expectedPenalty) <= 0.000500001, sample.routeId);
        }
    }
    const verifiedPassages = topology.islandPassages.filter(passage =>
        passage.routeIds.every(id => routeIds.has(id)) && passage.shoreCellIndices.every(isLand)
        && !isLand(passage.cellIndex) && (passage.bypassTravelCells === null || passage.bypassTravelCells > passage.travelCells)
    );
    for (const passage of verifiedPassages) {
        const [shoreA, shoreB] = passage.shoreCellIndices;
        const section = [shoreA, ...passage.restrictedCellIndices, shoreB];
        assert(section.slice(1, -1).every(cell => !isLand(cell)), passage.passageId);
        assert(section.slice(1).every((cell, index) => {
            const previous = section[index];
            return Math.max(Math.abs(cell % width - previous % width), Math.abs(Math.floor(cell / width) - Math.floor(previous / width))) === 1;
        }), passage.passageId);
        assert(passage.corridorIds.length > 0 && passage.corridorIds.every(id =>
            corridors.macroCorridors.find(corridor => corridor.corridorId === id)?.sourcePassageId === passage.passageId), passage.passageId);
        assert(topology.islands.some(island => island.cellIndices.includes(shoreA)), passage.passageId);
        assert(topology.islands.some(island => island.cellIndices.includes(shoreB) && !island.cellIndices.includes(shoreA))
            || topology.approachShorelines.some(body => body.continentId === passage.shoreContinentId
                && body.shoreCellIndices.includes(shoreB)), passage.passageId);
    }
    assert(verifiedPassages.length >= 2, `Need two route-backed constrictions with measured detours, found ${verifiedPassages.length}`);
    assert(corridorSummary.brittleCorridorCount >= 1 && corridorSummary.redundantCorridorCount >= 1, 'Need brittle and redundant corridors');
    assert.equal(result.diagnostics.maritime.status, 'pass', 'Maritime diagnostics lack supported cases');

    const watersheds = geometry(debug, 'watershedSegmentation').watersheds;
    for (const watershed of watersheds) {
        const remaining = new Set(watershed.cellIndices);
        const queue = [watershed.cellIndices[0]];
        remaining.delete(queue[0]);
        for (let cursor = 0; cursor < queue.length; cursor += 1) {
            macro.forEachCardinalNeighbor(queue[cursor], width, values.length, neighbor => {
                if (remaining.delete(neighbor)) queue.push(neighbor);
            });
        }
        assert.equal(remaining.size, 0, `Disconnected watershed ${watershed.watershedId}`);
    }
    const shoreline = geometry(debug, 'seaLevelModel');
    return {
        landRatio: values.filter(value => value >= threshold).length / values.length,
        continentCells: geometry(debug, 'continentBodies').continentBodies.map(row => row.cellCount),
        seaBasinTypes: geometry(debug, 'seaRegionClusters').seaRegionClusters.map(row => row.basinType),
        islandAreas: topology.islands.map(island => island.cellIndices.length),
        passageWidths: verifiedPassages.map(passage => passage.widthCells),
        shorelinePercentile: shoreline.thresholdPercentile,
        shorelineAttempts: shoreline.shorelineAttempts.length,
        coastalPorts: topology.ports.length,
        seaLanes: sea.edges.length,
        brittleCorridors: corridorSummary.brittleCorridorCount,
        redundantCorridors: corridorSummary.redundantCorridorCount
    };
}

function testHandoffs(result) {
    const { macroGeographyPackage: geography, macroGeographyHandoffPackage: handoff } = result.phase1;
    const { phase0Bundle } = result.phase0.outputs;
    assert(Object.isFrozen(phase0Bundle.worldSubSeedMap) && Object.isFrozen(geography.continents[0])
        && Object.isFrozen(handoff.collapsePressureSeeds) && Object.isFrozen(result.phase2.pressureFieldPackage.domains));
    assert(!geography.debugArtifacts?.physicalWorldDebugBundle, 'Diagnostics must stay separate from the canonical root package');
    const { pressureSeed, rhythmSeed } = phase0Bundle.worldSubSeedMap;
    const args = { macroGeographyHandoffPackage: handoff, pressureSeed, rhythmSeed };
    const engine = phase2.createPhase2Engine();
    const coverage = structuredClone(geography.environmentalCoverage);
    const [climateId] = Object.keys(coverage.climateBands);
    coverage.climateBands[climateId].landCellCount = -1;
    assert.throws(() => engine.run({ ...args, macroGeographyPackage: { ...geography, environmentalCoverage: coverage } }),
        /invalid_environmental_coverage/);
    delete coverage.climateBands[climateId];
    assert.throws(() => engine.run({ ...args, macroGeographyPackage: { ...geography, environmentalCoverage: coverage } }),
        /invalid_environmental_coverage/);
    const branchCoverage = structuredClone(geography.environmentalCoverage);
    branchCoverage.localWater.branches[0].lowInputPotential = branchCoverage.localWater.branches[0].inputPotential + 1;
    assert.throws(() => engine.run({ ...args, macroGeographyPackage: { ...geography, environmentalCoverage: branchCoverage } }),
        /invalid_environmental_coverage/);
    assert.throws(() => engine.run({ ...args, macroGeographyPackage: { ...geography, continents: [] } }), /insufficient_required_root_records/);
    assert.throws(() => engine.run({
        ...args, macroGeographyPackage: { ...geography, validationReport: { ...geography.validationReport, isValid: false } }
    }), /Invalid MacroGeographyPackage intake/);
    const route = { ...geography.macroRoutes[0], toRegion: 'absent_region' };
    assert.throws(() => macro.assertFoundationRecordReferences({
        ...geography, macroRoutes: [route, ...geography.macroRoutes.slice(1)]
    }), /does not resolve/);
    const regional = structuredClone(geography.regionalArchipelago);
    const port = regional.waterNetwork.landfalls[0];
    const nearby = regional.waterNetwork.links.find(link => link.fromIslandId === port.islandId || link.toIslandId === port.islandId);
    nearby.waterPathCellIndices[0] = port.landCell;
    assert(!macro.validateMacroGeographyPackage({ ...geography, regionalArchipelago: regional }).isValid,
        'A regional water path that reaches land must fail Phase 1 validation');
    const changedRegionalSeed = { ...geography.regionalArchipelago,
        regionalSeed: (geography.regionalArchipelago.regionalSeed + 1) >>> 0 };
    assert(!macro.validateMacroGeographyPackage({ ...geography, regionalArchipelago: changedRegionalSeed }).isValid);
    const incorrectEnvironment=structuredClone(geography.regionalArchipelago);
    incorrectEnvironment.islandEnvironment.records[0].unmatchedClimateCells+=1;
    assert(!macro.validateMacroGeographyPackage({...geography,regionalArchipelago:incorrectEnvironment}).isValid);
    assert.throws(()=>engine.run({...args,macroGeographyPackage:{...geography,regionalArchipelago:incorrectEnvironment}}),
        /invalid_regional_island_environment/);
    const incorrectAccess = structuredClone(geography.regionalArchipelago);
    const invalidWater = incorrectAccess.islandEnvironment.records[0].waterAccess;
    invalidWater.reachableCellCount = invalidWater.landCellCount + 1;
    assert(!macro.validateMacroGeographyPackage({ ...geography, regionalArchipelago: incorrectAccess }).isValid);
    const incorrectCount = structuredClone(geography.regionalArchipelago);
    incorrectCount.summary.areaSensitivity[0].largestConnectedEligibleCount += 1;
    assert(!macro.validateMacroGeographyPackage({ ...geography, regionalArchipelago: incorrectCount }).isValid);
    const missingShore = structuredClone(geography.regionalArchipelago);
    missingShore.islandRecords[0].shoreEdges.pop();
    assert(!macro.validateMacroGeographyPackage({ ...geography, regionalArchipelago: missingShore }).isValid);
    const unresolvedVent = structuredClone(geography.regionalArchipelago);
    unresolvedVent.islandRecords[0].physicalOrigin.regionalVentIds.push('missing_vent');
    assert(!macro.validateMacroGeographyPackage({ ...geography, regionalArchipelago: unresolvedVent }).isValid);
    const { elevationRaster, ...legacyRegion } = geography.regionalArchipelago;
    // A package with a new, raster-indexed separation witness must keep the raster.
    if (!legacyRegion.islandRecords.some(row => row.physicalOrigin.restoredSeparationPath)) {
        assert(macro.validateMacroGeographyPackage({ ...geography, regionalArchipelago: legacyRegion }).isValid);
    }
    const truncatedRegion = { ...legacyRegion, elevationRaster: { ...elevationRaster, samplesBase64: 'AAAA' } };
    assert(!macro.validateMacroGeographyPackage({ ...geography, regionalArchipelago: truncatedRegion }).isValid);
    const signed = macro.decodeRegionalElevation(geography.regionalArchipelago);
    signed[port.waterCell] = 0.01;
    const floodedLink = { ...legacyRegion, elevationRaster: macro.encodeRegionalElevation(signed) };
    assert(!macro.validateMacroGeographyPackage({ ...geography, regionalArchipelago: floodedLink }).isValid,
        'A lifted water cell cannot keep its former landfall and path');
    const noExport = phase2.createPhase2ExportEnvelopeShell().run({
        ...result.phase2, validationReport: { ...result.phase2.validationReport, finalStatus: 'fail' }
    });
    assert(!noExport.exported && noExport.bundle === null);

    const generate = macro.generateMacroGeographyEndToEnd;
    const phase2Engine = phase2.createPhase2Engine;
    let phase2Called = false;
    try {
        macro.generateMacroGeographyEndToEnd = () => ({
            ...result.phase1, macroGeographyPackage: { ...geography, continents: [] }
        });
        phase2.createPhase2Engine = () => { phase2Called = true; throw new Error('must not reach Phase 2'); };
        assert.throws(() => worldgenFoundation.runWorldGenFoundation(phase0Bundle.worldSeedProfile.worldSeed),
            error => error.name === 'FoundationGenerationError' && error.phase === 'phase1');
        assert(!phase2Called);
    } finally {
        macro.generateMacroGeographyEndToEnd = generate;
        phase2.createPhase2Engine = phase2Engine;
    }
    // A rejected candidate is inspectable only in explicit diagnostics. It is not exported.
    try {
        phase2.createPhase2Engine = () => ({
            run: () => ({ stageResults: [], output: {
                validationReport: { finalStatus: 'fail' },
                exportResult: { exported: false, bundle: null },
                pressureFieldPackage: { marker: 'rejected-pressure' },
                environmentalRhythmPackage: { marker: 'rejected-rhythm' },
                rebalancePlan: { triggerResponses: [] }
            } })
        });
        const seed = phase0Bundle.worldSeedProfile.worldSeed;
        assert.throws(() => worldgenFoundation.runWorldGenFoundation(seed, { includeDebugArtifacts: true }),
            error => error.phase === 'phase2'
                && error.evidence.rejectedPhase2Candidate.diagnosticOnly === true
                && error.evidence.rejectedPhase2Candidate.exported === false
                && error.evidence.rejectedPhase2Candidate.environmentalRhythmPackage.marker === 'rejected-rhythm');
        assert.throws(() => worldgenFoundation.runWorldGenFoundation(seed),
            error => error.phase === 'phase2' && !error.evidence.rejectedPhase2Candidate);
    } finally {
        phase2.createPhase2Engine = phase2Engine;
    }
    return { invalidRootRejected: true, invalidCoverageRejected: true, unresolvedReferenceRejected: true, invalidExportBlocked: true, noPhase2AfterFailedPhase1: true, rejectedCandidateDiagnosticOnly: true };
}

let controlsRun = false;
for (const seed of seeds) {
    console.error('Auditing seed', seed);
    const start = performance.now();
    let first;
    try {
        first = worldgenFoundation.runWorldGenFoundation(seed, { includeDebugArtifacts: true, includeCausalDiagnostics: true });
        const firstMs = Math.round(performance.now() - start);
        const rerunStart = performance.now();
        const repeat = worldgenFoundation.runWorldGenFoundation(seed);
        const repeatMs = Math.round(performance.now() - rerunStart);
        const hashes = Object.fromEntries(['phase0', 'phase1', 'phase2'].map(id => [id, hash(first[id])]));
        const determinism = Object.fromEntries(Object.entries(hashes).map(([id, digest]) => [id, digest === hash(repeat[id])]));
        assert(Object.values(determinism).every(Boolean), `Determinism failure for seed ${seed}`);
        const map = inspectGeometry(first);
        const geography = first.phase1.macroGeographyPackage;
        report.seeds.push({
            seed, pass: true, macroSeed: geography.macroSeed, firstMs, repeatMs, hashes, determinism, map,
            terrain: inspectFinalTerrain(first),
            environment: inspectClimateAndPressure(first),
            regionalArchipelago: inspectRegionalArchipelago(first, macro),
            localWater: inspectLocalWater(first, macro),
            phase1Scores: geography.validationReport.scores, phase1Warnings: geography.validationReport.diagnostics.warnings,
            counts: Object.fromEntries(Object.entries(geography).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, value.length])),
            phase2: {
                status: first.phase2.validationReport.finalStatus,
                bindingTargets: first.phase2.pressureFieldPackage.regionalProfiles.length,
                recovery: first.phase2.environmentalRhythmPackage.synthesized.recoveryProfile.summary.mean
            },
            maritime: first.diagnostics.maritime
        });
        if (!controlsRun) {
            check('Immutable handoffs and fail-closed Phase 2', () => testHandoffs(first));
            if (runCausal) {
                check('Macro recovery responds to local season without importing access or island shelter',
                    () => verifySeasonalRecovery(phase2, first));
                const saveStormPair = snapshots ? pair => writeFileSync(
                    join(snapshots, `counterfactual-${seed}.json`), JSON.stringify({ ...pair, revision })
                ) : null;
                check('Fixed-seed upstream interventions', () => runCausalChecks(systems, first, saveStormPair));
            }
            controlsRun = true;
        }
        if (runCausal && seed === 16908799) {
            check('Recovery locality on seed 16908799', () => verifyLocalRecovery(phase2, first));
        }
    } catch (error) {
        const evidence = error.evidence || first?.diagnostics;
        let repeatedFailureMatches;
        if (!first && error.phase) {
            try {
                worldgenFoundation.runWorldGenFoundation(seed);
                repeatedFailureMatches = false;
            } catch (repeatError) {
                repeatedFailureMatches = repeatError.phase === error.phase && repeatError.message === error.message
                    && hash([repeatError.evidence?.phase1Report, repeatError.evidence?.phase2Report])
                    === hash([evidence?.phase1Report, evidence?.phase2Report]);
            }
        }
        report.seeds.push({
            seed, pass: false, elapsedMs: Math.round(performance.now() - start),
            phase: error.phase || 'audit', message: error.message, issues: error.cause?.issues,
            repeatedFailureMatches,
            phase1Report: evidence?.phase1Report, phase2Failures: failedChecks(evidence?.phase2Report),
            maritime: evidence?.maritime
        });
        if (snapshots && evidence?.physicalWorldDebugBundle && !first) {
            writeFileSync(join(snapshots, `seed-${seed}.json`), JSON.stringify({ seed, revision, error: error.message, diagnostics: evidence }));
        }
        console.error(seed, error.message);
    }
    if (snapshots && first) writeFileSync(join(snapshots, `seed-${seed}.json`), JSON.stringify({ seed, revision, ...first }));
}

report.diagnosticPassed = controlsRun && report.checks.every(row => row.pass) && report.seeds.every(row => row.pass);
report.peakProcessRssKiB = process.resourceUsage().maxRSS;
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.diagnosticPassed ? 0 : 1;
