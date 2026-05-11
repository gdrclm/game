# codex_worldgen_v1_55_prompts

## Status
Replacement compressed Codex prompt pack for V1 worldgen implementation.

This file supersedes `codex_worldgen_v1_38_prompts.md` for V1 implementation planning.

## Purpose

The previous 38-prompt pack was enough for Phase 0-17.5 causal skeleton, but it was not enough for the user's current requirement:

```text
All 26 phases must nominally exist in V1.
Every phase must expose enough wrapper data to connect generated context to visual testing.
Visual asset categories must not wait until V2.
Phase 18-26 must have minimum working wrappers, even if they are low-density.
```

This pack expands V1 to 55 prompts.

It still does not implement full V2 density:

```text
no full genealogies;
no full NPC biographies;
no all marriages simulation;
no complete settlements and households;
no full authored level design;
no final polished asset production.
```

But it does implement nominal wrappers for all 26 phases and visual carrier contracts for every phase.

---

# Global Read-First Stack

Before every prompt, read:

```text
tasks/worldgen_docs_phase1/docs/world_gen/Phase_Map_Document.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_COMPRESSED_26_PHASE_CAUSAL_PLAN.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_MINIMUM_PHASE_WRAPPERS_0_TO_17_5.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_SKELETON_AND_V2_EXTENSION_SCOPE.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_DOCUMENTATION_AND_CODEX_STRATEGY.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_VISUAL_ASSET_REGISTER_0_TO_26.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_PHASE0_2_VISUAL_PRODUCTION_REGISTER.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_VISUAL_UI_BOUNDARY_AND_SOCIAL_MARKERS_CORRECTION.md
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

# Non-Negotiable V1 Rules

## 1. All phases exist

Every phase from Phase 0 to Phase 26 must have a V1 adapter/wrapper or realization wrapper.

```text
Phase 0-2: existing deep generators adapted into V1 framework.
Phase 3-17.5: causal minimum wrappers.
Phase 18-24: visual/world realization minimum wrappers.
Phase 25: playable/world assembly wrapper.
Phase 26: validation/rebalance/readiness wrapper.
```

## 2. Visual carrier contract is mandatory

Every phase output must include one of these:

```js
visualCarrierHints: {
  directDebugVisuals: [],
  mapDebugOverlays: [],
  requiredFutureAssetFamilies: [],
  forbiddenDirectAssets: [],
  downstreamPhaseTarget: []
}
```

or:

```js
visualRealizationPack: {
  requiredTileFamilies: [],
  requiredObjectFamilies: [],
  requiredPropFamilies: [],
  requiredNpcVisualFamilies: [],
  placeholderAllowed: true,
  materializedCarrierRefs: [],
  missingAssetWarnings: []
}
```

## 3. No premature materialization

Phase 0-2 must not directly create:

```text
port buildings;
piers;
filters;
warehouses;
markets;
temples;
archives;
NPCs;
settlement layouts;
props.
```

They may only create physical prerequisites and debug overlays.

## 4. Late phases must close the visual gap

Phase 18-26 wrappers must convert upstream context into visual realization contracts:

```text
natural traces;
terrain anchors;
settlement zones;
social spaces;
spatial zones;
building narrative carriers;
prop narrative carriers;
NPC visual roles;
playable placement hints;
validation asset gaps.
```

## 5. No new UI invented

Do not add:

```text
hover popups;
new social overlay mode;
floating morality icons;
liar icons over NPCs;
new diagnosis board UI;
new relationship UI.
```

Social/trust/moral information remains data/debug/text content unless a concrete physical carrier exists.

## 6. Manual and visual test readiness

After Prompt 55, a tester must be able to inspect:

```text
Phase 0-2 physical world proof;
Phase 3-12 compressed society/history chain;
Phase 13-17 tragedy/archipelago/island chain;
Phase 17.5 gameplay/disease projection;
Phase 18-24 visual materialization wrappers;
Phase 25 playable package hints;
Phase 26 validation/readiness report;
asset gaps and placeholder coverage.
```

---

# Gate Schedule

```text
Gate A after Prompt 9   — shared framework
Gate B after Prompt 15  — Phase 0-2 visual proof
Gate C after Prompt 20  — Phase 3-6 meaning/social wrappers
Gate D after Prompt 27  — Phase 7-12 200-year history wrappers
Gate E after Prompt 33  — Phase 13-17 island-history wrappers
Gate F after Prompt 38  — Phase 17.5 gameplay/disease projection
Gate G after Prompt 47  — Phase 18-24 visual realization wrappers
Gate H after Prompt 52  — Phase 25-26 orchestration/validation
Gate I after Prompt 55  — final readiness
```

---

# Stage 0 — Reconciliation And V1 Contracts

## Prompt 1 — Mark 38-pack as superseded and create V1 progress log

Task:
Create or update V1 implementation progress tracking and record that 55-pack supersedes 38-pack for current scope.

Allowed changes:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
entry template;
changed files;
phase coverage;
visual carrier coverage;
asset-gap coverage;
validation impact;
debug impact;
manual test impact;
blockers;
next prompt readiness.
```

