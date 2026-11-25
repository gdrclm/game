'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');

const [beforeDir, afterDir] = process.argv.slice(2);
assert(beforeDir && afterDir, 'Usage: node tests/compare-worldgen-v1-recovery.cjs <baseline snapshots> <candidate snapshots>');

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const same = (a, b) => digest(a) === digest(b);
const byId = (rows, idKey) => new Map(rows.map(row => [row[idKey], row]));
const geometry = (snapshot, id) => snapshot.diagnostics.physicalWorldDebugBundle.intermediateOutputs
    .find(row => row.artifactId === 'foundation_geometry_' + id).payload;
const mask = snapshot => snapshot.diagnostics.physicalWorldDebugBundle.fieldSnapshots
    .find(row => row.payload.fieldId === 'coastJaggednessControlledLandWaterMaskField').payload;

function validateMeasuredCoverage(snapshot, root) {
    const land = mask(snapshot);
    const { environmentalCoverage: coverage } = root;
    assert(coverage, 'Missing environmental coverage for ' + snapshot.seed);
    function checkRows(physicalRows, collection, idKey, idOf) {
        const records = root[collection];
        const raw = byId(records, idKey);
        const indexed = new Map();
        for (const row of physicalRows) {
            const id = idOf(row);
            if (!raw.has(id)) continue;
            const cells = row.cellIndices.filter(cell => land.values[cell] >= land.threshold);
            assert.equal(coverage[collection][id].landCellCount, cells.length, id);
            indexed.set(id, cells);
        }
        assert.equal(indexed.size, records.length, 'Missing carrier cells for ' + snapshot.seed);
        return indexed;
    }
    const relief = checkRows(geometry(snapshot, 'reliefRegionExtraction').reliefRegionBodies,
        'reliefRegions', 'reliefRegionId', row => row.reliefRegionId);
    const climate = checkRows(geometry(snapshot, 'climateZoneClassification').zoneSummaries,
        'climateBands', 'climateBandId', row => row.climateBandId);
    const basins = checkRows(geometry(snapshot, 'watershedSegmentation').watersheds,
        'riverBasins', 'riverBasinId', row => row.recordDraft.riverBasinId);
    const count = rows => Object.fromEntries(rows.filter(Boolean).reduce((amounts, id) =>
        amounts.set(id, (amounts.get(id) || 0) + 1), new Map()));
    const climateByCell = new Map([...climate].flatMap(([id, cells]) => cells.map(cell => [cell, id])));
    const basinByCell = new Map([...basins].flatMap(([id, cells]) => cells.map(cell => [cell, id])));
    for (const [id, cells] of climate) {
        assert.deepEqual(coverage.climateBands[id].riverBasinCells || {}, count(cells.map(cell => basinByCell.get(cell))), id);
    }
    for (const [id, cells] of relief) {
        assert.deepEqual(coverage.reliefRegions[id].riverBasinCells || {}, count(cells.map(cell => basinByCell.get(cell))), id);
        assert.deepEqual(coverage.reliefRegions[id].climateBandCells || {}, count(cells.map(cell => climateByCell.get(cell))), id);
    }
    return [...relief.values()].reduce((total, cells) => total + cells.length, 0);
}

function unpack(snapshot) {
    const rejected = snapshot.diagnostics.rejectedPhase2Candidate;
    const first = snapshot.phase1 || rejected?.sourcePhase1;
    const second = snapshot.phase2 || rejected;
    return { first, second, phase0: snapshot.phase0?.outputs.phase0Bundle || rejected?.sourcePhase0 };
}

function physicalSignature(snapshot) {
    const debug = snapshot.diagnostics.physicalWorldDebugBundle;
    if (!debug) return null;
    return digest([
        debug.fieldSnapshots.map(row => [row.artifactId, row.payload]),
        debug.intermediateOutputs.filter(row => row.artifactId.startsWith('foundation_geometry_')),
        debug.graphSnapshots
    ]);
}

