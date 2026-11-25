#!/usr/bin/env node
'use strict';
// Read-only baseline: official entry points plus diagnostic fallback for unfinished Phase 0.
const fs=require('node:fs'), vm=require('node:vm'), crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
const p2=['index.js','contracts/index.js','deterministic-rng.js','normalization.js','intake/index.js','binding/index.js','pressure/index.js','recovery/index.js','rhythm/index.js','summaries/index.js','validation/index.js','rebalance/index.js','debug/index.js','export/index.js','orchestration/index.js','tests/index.js'].map(x=>'js/worldgen/phase2/'+x);
const p01=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(x=>x[1]).filter(x=>/^js\/worldgen\/(phase0|macro)\//.test(x));
const ctx=vm.createContext({console,TextEncoder,TextDecoder});
vm.runInContext('globalThis.window=globalThis; window.Game={systems:{}};',ctx);
const report={diagnosticOnly:true,revision:process.env.GITHUB_SHA||null,bootErrors:[],checks:[],seeds:[]};
for(const file of new Set([...p01,...p2]))try{vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});}catch(e){report.bootErrors.push({file,error:String(e)});}
const {worldgenPhase0:a,worldgenMacro:b,worldgenPhase2:c}=ctx.Game.systems;
const realm=x=>vm.runInContext('JSON.parse('+JSON.stringify(JSON.stringify(x))+')',ctx);
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const assert=(v,m)=>{if(!v)throw Error(m);};
function check(name,fn){try{report.checks.push({name,pass:true,details:fn()});}catch(e){report.checks.push({name,pass:false,error:String(e)});}}
function manual0(seed){
 const n=a.normalizePhase0Input(seed);
 const p=a.buildWorldSeedProfile(n.baseRandomSeed,realm({worldPresetMode:n.worldPresetMode,hardConstraintsProfile:n.hardConstraintsProfile}));
 const t=a.deriveWorldTendencies(p), s=a.deriveWorldSubSeedMap(n.baseRandomSeed,p);
 const v=a.buildPhase0ValidationReport(realm({worldSeedProfile:p,derivedWorldTendencies:t,worldSubSeedMap:s}));
 return a.assemblePhase0Bundle(realm({worldSeedProfile:p,derivedWorldTendencies:t,worldSubSeedMap:s,validationReport:v}));
}
check('Phase 0 official entry',()=>{const p=a.createPhase0World(42);a.assertPhase0BundleShape(p);return p.validationReport;});
check('Phase 0 export validator',()=>{const p=a.createPhase0World(42);const v=a.validatePhase0Export(p);assert(v.isValid===true,'Valid Phase 0 rejected');assert(hash(v)===hash(p.validationReport),'Validation drift');const bad=realm(p);bad.worldSubSeedMap.pressureSeed=(bad.worldSubSeedMap.pressureSeed+1)>>>0;assert(a.validatePhase0Export(bad).isValid===false,'Tampered seed accepted');return v;});
check('Phase 0 orchestration adapter',()=>{const v=a.createPhase0OrchestrationAdapter().run(42);assert(v.immutable===true&&v.outputs.phase0Bundle.validationReport.isValid,'Invalid freeze wrapper');return Object.keys(v);});
check('Phase 1 constraints intake',()=>{const p=a.createPhase0World(42);const v=b.intakeMasterConstraints(a.buildPhase1SafeSummaryBundle(p));assert(v.macroSeed===p.worldSubSeedMap.macroGeographySeed,'Macro seed drift');assert(v.coastJaggedness===0.5,'Unexpected default coast constraint');assert(b.ingestMacroSeedProfile(realm({...v,coastJaggedness:0.8})).coastJaggedness===0.8,'Coast constraint lost on intake');return v;});
check('Phase 2 built-in harness',()=>{const h=c.runPhase2TestHarness();const result={smoke:h.smokeSuite.summary,regression:h.regressionSuite.summary};assert(h.overallStatus==='pass',JSON.stringify(result));return result;});
function run(seed){
 let stage='phase0';const row={seed,officialPhase0:false};
 try{
  let p;try{p=a.createPhase0World(seed);a.assertPhase0BundleShape(p);row.officialPhase0=true;}catch(e){row.officialPhase0Error=String(e);p=manual0(seed);}
  row.phase0={hash:hash(p),validation:p.validationReport};
  stage='phase1';
  const profile=b.intakeMasterConstraints(a.buildPhase1SafeSummaryBundle(p));
  const m=b.generateMacroGeographyEndToEnd(realm({macroSeed:p.worldSubSeedMap.macroGeographySeed,macroSeedProfile:profile,phase1Constraints:b.normalizePhase1SeedConstraints(profile),includeDebugArtifacts:true}));
  const g=m.macroGeographyPackage;
  row.phase1={hash:hash(g),validation:g.validationReport,counts:Object.fromEntries(['continents','seaRegions','mountainSystems','riverBasins','archipelagoRegions','macroRoutes','chokepoints'].map(k=>[k,g[k]?.length??null]))};
  stage='phase2';
  const r=c.createPhase2Engine().run(realm({macroGeographyPackage:g,macroGeographyHandoffPackage:m.macroGeographyHandoffPackage,pressureSeed:p.worldSubSeedMap.pressureSeed,rhythmSeed:p.worldSubSeedMap.rhythmSeed}));
  const o=r.output;row.phase2={hash:hash([o.pressureFieldPackage,o.environmentalRhythmPackage]),validationStatus:o.validationReport.finalStatus,exported:o.exportResult.exported,validation:o.validationReport,stages:r.stageResults};
 }catch(e){row.error={stage,message:String(e),stack:e.stack?.split('\n').slice(0,5).join('\n')};}
 return row;
}
const seeds=process.argv.length>2?process.argv.slice(2).map(Number):[42,137,2026];
assert(seeds.every(s=>Number.isSafeInteger(s)&&s>=0&&s<=0xffffffff),'Expected uint32 seeds');
for(const seed of seeds){
 console.error('Auditing seed',seed);
 const first=run(seed),repeat=run(seed);
 report.seeds.push({first,repeat:{error:repeat.error,officialPhase0:repeat.officialPhase0,phase2Exported:repeat.phase2?.exported},determinism:Object.fromEntries(['phase0','phase1','phase2'].map(k=>[k,first[k]&&repeat[k]?first[k].hash===repeat[k].hash:null]))});
}
report.diagnosticPassed=report.bootErrors.length===0&&report.checks.every(x=>x.pass)&&report.seeds.every(x=>!x.first.error&&!x.repeat.error&&x.first.officialPhase0&&x.repeat.officialPhase0&&x.first.phase0.validation?.isValid===true&&x.first.phase1?.validation?.isValid===true&&x.first.phase2?.exported===true&&x.repeat.phase2Exported===true&&Object.values(x.determinism).every(v=>v===true));
console.error('FOUNDATION SUMMARY',JSON.stringify({bootErrors:report.bootErrors,checks:report.checks.map(({name,pass,error})=>({name,pass,error})),seeds:report.seeds.map(x=>({seed:x.first.seed,officialPhase0:x.first.officialPhase0,phase0Error:x.first.officialPhase0Error,phase0Valid:x.first.phase0?.validation?.isValid,phase1Counts:x.first.phase1?.counts,phase1Valid:x.first.phase1?.validation?.isValid,phase1Diagnostics:x.first.phase1?.validation?.diagnostics,phase2Status:x.first.phase2?.validationStatus,phase2Exported:x.first.phase2?.exported,phase2FailedChecks:x.first.phase2?.validation?Object.fromEntries(Object.entries(x.first.phase2.validation).filter(([k,v])=>v&&typeof v==='object'&&v.status&&v.status!=='pass').map(([k,v])=>[k,{status:v.status,checks:v.checks?.filter(c=>c.status!=='pass').map(c=>({checkId:c.checkId,status:c.status,message:c.message}))}])):null,error:x.first.error,repeatError:x.repeat.error,determinism:x.determinism})),diagnosticPassed:report.diagnosticPassed}));
console.log(JSON.stringify(report,null,2));process.exitCode=report.diagnosticPassed?0:1;