Acceptance:

```text
progress log exists;
55-prompt scope is recorded;
no code changes.
```

---

## Prompt 2 — Create V1 shared framework contract document

Task:
Create/update shared framework contract for all 26 phases.

Allowed changes:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_SHARED_FRAMEWORK_CONTRACT.md
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Must define:

```text
CausalPhaseWrapper
RealizationPhaseWrapper
CausalPackageFactory
PhaseWrapperRegistry
RecordReferenceResolver
EventGrammarEngine
ActorLineageEngine
MemoryPropagationEngine
ProjectionResolver
VisualCarrierRegistry
VisualRealizationRegistry
ValidationFactory
DebugSnapshotFactory
ManualTestExportFactory
AssetGapReporter
```

Acceptance:

```text
framework covers Phase 0-26;
separates causal wrappers from realization wrappers;
visual carrier contract is explicit;
progress log updated.
```

---

## Prompt 3 — Create V1 package contract index for Phase 0-26

Task:
Create/update compact package contract index for every phase.

Allowed changes:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_PACKAGE_CONTRACT_INDEX.md
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
Phase 0-2 adapter package contracts;
Phase 3-17.5 causal package contracts;
Phase 18-24 visual/world realization package contracts;
Phase 25 playable world package contract;
Phase 26 validation/rebalance package contract;
visualCarrierHints fields;
visualRealizationPack fields;
V2 extension slots.
```

Acceptance:

```text
all 26 phases represented;
all packages include causal refs or realization refs;
visual fields mandatory;
progress log updated.
```

---

## Prompt 4 — Create phase-to-visual carrier matrix document

Task:
Create a document mapping each phase to visual carriers and downstream materialization.

Allowed changes:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_PHASE_TO_VISUAL_CARRIER_MATRIX.md
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:
For every phase:

```text
phase output;
direct debug visuals;
physical prerequisite visuals;
downstream asset families;
forbidden premature assets;
Phase 18-25 materialization target;
V2 reserved visuals.
```

Acceptance:

```text
Phase 0-2 do not own human infrastructure;
Phase 18-25 close materialization gaps;
progress log updated.
```

---

## Prompt 5 — Create V1 manual visual test plan for 26 phases

Task:
Create/update manual visual test plan for all 26 phases.

Allowed changes:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_MANUAL_VISUAL_TEST_PLAN.md
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
Phase 0-2 atlas tests;
Phase 3-12 history chain tests;
Phase 13-17 island chain tests;
Phase 17.5 disease tests;
Phase 18-24 realization wrapper tests;
Phase 25 playable package tests;
Phase 26 validation tests;
three-seed visual comparison;
asset gap checklist.
```

Acceptance:

```text
manual tester can inspect all 26 phases;
asset gaps are explicit, not hidden;
progress log updated.
```

---

# Stage 1 — Shared Framework Implementation

## Prompt 6 — Create V1 framework module skeleton

Task:
Create module skeletons for V1 framework.

Allowed changes:

```text
js/worldgen/v1/index.js
js/worldgen/v1/framework/index.js
js/worldgen/v1/framework/phase-wrapper-registry.js
js/worldgen/v1/framework/causal-package-factory.js
js/worldgen/v1/framework/record-reference-resolver.js
js/worldgen/v1/framework/debug-snapshot-factory.js
js/worldgen/v1/framework/validation-factory.js
js/worldgen/v1/framework/visual-carrier-registry.js
js/worldgen/v1/framework/visual-realization-registry.js
js/worldgen/v1/framework/asset-gap-reporter.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
browser-global namespace under window.Game.systems.worldgenV1;
no phase-specific generation;
no runtime coupling;
framework modules parse.
```

Acceptance:

```text
framework skeleton exists;
visual carrier/realization modules exist;
progress log updated.
```

---

## Prompt 7 — Implement PhaseWrapperRegistry for Phase 0-26

Task:
Implement wrapper registration and ordered phase metadata.

Allowed changes:

```text
js/worldgen/v1/framework/phase-wrapper-registry.js
js/worldgen/v1/framework/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
registerPhaseWrapper
registerRealizationWrapper
getPhaseWrapper
getAllPhaseWrappers
validatePhaseWrapperDefinition
ordered phase list 0-26
required input/output package names
wrapper kind: adapter / causal / realization / validation
```

Acceptance:

```text
Phase 0-26 order exists;
invalid wrapper definitions fail validation;
progress log updated.
```

---

## Prompt 8 — Implement package factory, refs, and V2 slots

Task:
Implement generic package and record helpers.

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
createRealizationPackageSkeleton
createCausalRecord
createRealizationRecord
normalizeRefList
linkUpstreamRefs
linkDownstreamRefs
ensureV2ExtensionSlots
stable id helper
```

Acceptance:

```text
all records include stable ids and refs;
realization records include materializedCarrierRefs when applicable;
progress log updated.
```

---

## Prompt 9 — Implement visual carrier, realization, validation, and debug factories

Task:
Implement shared visual and validation helpers.

Allowed changes:

```text
js/worldgen/v1/framework/visual-carrier-registry.js
js/worldgen/v1/framework/visual-realization-registry.js
js/worldgen/v1/framework/asset-gap-reporter.js
js/worldgen/v1/framework/validation-factory.js
js/worldgen/v1/framework/debug-snapshot-factory.js
js/worldgen/v1/framework/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
createVisualCarrierHints
createVisualRealizationPack
validateVisualCarrierHints
validateVisualRealizationPack
reportMissingAssetFamily
reportForbiddenPrematureAsset
createDebugSnapshot
createSeedComparisonSnapshot shell
```

Acceptance:

```text
visual carrier validation exists;
asset gaps are reportable;
Gate A can inspect framework readiness;
progress log updated.
```

Gate A:
Manual review shared framework.

---

# Stage 2 — Phase 0-2 Adapters And Visual Atlas Proof

## Prompt 10 — Add Phase 0-2 V1 adapters

Task:
Create V1 adapters for existing Phase 0-2 outputs.

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
connect existing Phase 0-2 outputs;
convert to V1 package metadata;
add visualCarrierHints;
forbid human infrastructure outputs;
do not duplicate existing Phase 0-2 internals.
```

Acceptance:

```text
Phase 0-2 adapters expose package refs and visualCarrierHints;
forbiddenDirectAssets includes port/pier/filter/warehouse/NPC;
progress log updated.
```

---

## Prompt 11 — Add Phase 0 seed profile visual/debug export

Task:
Add debug export for Phase 0.

Allowed changes:

```text
js/worldgen/v1/debug/phase0-profile-debug.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
WorldSeedProfile panel payload;
DerivedWorldTendencies panel;
WorldSubSeedMap table;
seed-to-phase influence arrows;
three-seed profile comparison support.
```

Acceptance:

```text
Phase 0 is visually/test inspectable;
progress log updated.
```

---

## Prompt 12 — Add Phase 1 physical atlas debug export

Task:
Add debug exports for Phase 1 atlas-level systems.

Allowed changes:

```text
js/worldgen/v1/debug/phase1-physical-atlas-debug.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
plates;
relief/elevation;
mountainSystems;
volcanicZones;
riverBasins;
seaRegions;
marineCarving;
climateBands;
archipelagoRegions;
coastalOpportunity;
macroRoutes;
chokepoints;
isolatedZones;
strategicRegions;
material family hints.
```

Acceptance:

```text
Phase 1 direct debug visuals exist;
no human infrastructure assets are generated;
progress log updated.
```

---

## Prompt 13 — Add Phase 1 future asset prerequisite mapping

Task:
Add mapping from Phase 1 physical outputs to future asset families.

Allowed changes:

```text
js/worldgen/v1/debug/phase1-visual-prerequisite-map.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need examples:

```text
coastalOpportunity -> future landing/dock/pier families, target Phase 20-25;
seaRoute -> future travel/route marker families;
riverBasin -> future river/well/filter/wetland families;
chokepoint -> future bridge/pass/checkpoint families;
volcanicZone -> future ash/basalt/mineral vent families;
reliefRegion -> future cliff/slope/mountain proxy families.
```

Acceptance:

```text
future asset needs are declared as prerequisites, not Phase 1 objects;
progress log updated.
```

---

## Prompt 14 — Add Phase 2 pressure/rhythm visual debug export

Task:
Add debug exports for Phase 2.

Allowed changes:

```text
js/worldgen/v1/debug/phase2-pressure-rhythm-debug.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
climate pressure;
terrain pressure;
hydrology pressure;
food/resource pressure;
travel exposure;
chokepoint pressure;
isolation pressure;
ecological fragility;
catastrophe pressure;
seasonality;
storm cadence;
navigation windows;
scarcity/recovery rhythms.
```

Acceptance:

```text
pressure/rhythm overlays derive from Phase 1 refs;
progress log updated.
```

---

## Prompt 15 — Add three-seed foundation comparison export

Task:
Create three-seed comparison for Phase 0-2.

Allowed changes:

```text
js/worldgen/v1/debug/seed-comparison-debug.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
compare seed profiles;
compare physical atlas systems;
compare pressure/rhythm overlays;
compare future asset prerequisite families;
flag visually too-similar seeds.
```

Acceptance:

```text
Gate B can inspect Phase 0-2 atlas proof;
progress log updated.
```

Gate B:
Manual review Phase 0-2 visual atlas proof.

---

# Stage 3 — Phase 3-6 Meaning And Society Wrappers

## Prompt 16 — Implement Phase 3 Proto-Cosmology wrapper

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
1-4 explanation model records;
sourcePressureRefs/sourceRhythmRefs;
visualCarrierHints for debug cards/icons only;
no direct world props;
V2 slots.
```

Acceptance:

```text
not schema-only;
feeds Phase 4-6;
progress log updated.
```

---

## Prompt 17 — Implement Phase 4 Religion wrapper

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
2-4 religious/cultural lineages;
ritual/taboo/legitimacy fields;
visualCarrierHints for future shrine/seal/taboo boundary carriers;
forbiddenDirectAssets: final temple building / NPC priest;
V2 slots.
```

Acceptance:

```text
religion derives from upstream;
future visual carriers target Phase 20-25;
progress log updated.
```

---

## Prompt 18 — Implement Phase 5 Mental Model wrapper

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
regional mental model records;
outsider perception, risk, authority, adaptation;
visualCarrierHints for debug/text channels only;
no floating UI markers;
V2 slots.
```

Acceptance:

```text
mental models feed norms/civilizations/social AI/NPC skeletons;
progress log updated.
```

---

## Prompt 19 — Implement Phase 6 Social Norms wrapper

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
social norm records;
marriageNormType/inheritanceNormType/outsiderHandling/property/taboo;
visualCarrierHints for future physical carriers only: sealed doors, boundary signs, public notice boards;
no new UI/hover/social overlay;
V2 slots.
```

Acceptance:

```text
norms feed power/dynasty/decisions/disease/social access;
progress log updated.
```

---

## Prompt 20 — Add Phase 3-6 meaning/society debug export

Task:
Create debug export for Phase 3-6 chain.

Allowed changes:

```text
js/worldgen/v1/debug/phase3-6-meaning-society-debug.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
cosmology summary cards;
religion/taboo cards;
mental model matrix;
social norm table;
future visual carrier hints table;
forbidden UI/functionality warnings.
```

Acceptance:

```text
Gate C can inspect Phase 3-6 chain and future carrier hints;
progress log updated.
```

Gate C:
Manual review meaning/society chain.

---

# Stage 4 — Phase 7-12 Civilization, Power, And 200-Year History

## Prompt 21 — Implement Phase 7 Civilization wrapper

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
2-4 civilizations/cultural-political blocs;
consume geography/pressure/rhythm/mental/norms;
maritimeDependence, expansionBias, survivalBias;
visualCarrierHints for future banners/borders/trade-route traces;
V2 slots.
```

Acceptance:

```text
civilizations are derived, not presets;
progress log updated.
```

---

## Prompt 22 — Implement Phase 8 Power Structure wrapper

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
2-5 power centers;
controlDomain/legitimacy/conflict/support/collapseSensitivity;
visualCarrierHints for future authority house, customs post, guard post, religious office;
V2 slots.
```

Acceptance:

```text
power nodes feed dynasties/decisions/tragedy/local authority;
progress log updated.
```

---

## Prompt 23 — Implement Phase 9 Dynasty and Elite wrapper

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
2-5 dynasty/elite lines;
lineageId, legitimacy, inheritance vulnerability, marriageStrategy summary, successionRisk;
visualCarrierHints for future seals/crests/ownership marks only;
no full genealogy/marriage sim;
V2 slots.
```

Acceptance:

```text
lineage refs exist for islands/NPCs/buildings;
progress log updated.
```

---

