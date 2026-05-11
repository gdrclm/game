# codex_worldgen_v1_38_prompts

## Status
Compressed Codex prompt pack for implementing the V1 causal worldgen skeleton.

## Repository
`gdrclm/game`

## Goal
Implement the minimum working V1 worldgen skeleton from Phase 0 through Phase 17.5 in 38 bounded prompts.

The output must be ready for manual and visual testing.

V1 must preserve:

```text
causal inheritance
stable ids
V2 extension slots
Phase 0-2 visual proof
compressed 200-year history
archipelago/island causal projection
disease diagnosis projection
manual debug review
```

---

# Global Read-First Stack

Before every prompt, read only this compressed stack unless the prompt says otherwise:

```text
tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_COMPRESSED_26_PHASE_CAUSAL_PLAN.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_MINIMUM_PHASE_WRAPPERS_0_TO_17_5.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_SKELETON_AND_V2_EXTENSION_SCOPE.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_DOCUMENTATION_AND_CODEX_STRATEGY.md
```

When touching gameplay projection / disease, also read:

```text
tasks/worldgen_docs_phase1/docs/world_gen/ARCHIPELAGO_GAMEPLAY_PROJECTION_BRIDGE.md
docs/design/DISEASE_DIAGNOSIS_ISLAND_EXPERIENCE_RULES.md
```

When touching runtime-facing adapters, also read:

```text
ARCHITECTURE.md
ROADMAP.md
js/expedition/progression.js
js/state/game-state-schema.js
```

---

# Global Rules

Codex must not:

```text
split a prompt into micro-prompts unless blocked;
create schema-only phases;
create dummy/static phase records;
invent downstream history in late phases;
remove V2 extension slots;
skip debug/export surfaces;
bypass Phase 0-2 visual proof;
turn disease diagnosis into a late quest layer detached from worldgen;
write UI-heavy code before debug/export surfaces exist.
```

Codex must:

```text
produce stable ids;
write upstreamRefs and downstreamRefs;
keep V2 extension slots;
make every wrapper seed-stable;
add validation warnings, not silent failures;
write concise progress notes in the relevant V1 progress document;
run syntax checks where code is created;
keep browser-global project style unless repository conventions require otherwise.
```

---

# Gate Schedule

Stop for manual review after:

```text
Gate A after Prompt 9
Gate B after Prompt 14
Gate C after Prompt 18
Gate D after Prompt 24
Gate E after Prompt 30
Gate F after Prompt 34
Gate G after Prompt 38
```

---

# Stage 0 — Reconciliation and Documentation

## Prompt 1 — Create V1 implementation progress log

Task:
Create a V1 implementation progress log document.

Allowed changes:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
entry template
changed files
what was done
what was intentionally not done
contract impact
validation impact
debug/visual impact
manual test impact
blockers
next prompt readiness
```

Acceptance:

```text
progress log exists;
format supports 38-prompt implementation;
no code changes.
```

---

## Prompt 2 — Create V1 shared framework contract document

Task:
Create the shared framework contract doc for V1.

Allowed changes:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_SHARED_FRAMEWORK_CONTRACT.md
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need to define:

```text
CausalPhaseWrapper
CausalPackageFactory
PhaseWrapperRegistry
RecordReferenceResolver
EventGrammarEngine
ActorLineageEngine
MemoryPropagationEngine
ProjectionResolver
ValidationFactory
DebugSnapshotFactory
```

Acceptance:

```text
framework components defined;
component responsibilities separated;
no phase-specific logic placed in the framework doc;
progress log updated.
```

---

## Prompt 3 — Create V1 package contract index

Task:
Create the compact package contract index for Phase 3-17.5 wrappers.

Allowed changes:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_PACKAGE_CONTRACT_INDEX.md
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
all package names from Phase 3 to Phase 17.5;
minimum required fields;
stable id fields;
upstreamRefs/downstreamRefs;
V2 extension slots;
disease diagnosis package contracts.
```

Acceptance:

```text
all Phase 3-17.5 packages represented;
V2 extension slots present;
no package is schema-only without causal fields;
progress log updated.
```

---

## Prompt 4 — Create V1 manual visual test plan

Task:
Create manual/visual test plan for V1.

