'use strict';
// Advisory quality diagnostics: never replace the canonical validation gate.
function frequencies(values) {
    return Object.fromEntries([...new Set(values)].sort((a,b)=>a-b)
        .map(value => [value, values.filter(other=>other===value).length]));
}
function range(values) {
    return values.length ? [Math.min(...values),Math.max(...values)] : null;
}
function summarizeQuality(report) {
    if (!Array.isArray(report.seeds)) throw Error('Missing seed evidence');
    const rows=report.seeds.filter(row=>row.pass && row.map && row.counts && row.phase1Scores);
    const flagged=rows.filter(row=>(row.phase1Warnings||[]).some(w=>w.includes('center-periphery contrast')));
    return {
        revision:report.revision, attempted:report.seeds.length, usable:rows.length,
        failed:report.seeds.filter(row=>!row.pass).map(row=>row.seed),
        continentCounts:frequencies(rows.map(row=>row.counts.continents)),
        archipelagoCounts:frequencies(rows.map(row=>row.counts.archipelagoRegions)),
        chainIslandCounts:frequencies(rows.map(row=>row.map.islandAreas.length)),
        routeCounts:frequencies(rows.map(row=>row.counts.macroRoutes)),
        shorelineAttempts:frequencies(rows.map(row=>row.map.shorelineAttempts)),
        centerPeripheryRange:range(rows.map(row=>row.phase1Scores.centerPeripheryContrast)),
        centerPeripheryWarningSeeds:flagged.map(row=>row.seed),
        historyPotentialRange:range(rows.map(row=>row.phase1Scores.historyPotential)),
        recoveryRange:range(rows.map(row=>row.phase2.recovery)),
        note:'Counts describe sampling, not independent evidence of morphology or historical diversity.'
    };
}
function waterNeighbors(mask, cell) {
    const { width, values, threshold } = mask;
    const neighbors = [cell - width, cell + width];
    if (cell % width > 0) neighbors.push(cell - 1);
    if (cell % width < width - 1) neighbors.push(cell + 1);
    return neighbors.filter(index => index >= 0 && index < values.length && values[index] < threshold);
}

function waterDistance(mask, start, target, blocked) {
    const distances = new Int32Array(mask.values.length).fill(-1);
    const queue = [start];
    distances[start] = 0;
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const cell = queue[cursor];
        if (cell === target) return distances[cell];
        for (const neighbor of waterNeighbors(mask, cell)) {
            if (blocked.has(neighbor) || distances[neighbor] >= 0) continue;
            distances[neighbor] = distances[cell] + 1;
            queue.push(neighbor);
        }
    }
    return null;
}

function inspectPassageEndpoints(topology, seaGraph, mask) {
    const byId=new Map((seaGraph.edges||[]).map(edge=>[edge.edgeId,edge]));
    return [...(topology.islandPassages || []), ...(topology.coastalInletPassages || [])].map(passage=>{
        const path=byId.get(passage.seaEdgeId)?.waterPathCellIndices;
        const blocked=new Set(passage.restrictedCellIndices||[]);
        const terminals = path?.length > 1 ? [path[0], path.at(-1)] : [];
        const endpointInsideClosure = terminals.length ? terminals.some(cell => blocked.has(cell)) : null;
        const lostAccess = mask && terminals.some(cell => !waterNeighbors(mask, cell).some(neighbor => !blocked.has(neighbor)));
        const bypass = mask && terminals.length && !endpointInsideClosure && !lostAccess
            ? waterDistance(mask, ...terminals, blocked) : passage.bypassTravelCells;
        return {
            passageId:passage.passageId,
            endpointInsideClosure,
            bypassTravelCells: bypass,
            travelCells: passage.travelCells,
            recordedBypassMatches: bypass === passage.bypassTravelCells,
            routeCount:passage.routeIds?.length||0,
            status: endpointInsideClosure===null?'missing_path':
                endpointInsideClosure?'endpoint_confounded':
                lostAccess ? 'terminal_access_confounded' :
                bypass === null ? 'disconnected_after_closure' :
                bypass > passage.travelCells ? 'measured_detour' : 'no_detour'
        };
    });
}
function inspectLive(systems, seed) {
    let debug;
    let failure;
    try {
        debug = systems.worldgenFoundation.runWorldGenFoundation(seed, { includeDebugArtifacts: true }).diagnostics.physicalWorldDebugBundle;
    } catch (error) {
        debug = error.evidence?.physicalWorldDebugBundle;
        if (!debug) throw error;
        failure = error.message;
    }
    const topology=debug.intermediateOutputs.find(entry=>entry.artifactId==='foundation_geometry_coastalAccessTopology')?.payload;
    const sea=debug.graphSnapshots.find(entry=>entry.sourceLayerId==='seaConnectivityGraph')?.payload;
    const mask = debug.fieldSnapshots.find(entry => entry.payload.fieldId === 'coastJaggednessControlledLandWaterMaskField')?.payload;
    if(!topology||!sea)throw Error('Missing topology or sea graph for '+seed);
    return { seed, ...(failure && { error: failure }), passages: inspectPassageEndpoints(topology, sea, mask) };
}