## Prompt 24 — Implement Phase 10 Strategic Decision wrapper

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
6-12 decision records;
weighted utility summary;
trade_control, route_fortification, religious_suppression, medical_suppression, marriage_alliance_summary, colonization_or_abandonment, war_or_raid_summary, reform_attempt, monopoly_preservation when valid;
visualCarrierHints for future decree/ledger/route remnant carriers;
V2 slots.
```

Acceptance:

```text
decisions can seed eras/tragedy/disease;
progress log updated.
```

---

## Prompt 25 — Implement Phase 11 Era Simulation wrapper

Task:
Implement compressed 200-year history.

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
visualCarrierHints for future battlefield/trade/migration/archive traces;
V2 slots.
```

Acceptance:

```text
200-year arc exists;
major events have source refs;
progress log updated.
```

---

## Prompt 26 — Implement Phase 12 Memory, Trauma, Drift wrapper

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
memory, trauma, drift records;
sourceEventId required;
tabooInfluenceRefs;
grievance structures;
visualCarrierHints for future memorial/mural/warning/trauma props;
V2 slots.
```

Acceptance:

```text
memory derives from events;
progress log updated.
```

---

## Prompt 27 — Add Phase 7-12 history debug export

Task:
Create debug export for civilization/power/dynasty/decision/history/memory chain.

Allowed changes:

```text
js/worldgen/v1/debug/phase7-12-history-debug.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
civilization map payload;
power graph;
dynasty/elite table;
decision trace table;
200-year timeline;
memory/trauma graph;
future visual carrier hint table.
```

Acceptance:

```text
Gate D can inspect 200-year chain and future visual carriers;
progress log updated.
```

Gate D:
Manual review Phase 7-12.

---

# Stage 5 — Phase 13-17 Tragedy, Collapse, Archipelago, Islands

## Prompt 28 — Implement Phase 13 Global Tragedy wrapper

Task:
Implement real seeded tragedy wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase13-global-tragedy-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
tragedy from accumulated driver cluster;
refs to geography/route, power/decision, memory/religion/social;
TriggerChainPackage;
archipelagoConsequenceSeeds;
visualCarrierHints for future tragedy scars/broken route monuments/failed prevention records;
V2 slots.
```

Acceptance:

```text
tragedy is derived, not random;
progress log updated.
```

---

## Prompt 29 — Implement Phase 14 Collapse Cascade wrapper

Task:
Implement real seeded collapse wrapper.

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
portAbandonmentRefs as historical collapse refs, not placed ports;
settlementFragmentationRefs;
institutionalHollowingRefs;
lateWorldPressureRefs;
visualCarrierHints for future abandoned docks/workshops/offices/storage;
V2 slots.
```

Acceptance:

```text
collapse derives from tragedy/history/pressure;
portAbandonmentRefs are context, not physical asset placement;
progress log updated.
```

---

## Prompt 30 — Implement Phase 15 Archipelago Role wrapper

Task:
Implement real seeded archipelago role wrapper.

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
visualCarrierHints for future customs markers/route milestones/final island foreshadow carriers;
V2 slots.
```

Acceptance:

```text
archipelago role derived from geography/history/collapse;
progress log updated.
```

---

## Prompt 31 — Implement Phase 16 Island Role wrapper

Task:
Generate 30 island role records.

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
visualCarrierHints for future island role symbols and materialization families;
V2 slots.
```

Acceptance:

```text
all 30 islands have roles;
roles follow archipelago network/gradient;
progress log updated.
```

---

## Prompt 32 — Implement Phase 17 Island History wrapper

Task:
Generate 30 island history records.

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
visualCarrierHints for future ownership seals, abandoned worksites, overwritten symbols, migration remnants, crisis memorials;
V2 slots.
```

Acceptance:

```text
all islands have causal histories;
important islands expose disease/evidence hooks;
progress log updated.
```

---

## Prompt 33 — Add Phase 13-17 chain debug export

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
tragedy cause chain;
collapse cascade;
archipelago role network;
30 island role table;
30 island history cards;
visual carrier hint matrix;
asset gap seeds for Phase 18-25.
```

Acceptance:

```text
Gate E can inspect island chain and future materialization needs;
progress log updated.
```

Gate E:
Manual review Phase 13-17.

---

# Stage 6 — Phase 17.5 Gameplay And Disease Projection

## Prompt 34 — Implement Phase 17.5 gameplay projection wrapper

Task:
Implement gameplay projection records for all islands.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase17_5-gameplay-projection-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
ArchipelagoGameplayProjectionPackage;
IslandGameplayProjectionRecord[] for 30 islands;
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
visualCarrierHints for Phase 18-25 materialization targets.
```

Acceptance:

```text
all 30 islands get gameplay projection;
projection does not invent upstream history;
progress log updated.
```

---

## Prompt 35 — Implement Phase 17.5 disease diagnosis projection wrapper

