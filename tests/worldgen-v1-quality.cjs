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
function inspectPassageEndpoints(topology, seaGraph) {
    const byId=new Map((seaGraph.edges||[]).map(edge=>[edge.edgeId,edge]));
    return (topology.islandPassages||[]).map(passage=>{
        const path=byId.get(passage.seaEdgeId)?.waterPathCellIndices;
        const blocked=new Set(passage.restrictedCellIndices||[]);
        const endpointInsideClosure=path?.length
            ? blocked.has(path[0])||blocked.has(path[path.length-1]) : null;
        return {
            passageId:passage.passageId,
            endpointInsideClosure,
            bypassTravelCells:passage.bypassTravelCells,
            routeCount:passage.routeIds?.length||0,
            status: endpointInsideClosure===null?'missing_path':
                endpointInsideClosure?'endpoint_confounded':
                passage.bypassTravelCells===null?'disconnected_after_closure':'measured_detour'
        };
    });
}
function inspectLive(systems, seed) {
    const result=systems.worldgenFoundation.runWorldGenFoundation(seed,{includeDebugArtifacts:true});
    const debug=result.diagnostics.physicalWorldDebugBundle;
    const topology=debug.intermediateOutputs.find(entry=>entry.artifactId==='foundation_geometry_coastalAccessTopology')?.payload;
    const sea=debug.graphSnapshots.find(entry=>entry.sourceLayerId==='seaConnectivityGraph')?.payload;
    if(!topology||!sea)throw Error('Missing topology or sea graph for '+seed);
    return {seed,passages:inspectPassageEndpoints(topology,sea)};
}
module.exports={summarizeQuality,inspectPassageEndpoints,inspectLive};
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