function verifyPassageFixture(worldgenMacro) {
    const assert = require('node:assert/strict');
    // A one-cell gate between two headlands. Removing either wharf instead is a confounded experiment.
    const values = ['..#..', '..#..', '.....', '..#..', '..#..'].join('').split('').map(cell => Number(cell === '#'));
    const mask = { width: 5, height: 5, values, threshold: 1 };
    const edge = { edgeId: 'lane', waterPathCellIndices: [10, 11, 12, 13, 14], waterTravelCells: 4 };
    const seaGraph = { edges: [edge] };
    const inspect = (cut, bypassTravelCells) => inspectPassageEndpoints({ islandPassages: [{
        seaEdgeId: 'lane', restrictedCellIndices: cut, travelCells: 4, bypassTravelCells
    }] }, seaGraph, mask)[0].status;
    assert.equal(inspect([10], null), 'endpoint_confounded');
    assert.equal(inspect([5, 11, 15], null), 'terminal_access_confounded');
    assert.equal(inspect([12], null), 'disconnected_after_closure');
    assert.equal(inspect([1], 4), 'no_detour');
    assert.equal(worldgenMacro.measureChangedLanes(mask, seaGraph.edges, new Set([10])).get('lane').endpointsAccessible, false);
    assert.equal(worldgenMacro.measureChangedLanes(mask, seaGraph.edges, new Set([12])).get('lane').alternative, null);
    const withOuterPassage = { ...mask, values: mask.values.slice() };
    withOuterPassage.values[2] = 0;
    assert.equal(waterDistance(withOuterPassage, 10, 14, new Set([12])), 8);
    const detour = worldgenMacro.measureChangedLanes(withOuterPassage, seaGraph.edges, new Set([12]), { includePaths: true }).get('lane');
    assert(detour.endpointsAccessible);
    assert.equal(detour.alternative.waterTravelCells, 8);
    assert(!detour.alternative.waterPathCellIndices.includes(12));
    return ['terminal cell rejected', 'terminal access rejected', 'disconnection', 'no effect', 'alternate water path'];
}

function verifyHotspotFixture(worldgenMacro) {
    const assert = require('node:assert/strict');
    const bounds = { width: 128, height: 96 };
    const { width, height } = bounds;
    const peaks = [30, 42, 54, 66, 78].map((x, driftStep) => ({
        x, y: 40, cellIndex: 40 * width + x, radius: 5, driftStep, waterDepth: 0.3
    }));
    const track = { peaks, offset: 0, hotspot: { trailVector: { x: 1, y: 0 } } };
    const flat = Array(width * height).fill(0.2);
    const openWater = new Uint8Array(flat.length).fill(1);
    const offshoreDistance = new Uint8Array(flat.length).fill(12);
    const cutoff = 0.5;
    assert.deepEqual(worldgenMacro.bendHotspotTrack(track, bounds, openWater, offshoreDistance, flat, cutoff), peaks);
    const shelf = flat.map((value, index) => {
        const x = index % width;
        const y = Math.floor(index / width);
        const crest = 40 + Math.round(2 * Math.sin((x - 30) / 15));
        return value + Math.max(0, 3 - Math.abs(y - crest)) * 0.021;
    });
    const bent = worldgenMacro.bendHotspotTrack(track, bounds, openWater, offshoreDistance, shelf, cutoff);
    assert(bent.some(peak => peak.crossTrackShift !== 0));
    assert(new Set(bent.map(peak => peak.crossTrackShift)).size > 1);
    assert(bent.every((peak, index) => peak.driftStep === peaks[index].driftStep && peak.unbentCellIndex === peaks[index].cellIndex));
    return { flatPreservesDrift: true, tiltedShelfShiftsPeaks: bent.map(peak => peak.crossTrackShift) };
}