Task:
Implement disease diagnosis projection.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase17_5-disease-diagnosis-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
DiseaseTruthProfile;
IslandDiagnosisProjectionRecord[] for important islands;
geography/infrastructure/economy-politics-culture/medicine/repair chain;
EvidenceSlot[];
FalseCausalityProfile;
requiredFutureAssetFamilies for evidence props, medicine props, repair props, social access objects;
source refs.
```

Acceptance:

```text
disease derives from worldgen causes;
evidence slots declare future physical carriers;
progress log updated.
```

---

## Prompt 36 — Implement Phase 17.5 friend letters and ending matrix wrapper

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
required future carriers but no new UI;
V2 slots.
```

Acceptance:

```text
every important island has actionable friend objective;
ending matrix exists;
progress log updated.
```

---

## Prompt 37 — Add Phase 17.5 projection debug export

Task:
Create debug export for gameplay/disease/friend objective projection.

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
ending matrix;
anti-repetition report;
future carrier requirements table.
```

Acceptance:

```text
Phase 17.5 can be reviewed before physical realization;
progress log updated.
```

---

## Prompt 38 — Add projection-to-realization handoff package

Task:
Create explicit handoff from Phase 17.5 to Phase 18-25.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase17_5-realization-handoff-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
ProjectionToRealizationHandoffPackage;
terrainNeeds;
settlementNeeds;
buildingNeeds;
propNeeds;
npcNeeds;
evidenceCarrierNeeds;
repairCarrierNeeds;
socialAccessCarrierNeeds;
per-island missingCarrier warnings.
```

Acceptance:

```text
Gate F can inspect exact gaps Phase 18-25 must close;
progress log updated.
```

Gate F:
Manual review Phase 17.5 and realization handoff.

---

# Stage 7 — Phase 18-24 Visual And World Realization Wrappers

## Prompt 39 — Implement Phase 18 Natural Evolution realization wrapper

Task:
Implement minimum Phase 18 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase18-natural-evolution-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
NaturalEvolutionPackage;
rewildingState;
exploitationTraceRefs;
loggingScarRefs;
fieldRemnantRefs;
marshExpansionRefs;
coastalCollapseRefs;
reclaimedRuinRefs;
visualRealizationPack with required terrain/nature asset families;
placeholder allowed.
```

Acceptance:

```text
natural traces exist for every relevant island;
materialization hints from Phase 17/17.5 are consumed;
progress log updated.
```

---

## Prompt 40 — Implement Phase 19 Terrain Transformation realization wrapper

Task:
Implement minimum Phase 19 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase19-terrain-transformation-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
TerrainTransformationPackage;
rockOutcropHints;
collapseFieldHints;
shrubMassHints;
fieldRemnantHints;
oldRoadHints;
drownedPathHints;
terrainAnchorZones;
visualRealizationPack with tile family requirements.
```

Acceptance:

```text
terrain anchor zones exist;
future tile needs are explicit;
progress log updated.
```

---

## Prompt 41 — Implement Phase 20 Settlement realization wrapper

Task:
Implement minimum Phase 20 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase20-settlement-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
SettlementGraphPackage;
DistrictGraphPackage;
LocalAuthorityPackage;
0-3 settlement records per island;
currentCenterRefs;
deadCenterRefs;
authorityLayoutRefs;
socialGroupRefs;
districtRoleRefs;
waterfront/landing/storehouse/archive/refuge zones only if supported by upstream projection;
visualRealizationPack with structure-zone asset families.
```

Acceptance:

```text
settlement/infrastructure zones now exist nominally;
no polished layout required;
progress log updated.
```

---

## Prompt 42 — Implement Phase 21 Social AI realization wrapper

Task:
Implement minimum Phase 21 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase21-social-ai-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
LocalSocialAIStatePackage;
factionGoalRefs;
resourcePriorities;
beliefMotivationRefs;
pressureDrivenTensions;
conflictTendencies;
allianceTendencies;
visualRealizationPack restricted to physical carriers / text/debug categories;
no new UI markers.
```

Acceptance:

```text
social motives exist as data for NPC/zone/building/prop wrappers;
progress log updated.
```

---

## Prompt 43 — Implement Phase 22 Spatial Consequence realization wrapper

