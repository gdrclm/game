#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { inspectFinalTerrain, inspectClimateAndPressure } = require('./worldgen-v1-terrain.cjs');

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const round = value => Number(value.toFixed(6));

function sampleElevation(values, width, height, x, y) {
    if (x < 0 || x > width - 1 || y < 0 || y > height - 1) return null;
    const left = Math.floor(x);
    const top = Math.floor(y);
    const right = Math.min(left + 1, width - 1);
    const bottom = Math.min(top + 1, height - 1);
    const dx = x - left;
    const dy = y - top;
    return (values[top * width + left] * (1 - dx) + values[top * width + right] * dx) * (1 - dy)
        + (values[bottom * width + left] * (1 - dx) + values[bottom * width + right] * dx) * dy;
}

function measureShelter(cells, elevation, wind, wetness, seasonality, direction) {
    const { values, width, height } = elevation;
    let classifiedCells = 0;
    let shelteredCells = 0;
    let shelteredInput = 0;
    let shelteredLowInput = 0;
    let ordinaryInput = 0;
    let lowInput = 0;
    for (const cell of cells) {
        const inflow = wetness[cell];
        const dryInflow = inflow * (1 - seasonality[cell]);
        ordinaryInput += inflow;
        lowInput += dryInflow;
        const vectorX = wind.xValues[cell];
        const vectorY = wind.yValues[cell];
        const magnitude = Math.hypot(vectorX, vectorY);
        if (!magnitude) continue;
        // Use one macro-cell length, the same physical horizon as the regional
        // measurement. A sample outside the covered raster is unknown.
        const upstream = sampleElevation(values, width, height,
            cell % width - direction * vectorX / magnitude,
            Math.floor(cell / width) - direction * vectorY / magnitude);
        if (upstream === null) continue;
        classifiedCells += 1;
        if (upstream > values[cell]) {
            shelteredCells += 1;
            shelteredInput += inflow;
            shelteredLowInput += dryInflow;
        }
    }
    return { classifiedCells, shelteredCells, ordinaryInput: round(ordinaryInput), lowInput: round(lowInput),
        shelteredInput: round(shelteredInput), shelteredLowInput: round(shelteredLowInput) };
}