function verifyCoastalInletFixture(macro) {
    const assert = require('node:assert/strict');
    const width = 64;
    const height = 48;
    const cell = (x, y) => y * width + x;
    const survey = open => {
        const values = new Array(width * height).fill(0);
        const land = [];
        for (let y = 15; y <= 22; y += 1) {
            for (let x = 20; x <= 24; x += 1) {
                if (x !== 20 && x !== 24 && y !== 15) continue;
                if (open && (x === 20 || (x === 21 && y === 15))) continue;
                values[cell(x, y)] = 1;
                land.push(cell(x, y));
            }
        }
        const mask = { width, height, values, threshold: 0.5 };
        const ports = [{ nodeId: 'inside', waterCellIndex: cell(22, 16), continentId: 'cont', seaRegionId: 'sea' },
            { nodeId: 'outside', waterCellIndex: cell(22, 26), seaRegionId: 'sea' }];
        const edges = macro.buildMarineAccessEdges(ports, mask, () => 'marine');
        const [edge] = edges;
        const routes = { candidateRoutes: [{ routeId: 'route', edgePathIds: [edge.edgeId] }] };
        const bodies = [{ recordDraft: { continentId: 'cont' }, cellIndices: land }];
        return macro.findCoastalInletPassages({ ports }, bodies, { edges }, routes, mask);
    };
    const [inlet] = survey(false);
    assert(inlet);
    assert.equal(inlet.bypassTravelCells, null);
    assert.deepEqual(Array.from(inlet.routeIds), ['route']);
    assert.equal(survey(true).length, 0, 'Redundant open coast cannot be classified as a separating inlet');
    return { inletSeparatesReachableTerminals: true, redundantOpenCoastHasNoInlet: true };
}

function verifyCoastalAccessFixture(macro) {
    const assert = require('node:assert/strict');
    const values = new Array(20).fill(1);
    for (const cell of [0, 3, 4]) values[cell] = 0;
    const coast = macro.buildCoastalAccessTopology({
        mask: { fieldId: 'coast', width: 5, height: 4, threshold: 0.5, values },
        continentBodies: [{ recordDraft: { continentId: 'cont_01' },
            cellIndices: values.map((value, index) => value ? index : -1).filter(index => index >= 0) }],
        seaClusters: [[0], [3, 4]].map((cellIndices, index) => ({
            touchesWorldEdge: true, seaRegionClusterId: `water_${index}`, cellIndices,
            recordDraft: { seaRegionId: `sea_${index}` }
        })),
        coastalOpportunity: { values: values.map((_, cell) => cell === 0 ? 1 : 0) },
        clusterProfiles: [],
        reliefRegionBodies: []
    });
    assert(coast.ports.length > 0);
    assert(coast.ports.every(port => port.waterCellIndex === 3 || port.waterCellIndex === 4));
    return { isolatedBorderWaterRejected: true };
}

module.exports={summarizeQuality,inspectPassageEndpoints,inspectLive,verifyPassageFixture,verifyHotspotFixture,verifyCoastalAccessFixture,
    verifyCoastalInletFixture};
if(require.main===module){
    const fs=require('node:fs');
    const args=process.argv.slice(2);
    const file=args.shift()||'docs/context/review/foundation-report.json';
    const summary=summarizeQuality(JSON.parse(fs.readFileSync(file,'utf8')));
    if(args.length){
        if(args.some(x=>!/^\d+$/.test(x)||Number(x)>0xffffffff))throw Error('Expected uint32 seed');
        const systems=require('../js/worldgen/foundation/node.cjs').loadWorldGen();
        summary.live=args.map(x=>{try{return inspectLive(systems,Number(x));}catch(error){return {seed:Number(x),error:String(error)};}});
    }
    console.log(JSON.stringify(summary,null,2));
}