Task:
Implement minimum Phase 22 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase22-spatial-consequence-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
SpatialConsequencePackage;
aliveZones;
deadZones;
contestedZones;
sacredZones;
routeZones;
workZones;
abandonedDistricts;
socialGeographySummary;
visualRealizationPack with zone-to-asset carrier requirements.
```

Acceptance:

```text
spatial zones exist for placement/visual testing;
progress log updated.
```

---

## Prompt 44 — Implement Phase 23 Building and Prop Narrative realization wrapper

Task:
Implement minimum Phase 23 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase23-building-prop-narrative-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
BuildingNarrativePackage;
PropNarrativePackage;
key buildings only;
key props only;
evidence carrier props when required;
repair carrier props when required;
social access physical carriers when required;
originalFunction/currentFunction/factionLink/historyDamageState/repairHistoryState/symbolicValue;
visualRealizationPack with required building/prop asset families.
```

Acceptance:

```text
port/pier/filter/storehouse/archive/shrine/lazaret appear only here if upstream requires them;
no full prop history required;
progress log updated.
```

---

## Prompt 45 — Implement Phase 24 Local NPC realization wrapper

Task:
Implement minimum Phase 24 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase24-local-npc-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
LocalNPCRosterPackage;
1-5 key NPCs per important island;
0-2 key NPCs per minor island;
npcRole;
lineageRef/powerRef/memoryRef/tabooRef/buildingRef/factionRef/diseaseRole/trustGate/moralCostRole optional;
biographySkeleton;
visualRealizationPack with NPC visual family requirements.
```

Acceptance:

```text
NPCs are grounded in upstream packages;
no full biography/dialogue tree required;
progress log updated.
```

---

## Prompt 46 — Add Phase 18-24 realization debug export

Task:
Create debug export for Phase 18-24.

Allowed changes:

```text
js/worldgen/v1/debug/phase18-24-realization-debug.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
natural evolution table;
terrain anchor table;
settlement/district table;
social AI table;
spatial zone table;
building/prop narrative table;
NPC roster table;
asset family requirements;
missing placeholder warnings.
```

Acceptance:

```text
manual tester can see materialization wrappers;
progress log updated.
```

---

## Prompt 47 — Add phase-to-asset gap report for 0-24

Task:
Create an export/report that compares generated phase needs to available visual carriers.

Allowed changes:

```text
js/worldgen/v1/debug/phase-to-asset-gap-report.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
per phase required visual families;
which are debug-only;
which require game placeholder;
which are missing;
which are V2 reserved;
forbidden premature asset checks;
Phase 0-2 direct infrastructure violation checks.
```

Acceptance:

```text
Gate G can inspect whether all visual gaps are nominally closed or reported;
progress log updated.
```

Gate G:
Manual review Phase 18-24 realization wrappers and asset gaps.

---

# Stage 8 — Phase 25-26 Playable Assembly And Validation

## Prompt 48 — Implement Phase 25 Playable World Package wrapper

Task:
Implement minimum Phase 25 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase25-playable-world-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
PlayableWorldPackage;
chunkDataRefs;
tileGenerationHints;
routeRefs;
structurePlacementHints;
propPlacementHints;
interactionPointRefs;
npcPlacementRefs;
mapMarkerRefs if existing runtime supports them;
worldStatePackageRefs;
visualRealizationPack with placeholder asset coverage.
```

Acceptance:

```text
Phase 25 assembles hints, not polished level design;
no new UI functionality invented;
progress log updated.
```

---

## Prompt 49 — Implement Phase 26 Validation/Rebalance wrapper

Task:
Implement minimum Phase 26 wrapper.

Allowed changes:

```text
js/worldgen/v1/wrappers/phase26-validation-rebalance-wrapper.js
js/worldgen/v1/wrappers/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need validation for:

```text
all 26 phases present;
causal refs;
visualCarrierHints;
visualRealizationPack;
Phase 0-2 visual proof;
no premature human infrastructure in Phase 0-2;
200-year history exists;
tragedy refs upstream causes;
30 island roles;
30 island histories;
disease projection derived from causes;
Phase 18-24 materialization wrappers exist;
Phase 25 placement hints exist;
asset gaps reported;
friend objective vs survival/social conflict;
ending matrix reachability.
```

Acceptance:

```text
validation report is not boolean-only;
blocking reasons and warnings are separated;
progress log updated.
```

---

## Prompt 50 — Implement V1 orchestration runner for Phase 0-26

Task:
Create orchestrator that executes all V1 wrappers in order.

Allowed changes:

```text
js/worldgen/v1/orchestration/index.js
js/worldgen/v1/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
runWorldgenV1Skeleton(input);
ordered execution Phase 0 -> Phase 26;
collect packages;
collect validation reports;
collect debug snapshots;
collect visual carrier hints;
collect visual realization packs;
fail if required package missing.
```

Acceptance:

```text
orchestrator covers 26 phases;
progress log updated.
```

---

## Prompt 51 — Implement manual test export bundle for all 26 phases

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
Phase 0 profile;
Phase 1 atlas overlays;
Phase 2 pressure/rhythm overlays;
Phase 3-12 history chain;
Phase 13-17 island chain;
Phase 17.5 projection;
Phase 18-24 realization wrappers;
Phase 25 playable package hints;
Phase 26 validation;
asset gap report;
three-seed comparison.
```