function metrics(snapshot, phase1, phase2) {
    const pressure = phase2.pressureFieldPackage;
    const rhythm = phase2.environmentalRhythmPackage;
    const domains = rhythm.domains.recovery;
    const recovery = rhythm.synthesized.recoveryProfile.summary;
    const report = snapshot.phase2?.validationReport || snapshot.diagnostics.phase2Report;
    const allChecks = Object.values(report).flatMap(section => section?.checks || []);
    const balance = allChecks.find(check => check.checkId === 'phase2.design.tension_vs_relief');
    const reliefBodies = byId(geometry(snapshot, 'reliefRegionExtraction').reliefRegionBodies, 'reliefRegionId');
    const land = mask(snapshot);
    const cells = id => reliefBodies.get(id).cellIndices.filter(cell => land.values[cell] >= land.threshold).length;
    const recoveryTempo = byId(domains.recoveryTempo.perReliefScores, 'recordId');
    const valueById = (field, fieldKey) => byId(field[fieldKey], 'recordId');
    const persistence = valueById(domains.reliefPersistence, 'perReliefScores');
    const forgiveness = valueById(domains.environmentalForgiveness, 'perReliefScores');
    const ecology = valueById(pressure.domains.ecology.ecologicalFragility, 'perReliefScores');
    const hydrology = pressure.domains.hydrology;
    const basinScores = new Map(hydrology.waterStress.perBasinScores.map(row => [row.recordId, { waterStress: row.value }]));
    for (const field of ['waterReliabilityInverse', 'droughtPressure', 'floodInstability']) {
        for (const row of hydrology[field].perBasinScores) basinScores.get(row.recordId)[field] = row.value;
    }

    return {
        exported: Boolean(snapshot.phase2),
        checks: allChecks.filter(check => check.status !== 'pass')
            .map(({ checkId, status, details }) => ({ checkId, status, details })),
        validationStage: snapshot.diagnostics.stageResults.find(row => row.stageId === 'validation'),
        rebalanceAttempts: (phase2.rebalanceAttempts || []).map(attempt => attempt.rebalanceMetadata),
        recovery,
        balance: balance.meta,
        recoveryDomain: Object.fromEntries(Object.entries(domains).map(([id, field]) => [id, field.summary])),
        pressure: Object.fromEntries(Object.entries(pressure.synthesized).map(([key, field]) => [key, field.value])),
        foodStressMean: pressure.domains.food.foodStress.summary.mean,
        foodBandsWithWaterStress: pressure.domains.food.foodStress.perBandScores
            .filter(row => row.upstreamBurdenSnapshot.waterStress > 0).length,
        basins: phase1.macroGeographyPackage.riverBasins.map(row => ({
            id: row.riverBasinId, basinType: row.basinType, scale: row.catchmentScale, continuity: row.basinContinuity,
            ...basinScores.get(row.riverBasinId)
        })),
        relief: phase1.macroGeographyPackage.reliefRegions.map(region => {
            const id = region.reliefRegionId;
            const tempo = recoveryTempo.get(id);
            return {
                id, type: region.reliefType, landCells: cells(id), ruggedness: region.ruggednessBias, tempo: tempo.value,
                persistence: persistence.get(id).value, forgiveness: forgiveness.get(id).value, ecologicalFragility: ecology.get(id).value,
                waterStress: ecology.get(id).upstreamBurdenSnapshot.waterStress, sources: tempo.supportContextSnapshot
            };
        })
    };
}

const rows = [];
for (const file of readdirSync(afterDir).filter(name => /^seed-\d+\.json$/.test(name))
    .sort((a, b) => Number(a.slice(5, -5)) - Number(b.slice(5, -5)))) {
    const before = JSON.parse(readFileSync(join(beforeDir, file)));
    const after = JSON.parse(readFileSync(join(afterDir, file)));
    assert.equal(before.seed, after.seed);
    const old = unpack(before);
    const next = unpack(after);
    const beforeGeometry = physicalSignature(before);
    const physicalGeometryUnchanged = Boolean(beforeGeometry && beforeGeometry === physicalSignature(after));
    if (!old.first || !next.first || !old.second || !next.second) {
        rows.push({ seed: after.seed, beforeRevision: before.revision, afterRevision: after.revision,
            beforeFailure: before.error, afterFailure: after.error, physicalGeometryUnchanged });
        continue;
    }
    const { environmentalCoverage, ...sameRoot } = next.first.macroGeographyPackage;
    const phase0Unchanged = same(old.phase0, next.phase0);
    const phase1RecordsUnchanged = same(old.first.macroGeographyPackage, sameRoot);
    const handoffUnchanged = same(old.first.macroGeographyHandoffPackage, next.first.macroGeographyHandoffPackage);
    assert(phase0Unchanged && phase1RecordsUnchanged && handoffUnchanged && physicalGeometryUnchanged,
        'Geometry or original records changed at seed ' + after.seed);
    const coveredLandCells = validateMeasuredCoverage(after, next.first.macroGeographyPackage);
    rows.push({
        seed: after.seed, beforeRevision: before.revision, afterRevision: after.revision,
        phase0Unchanged, phase1RecordsUnchanged, handoffUnchanged, physicalGeometryUnchanged, coveredLandCells,
        before: metrics(before, old.first, old.second), after: metrics(after, next.first, next.second)
    });
}
console.log(JSON.stringify({ schema: 'worldgen-f8r-comparison-v1', worlds: rows }, null, 2));