Allowed changes:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_MANUAL_VISUAL_TEST_PLAN.md
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
Phase 0 profile panel checks;
Phase 1 macro map checks;
Phase 2 overlay checks;
Phase 3-12 compressed history checks;
Phase 13-17 tragedy/archipelago/island checks;
Phase 17.5 disease projection checks;
three-seed comparison checklist;
manual failure categories.
```

Acceptance:

```text
manual test plan exists;
visual/debug readiness criteria are explicit;
progress log updated.
```

---

# Stage 1 — Shared Framework

## Prompt 5 — Create V1 worldgen framework module skeleton

Task:
Create V1 framework module skeletons without implementing phase wrappers yet.

Allowed changes:

```text
js/worldgen/v1/index.js
js/worldgen/v1/framework/index.js
js/worldgen/v1/framework/phase-wrapper-registry.js
js/worldgen/v1/framework/causal-package-factory.js
js/worldgen/v1/framework/record-reference-resolver.js
js/worldgen/v1/framework/debug-snapshot-factory.js
js/worldgen/v1/framework/validation-factory.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
browser-global namespace under window.Game.systems.worldgenV1;
clear module metadata;
no runtime coupling;
no phase-specific generation yet.
```

Acceptance:

```text
files parse;
namespace exists if loaded;
framework skeleton has no dummy phase outputs;
progress log updated.
```

---

## Prompt 6 — Implement CausalPhaseWrapper and registry

Task:
Implement reusable phase wrapper registration and execution metadata.

Allowed changes:

```text
js/worldgen/v1/framework/phase-wrapper-registry.js
js/worldgen/v1/framework/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
registerPhaseWrapper
getPhaseWrapper
getPhaseWrapperRegistry
validatePhaseWrapperDefinition
phase order metadata for Phase 0-17.5
required input/output package names
V2 extension slot requirement marker
```

Acceptance:

```text
wrapper definitions can be registered and queried;
invalid definitions fail validation;
Phase 0-17.5 order is represented;
no actual generation yet;
progress log updated.
```

---

## Prompt 7 — Implement causal package factory and reference resolver

Task:
Implement shared helper for package/record creation and upstream/downstream references.

Allowed changes:

```text
js/worldgen/v1/framework/causal-package-factory.js
js/worldgen/v1/framework/record-reference-resolver.js
js/worldgen/v1/framework/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
createCausalPackageSkeleton
createCausalRecord
normalizeRefList
linkUpstreamRefs
linkDownstreamRefs
ensureV2ExtensionSlots
stable id helper from seed + phase + record kind
```

Acceptance:

```text
records include recordId/sourcePhaseId/upstreamRefs/downstreamRefs/summary/v2ExtensionSlots;
helper is generic;
no phase-specific domain logic;
progress log updated.
```

---

## Prompt 8 — Implement validation and debug snapshot factories

Task:
Implement generic validation and debug snapshot helpers.

Allowed changes:

```text
js/worldgen/v1/framework/validation-factory.js
js/worldgen/v1/framework/debug-snapshot-factory.js
js/worldgen/v1/framework/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
createValidationReport
addBlockingReason
addWarning
validateRequiredPackageFields
validateRequiredRefs
validateV2ExtensionSlots
createDebugSnapshot
createSeedComparisonSnapshot shell
```

Acceptance:

```text
validation is not boolean-only;
debug snapshot includes phaseId/packageIds/record summaries/warnings;
progress log updated.
```

---

## Prompt 9 — Implement lightweight event, lineage, memory, projection helper shells

Task:
Create reusable helper shells needed by later wrappers.

Allowed changes:

```text
js/worldgen/v1/framework/event-grammar-engine.js
js/worldgen/v1/framework/actor-lineage-engine.js
js/worldgen/v1/framework/memory-propagation-engine.js
js/worldgen/v1/framework/projection-resolver.js
js/worldgen/v1/framework/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
small reusable helper APIs;
no deep simulation yet;
helper methods for event summary creation, lineage summary creation, memory propagation summary, projection role assignment.
```

Acceptance:

```text
helper shells exist and parse;
APIs are generic;
Gate A manual review can inspect framework readiness;
progress log updated.
```

Gate A:
Manual review shared framework before continuing.

---

# Stage 2 — Phase 0-2 Visual Proof Hardening

## Prompt 10 — Add V1 Phase 0-2 adapter registry

Task:
Create adapter wrappers that connect existing Phase 0-2 outputs into V1 framework.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase0-adapter.js
js/worldgen/v1/wrappers/phase1-adapter.js
js/worldgen/v1/wrappers/phase2-adapter.js
js/worldgen/v1/wrappers/index.js
js/worldgen/v1/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
register Phase 0 adapter;
register Phase 1 adapter;
register Phase 2 adapter;
convert existing packages into V1 causal package metadata;
no regeneration of Phase 0-2 internals.
```