function inspectSnapshot(path) {
    const snapshot = JSON.parse(readFileSync(path, 'utf8'));
    const diagnostics = snapshot.diagnostics;
    const rejected = diagnostics.rejectedPhase2Candidate;
    const { physicalWorldDebugBundle: debug } = diagnostics;
    const geometry = id => debug.intermediateOutputs.find(row => row.artifactId === `foundation_geometry_${id}`)?.payload;
    const scalar = id => debug.fieldSnapshots.find(row => row.payload.fieldId === id)?.payload;
    const geography = (snapshot.phase1 || rejected?.sourcePhase1)?.macroGeographyPackage;
    const rhythm = (snapshot.phase2 || rejected)?.environmentalRhythmPackage;
    const recovery = rhythm?.domains.recovery.reliefPersistence;
    const pressure = (snapshot.phase2 || rejected)?.pressureFieldPackage;
    const elevation = scalar('finalRelativeElevationField');
    const wind = scalar('prevailingWindField');
    const wetness = scalar('wetnessField')?.values;
    const seasonality = scalar('seasonalityField')?.values;
    const slices = geometry('reliefRegionExtraction')?.reliefRegionBodies || [];
    const water = geography?.environmentalCoverage?.localWater?.reliefRegions || {};
    const rawSupport = new Map(recovery?.perReliefScores.map(row => [row.recordId, row]));
    const gate = (snapshot.phase2?.validationReport || diagnostics.phase2Report);
    const checks = Object.values(gate || {}).flatMap(section => section?.checks || []);
    const balance = checks.find(check => check.checkId === 'phase2.design.tension_vs_relief');
    const distinction = checks.find(check => check.checkId === 'phase2.distribution.pressure_rhythm_differentiation');
    const failedGates = checks.filter(check => check.status !== 'pass').map(({ checkId, status, meta }) => ({ checkId, status, meta }));
    const region = geometry('regionalArchipelagoSurface');
    const landCells = elevation?.values.reduce((sum, height) => sum + (height > 0), 0);
    const continentGeometry = geometry('continentBodies');
    const seaLevel = geometry('seaLevelModel');
    const shorelineAttempts = seaLevel?.shorelineAttempts || [];
    const terrain = elevation && inspectFinalTerrain(snapshot);
    const climate = rhythm && inspectClimateAndPressure({ ...snapshot, phase2: snapshot.phase2 || rejected });
    const result = {
        revision: snapshot.revision, seed: snapshot.seed, exported: Boolean(snapshot.phase2),
        reportHash: hash([diagnostics.phase1Report, gate]),
        balance: balance?.meta, differentiation: distinction?.meta, failedGates,
        landCells, landRatio: elevation && landCells / elevation.values.length,
        terrain, climate, continentBodies: continentGeometry?.continentBodies.map(row => row.cellCount),
        minimumContinentCells: continentGeometry?.minimumContinentCellCount,
        landmassCount: continentGeometry?.landmassCount,
        shorelineCandidates: shorelineAttempts.length,
        shorelineCandidatesWithTwoMajorBodies: shorelineAttempts.filter(row => row.majorSizes.length >= 2).length,
        largestObservedSecondMajorBody: Math.max(0, ...shorelineAttempts.map(row => row.majorSizes[1] ?? 0)),
        attemptedSeaLevelPercentiles: shorelineAttempts.map(row => round(row.percentile)),
        macroArchipelagoPresent: Boolean(seaLevel?.hotspotChain),
        macroIslands: geometry('coastalAccessTopology')?.islands.length,
        coastalPassageCandidates: geometry('coastalAccessTopology')?.islandPassages.length,
        regionalCapacity: region?.summary.areaSensitivity,
        origins: region?.summary.originCounts,
        recoveryMeans: rhythm && Object.fromEntries(Object.entries(rhythm.domains.recovery).map(([key, field]) => [key, field.summary.mean])),
        pressureAxes: pressure && Object.fromEntries(Object.entries(pressure.synthesized).map(([key, field]) => [key, field.value])),
        rhythmAxes: rhythm && Object.fromEntries(Object.entries(rhythm.synthesized).map(([key, field]) => [key, field.summary.mean])),
        relief: []
    };
    if (!elevation || !wind || !wetness || !seasonality) return result;
    for (const slice of slices) {
        const id = slice.reliefRegionId;
        const sample = water[id];
        const score = rawSupport.get(id);
        const cells = slice.cellIndices.filter(cell => elevation.values[cell] > 0);
        if (!cells.length || !sample || !score) continue;
        const observed = measureShelter(cells, elevation, wind, wetness, seasonality, 1);
        const reversed = measureShelter(cells, elevation, wind, wetness, seasonality, -1);
        assert.equal(cells.length, sample.landCellCount, id);
        assert(Math.abs(observed.lowInput - sample.lowInputPotential) <= 1e-6, id);
        assert(Math.abs(observed.ordinaryInput - sample.inputPotential) <= 1e-6, id);
        assert.equal(reversed.ordinaryInput, observed.ordinaryInput);
        assert.equal(reversed.lowInput, observed.lowInput);
        const support = score.supportContextSnapshot;
        result.relief.push({
            id, type: slice.reliefType, landCells: cells.length,
            reliableRunoffSupport: support.reliableRunoffSupport,
            repeatedRunoffSupport: support.localWater?.repeatedRunoffSupport,
            supportWindow: support.supportWindow,
            persistentSupportFactor: round(0.25 * support.supportWindow + 0.75 * support.reliableRunoffSupport),
            reliefPersistence: score.value,
            basinIds: support.riverBasinIds,
            lowInputDensity: round(observed.lowInput / cells.length),
            shelteredLowInputDensity: observed.shelteredCells ? round(observed.shelteredLowInput / observed.shelteredCells) : null,
            sourceReachableCells: sample.reachableCellCount,
            allocatedLowSupplyPerArea: sample.allocatedLowSupplyPerArea,
            meanDistanceToSource: sample.meanDistance, meanAscentToSource: sample.meanAscent,
            potentialRetention: sample.storageSpace,
            ...observed, reversedWindShelteredCells: reversed.shelteredCells,
            reversedWindShelteredLowInput: reversed.shelteredLowInput
        });
    }
    return result;
}

const paths = process.argv.slice(2);
assert(paths.length, 'Usage: node tests/measure-worldgen-v1-macro-refuge.cjs SNAPSHOT.json ...');
const measurements = paths.map(inspectSnapshot);
console.log(JSON.stringify(measurements, null, 2));