Acceptance:

```text
tester can inspect entire V1 without raw package browsing;
progress log updated.
```

---

## Prompt 52 — Add V1 visual placeholder registry export

Task:
Create runtime/debug export of all visual placeholder categories required by generated V1.

Allowed changes:

```text
js/worldgen/v1/debug/visual-placeholder-registry-export.js
js/worldgen/v1/debug/index.js
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
terrain tile families;
water/coast families;
route/chokepoint families;
natural trace families;
settlement zone families;
building families;
prop families;
NPC families;
disease/evidence families;
social physical carrier families;
V2 reserved visual families.
```

Acceptance:

```text
Gate H can inspect full placeholder requirements;
progress log updated.
```

Gate H:
Manual review Phase 25-26 and visual placeholder registry.

---

# Stage 9 — Final Audit, Docs Sync, Readiness

## Prompt 53 — Sync V1 docs with 55-prompt scope

Task:
Update docs to reference 55-prompt scope and all-26-phase wrapper requirement.

Allowed changes:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_DOCUMENTATION_AND_CODEX_STRATEGY.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_COMPRESSED_26_PHASE_CAUSAL_PLAN.md
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_SKELETON_AND_V2_EXTENSION_SCOPE.md
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
state 55 prompts supersede 38 prompts;
state all 26 phases must nominally exist;
state Phase 18-26 wrappers close visual materialization gaps;
state assets may be placeholders but must be declared.
```

Acceptance:

```text
docs no longer imply V1 stops at 17.5;
progress log updated.
```

---

## Prompt 54 — Run final internal audit against all acceptance criteria

Task:
Audit implementation against all V1 criteria.

Allowed changes:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_AUDIT_55_PROMPTS.md
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
phase-by-phase pass/fail;
package-by-package pass/fail;
visual carrier pass/fail;
visual realization pass/fail;
asset gap report summary;
forbidden functionality check;
manual test readiness;
known blockers;
recommend next implementation target.
```

Acceptance:

```text
audit exists;
no hidden blockers;
progress log updated.
```

---

## Prompt 55 — Produce V1 readiness report

Task:
Create final V1 readiness report for manual/visual testing.

Allowed changes:

```text
tasks/worldgen_docs_phase1/docs/world_gen/WORLDGEN_V1_READINESS_REPORT.md
WORLDGEN_V1_IMPLEMENTATION_PROGRESS_LOG.md
```

Need:

```text
implemented files summary;
all 26 phases status;
manual visual test steps;
three-seed test instructions;
asset placeholder requirements;
what is V1 playable/debug-ready;
what remains V2;
what remains separate UX/runtime work;
clear go/no-go result.
```

Acceptance:

```text
Gate I can decide whether V1 is ready for manual/visual testing;
report clearly distinguishes context, wrappers, placeholders, and missing final art;
progress log updated.
```

Gate I:
Final manual decision.

---

# Final Expected Repository State After Prompt 55

```text
V1 shared framework;
Phase 0-2 adapters and visual atlas debug exports;
Phase 3-17.5 causal wrappers;
Phase 18-24 visual/world realization wrappers;
Phase 25 playable package wrapper;
Phase 26 validation/rebalance wrapper;
V1 orchestration runner for all 26 phases;
manual visual test export bundle;
visual placeholder registry export;
asset gap report;
readiness report;
progress log;
V2 extension slots preserved.
```

---

# Final Acceptance Rule

V1 is not accepted if:

```text
any phase from 0 to 26 is missing;
any wrapper is schema-only or dummy-only;
Phase 18-26 are absent;
visual carrier hints are missing;
visual realization packs are missing where required;
Phase 0-2 directly create human infrastructure;
Phase 17.5 disease evidence lacks future carrier requirements;
Phase 23 does not create narrative carrier records for required buildings/props;
Phase 24 NPCs are ungrounded;
Phase 25 cannot produce playable placement hints;
Phase 26 cannot report missing visual assets;
new UI functionality is invented without separate UX scope.
```

V1 succeeds if:

```text
all 26 phases nominally exist;
all generated systems are causally linked;
all visual asset needs are declared;
placeholder carriers exist or are reported;
manual visual testing can start;
V2 can deepen the system without replacing V1 contracts.
```