Acceptance:

```text
Phase 0-2 adapters expose package refs;
adapters do not duplicate Phase 0-2 generators;
progress log updated.
```

---

## Prompt 11 — Add Phase 0 visual/debug profile summary export

Task:
Add V1 debug export for Phase 0 profile values and downstream seed map.

Allowed changes:

```text
js/worldgen/v1/debug/phase0-profile-debug.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
world profile summary export;
seed axis table export;
sub-seed table export;
explain which Phase 0 fields influence later geography/pressure.
```

Acceptance:

```text
Phase 0 profile is manually inspectable;
no UI required yet;
progress log updated.
```

---

## Prompt 12 — Add Phase 1 macro geography visual/debug export

Task:
Add V1 debug exports for macro geography visual proof.

Allowed changes:

```text
js/worldgen/v1/debug/phase1-macro-debug.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
macro overview data export;
relief/mountain/river/sea/archipelago/route/chokepoint overlays as debug payloads;
seed comparison snapshot support;
no canvas/UI drawing required unless existing debug map tools make it simple.
```

Acceptance:

```text
Phase 1 visual proof data can be exported;
outputs reference existing MacroGeographyPackage records;
progress log updated.
```

---

## Prompt 13 — Add Phase 2 pressure/rhythm visual/debug export

Task:
Add V1 debug exports for pressure/rhythm overlays.

Allowed changes:

```text
js/worldgen/v1/debug/phase2-pressure-rhythm-debug.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
pressure overlay payloads;
rhythm overlay payloads;
record-bound profile summaries;
comparison between Phase 1 geography refs and Phase 2 derived records.
```

Acceptance:

```text
pressure/rhythm overlays can be manually inspected;
no pressure/rhythm mixing;
progress log updated.
```

---

## Prompt 14 — Add three-seed V1 foundation comparison snapshot

Task:
Create a debug/test helper that compares Phase 0-2 outputs across three seeds.

Allowed changes:

```text
js/worldgen/v1/debug/seed-comparison-debug.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
compare Phase 0 profile summaries;
compare Phase 1 geography summary counts/roles;
compare Phase 2 pressure/rhythm summary contrasts;
flag if seeds look too similar;
export readable comparison object.
```

Acceptance:

```text
three-seed comparison exists;
Gate B can manually inspect Phase 0-2 visual proof readiness;
progress log updated.
```

Gate B:
Manual review Phase 0-2 visual/debug proof before continuing.

---

# Stage 3 — Phase 3-6 Meaning and Society Wrappers

## Prompt 15 — Implement Phase 3 Proto-Cosmology minimum wrapper

Task:
Implement real seeded Phase 3 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase3-proto-cosmology-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
consume Phase 0/2 refs;
generate 1-4 explanation model records;
sourcePressureRefs/sourceRhythmRefs;
V2 slots;
debug snapshot.
```

Acceptance:

```text
not schema-only;
outputs stable ids;
can influence Phase 4-6;
progress log updated.
```

---

## Prompt 16 — Implement Phase 4 Religion minimum wrapper

Task:
Implement real seeded Phase 4 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase4-religion-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
consume ProtoCosmology/Pressure/Rhythm;
generate 2-4 religious/cultural lineages;
ritual/taboo/legitimacy fields;
V2 slots;
debug snapshot.
```

Acceptance:

```text
religion derives from upstream;
taboos can feed disease/access later;
progress log updated.
```

---

## Prompt 17 — Implement Phase 5 Mental Model minimum wrapper

Task:
Implement real seeded Phase 5 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase5-mental-model-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
consume Pressure/Religion;
generate regional mental model records;
outsider perception, risk, authority, adaptation;
V2 slots;
debug snapshot.
```

Acceptance:

```text
mental models derive from environment/religion;
can feed norms/civilizations/NPC skeletons;
progress log updated.
```

---

## Prompt 18 — Implement Phase 6 Social Norms minimum wrapper

Task:
Implement real seeded Phase 6 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase6-social-norms-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
consume Mental/Religion/Cosmology;
generate social norm records;
marriageNormType/inheritanceNormType/outsiderHandling/property/taboo;
V2 slots;
debug snapshot.
```

Acceptance:

```text
norms can feed power, dynasty, decisions, disease social cost;
Gate C can inspect Phase 3-6 chain;
progress log updated.
```

Gate C:
Manual review meaning/society chain.

---

# Stage 4 — Phase 7-12 Civilization, Power, 200-Year History

## Prompt 19 — Implement Phase 7 Civilization minimum wrapper

Task:
Implement real seeded Phase 7 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase7-civilization-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
generate 2-4 civilizations/cultural-political blocs;
consume geography/pressure/rhythm/mental/norms;
include maritimeDependence, expansionBias, survivalBias;
V2 slots;
debug snapshot.
```

Acceptance:

```text
civilizations are not presets;
source refs exist;
progress log updated.
```

---

## Prompt 20 — Implement Phase 8 Power Structure minimum wrapper

Task:
Implement real seeded Phase 8 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase8-power-structure-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
generate 2-5 power centers;
controlDomain/legitimacy/conflict/support/collapseSensitivity;
source refs to civilization/religion/norms;
V2 slots;
debug snapshot.
```

Acceptance:

```text
power nodes feed dynasties/decisions/tragedy/NPC;
progress log updated.
```

---

## Prompt 21 — Implement Phase 9 Dynasty and Elite minimum wrapper

Task:
Implement real seeded Phase 9 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase9-dynasty-elite-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
generate 2-5 dynasty/elite lines;
lineageId, legitimacy, inheritance vulnerability, marriageStrategy summary, successionRisk;
V2 slots for full genealogy/marriage;
debug snapshot.
```

Acceptance:

```text
no full marriage simulation;
lineage refs exist for later NPCs/islands;
progress log updated.
```

---

## Prompt 22 — Implement Phase 10 Strategic Decision minimum wrapper

Task:
Implement real seeded Phase 10 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase10-strategic-decision-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
generate 6-12 decision records;
use weighted utility summary;
include trade_control, route_fortification, religious_suppression, medical_suppression, marriage_alliance_summary, war_or_raid_summary, reform_attempt, monopoly_preservation when valid;
V2 slots for minimax/expectimax/diplomacy;
debug snapshot.
```

Acceptance:

```text
decisions reference actors and pressures;
can seed era simulation/tragedy/disease;
progress log updated.
```

---

## Prompt 23 — Implement Phase 11 Era Simulation minimum wrapper

Task:
Implement compressed 200-year history wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase11-era-simulation-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
3 eras;
6-12 major events minimum, up to 20 allowed;
Era 1 foundation/expansion;
Era 2 tension/war/reform/monopoly hardening;
Era 3 late instability/failed correction/tragedy setup;
source refs to decisions/power/dynasties/geography;
V2 slots for full yearly timeline, wars, treaties, marriages;
debug timeline.
```

Acceptance:

```text
200-year compressed arc exists;
major events have stable ids and source refs;
progress log updated.
```

---

## Prompt 24 — Implement Phase 12 Memory, Trauma, Drift minimum wrapper

Task:
Implement real seeded Phase 12 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase12-memory-trauma-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
consume HistoricalEventLog/Mental/Religion/Population;
generate memory, trauma, drift records;
sourceEventId required;
tabooInfluenceRefs and grievance structures;
V2 slots;
debug memory graph.
```

Acceptance:

```text
memory/trauma derive from events;
Gate D can inspect 200-year chain;
progress log updated.
```

Gate D:
Manual review civilization/history/memory chain.

---

# Stage 5 — Phase 13-17 Tragedy, Collapse, Archipelago, Islands

## Prompt 25 — Implement Phase 13 Global Tragedy minimum wrapper

Task:
Implement real seeded Phase 13 tragedy wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase13-global-tragedy-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
tragedy chosen from accumulated driver cluster;
refs to geography/route, power/decision, memory/religion/social;
TriggerChainPackage;
archipelagoConsequenceSeeds;
V2 slots;
debug cause chain.
```

Acceptance:

```text
tragedy is not random;
references Phase 7-12 causes;
progress log updated.
```

---

## Prompt 26 — Implement Phase 14 Collapse Cascade minimum wrapper

Task:
Implement real seeded Phase 14 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase14-collapse-cascade-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
routeCollapseRefs;
specialistLossRefs;
portAbandonmentRefs;
settlementFragmentationRefs;
institutionalHollowingRefs;
lateWorldPressureRefs;
V2 slots;
debug collapse graph.
```

Acceptance:

```text
collapse derives from tragedy/history/pressure;
progress log updated.
```

---

## Prompt 27 — Implement Phase 15 Archipelago Role minimum wrapper

Task:
Implement real seeded Phase 15 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase15-archipelago-role-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
oldSystemRole;
strategicSignificance;
dependenceNetworkRefs;
formerEmpireRefs;
routeCentrality;
collapseScarType;
pressureGradientToFinalIsland;
source refs to geography/history/collapse/tragedy;
V2 slots;
debug role card/network.
```

Acceptance:

```text
archipelago role is derived, not decorative;
progress log updated.
```

---

## Prompt 28 — Implement Phase 16 Island Role minimum wrapper

Task:
Implement all 30 island role records.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase16-island-role-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
30 IslandRole records;
one dominant role per island;
optional secondary role;
routePosition, oldSystemFunction, resourceFunction, socialFunction, collapseFunction;
neighborDependencyRefs;
V2 slots;
debug island role table/map payload.
```

Acceptance:

```text
all 30 islands have roles;
roles follow archipelago network and pressure gradient;
progress log updated.
```

---

## Prompt 29 — Implement Phase 17 Island History minimum wrapper

Task:
Implement all 30 island history records.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase17-island-history-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
30 IslandHistoryRecord records;
3-6 beats per island;
foundingCause, ownershipLayers, migrationSummary, faithShiftSummary, mentalShiftSummary, growthPeriodSummary, localCrisisRefs, declineReason, presentContradiction;
source refs;
V2 slots;
debug history table.
```

Acceptance:

```text
all islands have causal histories;
important islands expose disease/evidence hooks;
progress log updated.
```

---

## Prompt 30 — Add Phase 13-17 chain debug export

Task:
Create debug export for tragedy/collapse/archipelago/island chain.

Allowed changes:

```text
js/worldgen/v1/debug/phase13-17-chain-debug.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
tragedy cause chain export;
collapse cascade export;
archipelago role export;
30 island role export;
30 island history export;
source refs between stages.
```

Acceptance:

```text
Gate E can manually inspect tragedy to island histories;
progress log updated.
```

Gate E:
Manual review tragedy/collapse/archipelago/island causal chain.

---

# Stage 6 — Phase 17.5 Gameplay and Disease Projection

## Prompt 31 — Implement gameplay projection minimum wrapper

Task:
Implement ArchipelagoGameplayProjectionPackage and IslandGameplayProjectionRecord generation.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase17_5-gameplay-projection-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
progressionBand;
travelPressure;
survivalPressure;
settlementPresence;
merchantLikelihood;
refugeLikelihood;
hazardBias;
scenarioBiases;
layoutHints;
mapNarrativeSummary;
source refs to archipelago/island history/late world/pressure.
```

Acceptance:

```text
all 30 islands get gameplay projection records;
projection does not invent upstream history;
progress log updated.
```

---

## Prompt 32 — Implement disease diagnosis projection minimum wrapper

Task:
Implement DiseaseTruthProfile and IslandDiagnosisProjectionRecord generation.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase17_5-disease-diagnosis-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
DiseaseTruthProfile;
important island diagnosis roles;
geography/infrastructure/economy-politics-culture/medicine/repair chain;
evidence slots;
false causality candidates;
source refs to geography/history/collapse/island histories/social norms/religion.
```

Acceptance:

```text
disease derives from worldgen causes;
not a late quest layer;
progress log updated.
```

---

## Prompt 33 — Implement friend letters and ending matrix projection

Task:
Generate FriendLetterProjection[] and DiagnosisEndingConditionMatrix.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase17_5-friend-letter-ending-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
friend objectives for important islands;
objective conflicts with survival/trust/route/inventory/time/morality/access;
DiagnosisCompleteness;
MedicalReadiness;
SocialTrust;
SystemicRepair;
ending matrix;
V2 slots.
```

Acceptance:

```text
every important island has actionable friend objective;
ending matrix exists;
progress log updated.
```

---

## Prompt 34 — Add Phase 17.5 disease/gameplay debug export

Task:
Create debug export for gameplay and disease diagnosis projection.

Allowed changes:

```text
js/worldgen/v1/debug/phase17_5-projection-debug.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
island gameplay projection table;
diagnosis projection table;
friend letter list;
evidence graph;
false causality graph;
ending condition matrix;
anti-repetition report.
```

Acceptance:

```text
Gate F can inspect playable diagnosis chain;
progress log updated.
```

Gate F:
Manual review gameplay/disease projection.

---

# Stage 7 — Orchestration, Validation, Manual Testing

## Prompt 35 — Implement V1 orchestration runner for Phase 0-17.5

Task:
Create V1 orchestrator that executes adapters/wrappers in order.

Allowed changes:

```text
js/worldgen/v1/orchestration/index.js
js/worldgen/v1/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
runWorldgenV1Skeleton(input);
ordered execution Phase 0 -> 17.5;
collect packages;
collect validation reports;
collect debug snapshots;
fail if required package missing.
```

Acceptance:

```text
orchestrator uses registered wrappers;
phase order respected;
progress log updated.
```

---

## Prompt 36 — Implement V1 validation pass

Task:
Implement V1 validation across Phase 0-17.5.

Allowed changes:

```text
js/worldgen/v1/validation/index.js
js/worldgen/v1/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need checks:

```text
phase output presence;
stable references;
upstream refs;
downstream refs;
V2 extension slots;
Phase 0-2 visual proof readiness;
200-year history exists;
tragedy references upstream causes;
30 island roles;
30 island histories;
disease projection derived from causes;
friend objective vs survival conflict;
anti-repetition;
ending matrix reachability.
```

Acceptance:

```text
validation report has blocking reasons and warnings;
not boolean-only;
progress log updated.
```

---

## Prompt 37 — Implement V1 manual test export bundle

Task:
Create export bundle for manual/visual testing.

Allowed changes:

```text
js/worldgen/v1/debug/manual-test-export.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
single export object containing Phase 0 profile, Phase 1 overlays, Phase 2 overlays, Phase 3-12 history chain, Phase 13-17 chain, Phase 17.5 projection, validation report;
three-seed comparison support;
readable table-friendly structure.
```

Acceptance:

```text
manual tester can inspect entire chain without reading raw packages;
progress log updated.
```

---

## Prompt 38 — Final audit and readiness report

Task:
Run final audit of V1 implementation against docs and produce readiness report.

Allowed changes:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_READINESS_REPORT.md
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
summarize implemented files;
state pass/fail for each V1 acceptance criterion;
list blockers;
list manual visual test steps;
list V2 deferred systems and extension slots;
recommend next implementation target after V1 skeleton.
```

Acceptance:

```text
readiness report exists;
Gate G can decide whether V1 is ready for manual/visual testing;
no hidden unresolved blockers.
```

Gate G:
Manual decision: V1 ready for visual/manual testing or blocked.

---

# Final Output Requirement

After Prompt 38, the repository must contain:

```text
V1 shared framework;
Phase 0-2 adapters and debug exports;
Phase 3-17.5 minimum working wrappers;
V1 orchestration runner;
V1 validation pass;
manual test export bundle;
readiness report;
progress log;
V2 extension slots preserved.
```

V1 is not accepted if any phase from 3 to 17.5 is schema-only or dummy-only.
