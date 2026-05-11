# WORLDGEN V1 SKELETON AND V2 EXTENSION SCOPE

## Status
Source-of-truth scope document for building a V1 causal world-generation skeleton that can later expand into the full intended V2/V3 simulation stack.

## Repository
`gdrclm/game`

## Purpose

The world generator must preserve the official causal order of phases. V1 is not allowed to skip the historical, social, religious, political, dynastic, and memory layers just to reach playable islands faster.

However, V1 must also avoid implementing the full future potential of every phase immediately. The goal is to create a structurally complete causal skeleton that can support the current survival-diagnosis game while leaving explicit extension points for deeper future systems.

V1 must therefore answer two questions:

1. What must exist now so the game works as a narrative survival-diagnosis experience?
2. What must be intentionally deferred but structurally reserved for V2, so later systems can add full marriages, deep biographies, richer geopolitical conflicts, broader infrastructure families, and dense narrative environment without rewriting V1?

---

# Core Principle

V1 must preserve causal dependency, not full simulation density.

```text
Allowed V1 reduction:
- fewer records
- shorter histories
- thinner event logs
- limited biographies
- simplified actor graphs
- limited marriage/dynasty details
- limited infrastructure variants

Forbidden V1 reduction:
- skipping phases
- breaking phase order
- making tragedy random
- generating NPCs without ancestry/social memory/context
- placing disease evidence without upstream cause
- making island roles handcrafted themes
- losing links from geography -> pressure -> society -> history -> collapse -> archipelago -> islands -> NPCs
- treating Phase 0-2 as invisible data-only packages without visual/debug proof
```

The V1 skeleton must be expandable into the full intended simulation. It must not become a dead-end prototype.

---

# V1 Definition

V1 is a complete causal skeleton across all official worldgen phases.

V1 must include:

```text
Phase 0  Master Seed
Phase 1  Macro Geography
Phase 2  Pressure and Environmental Rhythm
Phase 3  Proto-Cosmology
Phase 4  Religion
Phase 5  Mental Models
Phase 6  Social Norms
Phase 7  Civilization Emergence
Phase 8  Power Structures
Phase 9  Dynasties and Elites
Phase 10 Strategic Decisions
Phase 11 Era Simulation
Phase 12 Memory, Trauma, Drift
Phase 13 Global Tragedy
Phase 14 Collapse Cascade
Phase 15 Archipelago Role
Phase 16 Island Roles
Phase 17 Island Histories
Phase 17.5 Gameplay Projection Bridge
Phase 18 Natural Evolution
Phase 19 Terrain Transformation
Phase 20 Settlements
Phase 21 Social AI
Phase 22 Spatial Consequences
Phase 23 Building and Prop Narrative
Phase 24 Local NPC
Phase 25 Final Realization
Phase 26 Validation and Rebalance
```

V1 may implement each phase with lower density, but every phase must produce a real package and must preserve downstream references.

---

# V1 Non-Negotiable Requirements

## 1. Causal continuity
Every generated late-world element must trace back to upstream causes.

Examples:

```text
NPC taboo -> SocialNormsPackage / ReligiousLandscapePackage / CulturalMemoryPackage
Local authority -> PowerStructurePackage / DynastyPackage / IslandHistoryRecord
Disease evidence -> IslandDiagnosisProjectionRecord / BuildingNarrativePackage / PropNarrativePackage
Moral dilemma -> LocalSocialAIStatePackage / SocialTrust gate / DiseaseDiagnosisProjection
Island role -> ArchipelagoConvergencePackage / IslandRolePackage / IslandHistoryRecord
```

## 2. Structural references
All packages must expose stable ids and references that V2 can extend.

Minimum required reference types:

```text
civilizationId
religionId
normId
mentalModelId
powerNodeId
dynastyId
eliteId
decisionId
eventId
memoryId
traumaZoneId
tragedyId
collapseEventId
archipelagoRoleId
islandRoleId
islandHistoryId
settlementId
factionId
districtId
buildingNarrativeId
propNarrativeId
npcId
lineageId
evidenceId
friendLetterId
repairActionId
```

## 3. Diagnosis compatibility
The disease-diagnosis system must not float above the world.

It must derive from:

```text
geography
pressure/rhythm
infrastructure history
economy and trade decisions
religion/culture/taboo
political concealment
collapse and route failure
island role/history
settlement/social AI
building/prop/NPC carriers
```

## 4. V2 extension readiness
Every V1 package must include extension slots for deeper later systems.

Examples:

```text
marriageLinks: []
biographyEvents: []
secondaryNpcLinks: []
allianceEdges: []
warCampaignRefs: []
tradeTreatyRefs: []
ritualVariants: []
infrastructureVariants: []
medicalExperimentRefs: []
propEvidenceThreads: []
```

These can be empty or low-density in V1, but their presence prevents V2 from requiring a schema rewrite.

## 5. Phase 0-2 visual proof requirement
V1 must treat Phase 0-2 as visually verifiable world foundations, not only hidden JSON outputs.

Phase 0-2 must be testable through debug/export visuals that make the causal chain readable:

```text
Phase 0 seed/profile
-> tectonic and macro-geographic tendencies
-> continents / seas / archipelago macro-region
-> mountain systems / relief / volcanic zones
-> river basins / hydrology
-> maritime corridors / chokepoints / isolated zones
-> pressure and rhythm overlays
```

V1 must prove that different seeds create visibly different but coherent systems of islands, mountains, rivers, seas, corridors, chokepoints, pressure fields, and rhythm fields.

Required visual/debug artifacts:

```text
world profile summary panel
macro geography overview map
tectonic / plate / relief map
mountain system overlay
river basin and hydrology overlay
sea region and maritime corridor overlay
archipelago region overlay
chokepoint and route network overlay
pressure heatmap overlays
rhythm / seasonality / storm / navigation overlays
seed comparison snapshots
```

Required acceptance:

```text
[ ] A viewer can trace how Phase 0 profile values influenced Phase 1 geography.
[ ] A viewer can see that mountain systems, river basins, seas, archipelago regions, corridors, and chokepoints belong to one coherent macro system.
[ ] A viewer can see how Phase 2 pressure/rhythm derives from Phase 1 geography rather than appearing as random noise.
[ ] At least three different seeds produce visibly distinct world structures.
[ ] The archipelago region is visually identifiable as part of the larger macro geography, not as a detached island cluster.
[ ] Pressure/rhythm overlays can be compared against geography overlays.
```

This requirement is mandatory before treating V1 worldgen as playable-core ready.

---

# V1 Must Include By Phase

## Phase 0 — Master Seed V1 Visual Requirement

Must include:

```text
WorldSeedProfile
DerivedWorldTendencies
WorldSubSeedMap
human-readable profile summary
visual-debug metadata explaining major world tendencies
```

V1 must visually expose:

```text
maritimeDependence
routeFragilityBias
environmentalVolatility
collapseIntensity
conflictPressure
culturalPermeability
```

These values must be visible as the root of later geography/pressure outcomes.

---

## Phase 1 — Macro Geography V1 Visual Requirement

Must include real, visually traceable macro geography:

```text
plates
continents
seaRegions
mountainSystems
volcanicZones
riverBasins
climateBands
reliefRegions
archipelagoRegions
chokepoints
macroRoutes
isolatedZones
strategicRegions
```

V1 must visually prove:

```text
mountains follow tectonic/relief logic
river basins respond to relief and hydrology
seas and corridors form navigable structure
archipelago belongs to a larger maritime/geographic system
chokepoints and macro routes are readable from geography
strategic regions are derived from routes, chokepoints, coastality, relief, and isolation
```

V1 does not need final game tiles here. It needs macro debug maps and readable causal overlays.

V2 extension slots:

```text
detailedPlateMotion: []
localMicroClimateCells: []
riverTributaryExpansion: []
coastalMicroErosion: []
subRegionalGeology: []
```

---

## Phase 2 — Pressure and Rhythm V1 Visual Requirement

Must include visually traceable environmental pressure/rhythm derived from Phase 1.

Required overlays:

```text
climate hostility
resource stress
route exposure
chokepoint tension
ecological stability / instability
isolation pressure
catastrophe frequency
seasonal predictability
navigation windows
recovery / relief rhythm
```

V1 must visually prove:

```text
pressure follows geography
route exposure follows macro routes, chokepoints, terrain, and seas
hydrology pressure follows river basins and climate/relief
isolation pressure follows macro connectivity
catastrophe pressure follows volatile physical zones
rhythm overlays are separated from pressure overlays but readable together
```

V2 extension slots:

```text
fineLocalWeatherCells: []
seasonalMicroCalendar: []
disasterEventSeries: []
regionalRecoveryHistories: []
```

---

## Phase 3 — Proto-Cosmology V1

Must include:

```text
worldExplanationModelId
orderVsChaos
cyclicalVsLinearTime
natureRelation
moralFaultModel
humanRoleModel
sacredCentralizationBias
```

V1 does not include:

```text
full myth libraries
many regional creation myths
full mythic genealogies
```

V2 extension slots:

```text
mythFragments: []
originMyths: []
cosmicGenealogies: []
regionalInterpretations: []
```

---

## Phase 4 — Religion V1

Must include:

```text
religionId
dominantArchetype
competingDoctrineIds
priestlyStructure
sacredCenterRefs
ritualSystemRefs
tabooSeeds
legitimacyChannels
reformPressure
schismPressure
```

V1 does not include:

```text
full doctrine trees
complete ritual calendars
full priest biographies
long theological debates
```

V2 extension slots:

```text
doctrineTree: []
ritualCalendar: []
priestLineages: []
schismEvents: []
syncreticBlends: []
hereticalMovements: []
```

---

## Phase 5 — Mental Models V1

Must include:

```text
mentalModelId
survivalLogic
conflictResolutionBias
outsiderPerception
timeHorizon
riskProcessing
authorityPreference
adaptationPattern
cohesion
volatility
```

V1 does not include:

```text
individual psychology of all NPCs
full regional personality distributions
```

V2 extension slots:

```text
regionalVariants: []
classVariants: []
generationalShifts: []
characterPsychologySeeds: []
```

---

## Phase 6 — Social Norms V1

Must include:

```text
normId
marriageNormType
inheritanceNormType
violenceLegitimacy
outsiderHandling
propertyNorms
honorPrestigeHierarchy
dutyShameStructure
tabooBehaviors
```

V1 does not include:

```text
all individual marriages
all inheritance disputes
full family trees
full legal customs per village
```

V2 extension slots:

```text
marriageRulesDetailed: []
inheritanceCaseLaw: []
familyTreeExpansionHooks: []
tabooExceptions: []
localCustomVariants: []
```

---

# V1 / V2 Boundary Summary

## V1 includes

```text
all phases as packages
stable ids
causal references
tier-1 event chains
tier-1 actor lineage
tier-1 memory propagation
30 island roles
30 island histories
gameplay projection bridge
disease diagnosis projection
key settlements
key buildings/props
key NPCs with biography skeletons
playable package hints
validation report
Phase 0-2 visual/debug proof artifacts
```

## V1 excludes

```text
all marriages
full genealogies
full biographies for every NPC
all secondary NPCs
full minimax/expectimax traces
complete war campaign simulation
complete diplomacy simulation
all infrastructure variants
all prop histories
all household histories
full daily schedules
fully authored detective branches
complete narrative environment density
Phase 1 micro-geology beyond macro readability
Phase 2 fine local weather simulation
```

## V2 adds

```text
deep marriage and inheritance simulation
full dynasty genealogy expansion
richer elite and NPC biographies
secondary NPC networks
expanded diplomacy/war/trade simulations
minimax/expectimax traces for critical conflicts
infrastructure family expansion
full prop/building narrative density
local schedules and social routines
expanded detective contradiction graph
larger optional evidence web
richer environmental storytelling
deeper geology / hydrology / weather details on top of the Phase 0-2 visual foundation
```

---

# Production Rule

V1 must not pretend deferred systems do not exist.

Every deferred system must have one of these in V1:

```text
stable id slot
empty extension array
summary placeholder
reference field
validation warning category
```

This is required so V2 can expand the skeleton instead of replacing it.

---

# Acceptance Criteria For Starting V1 Implementation

Before Codex implementation begins, the following must be true:

```text
[ ] This document is accepted as the V1/V2 boundary.
[ ] Phase 2 final audit/reconciliation is complete.
[ ] Shared causal framework plan exists.
[ ] V1 package contracts include extension slots.
[ ] V1 validation checks include missing-extension-slot warnings.
[ ] Disease diagnosis projection is treated as part of gameplay projection, not a late quest layer.
[ ] Phase 24 NPC generation is required to consume upstream lineage, memory, power, taboo, building, and disease roles.
[ ] Phase 0-2 visual/debug proof artifacts are treated as mandatory V1 readiness criteria.
```

---

# Final Statement

The V1 skeleton is not a simplified world with missing meaning.

It is the first structurally complete version of the full world-generation machine:

```text
less density now,
full causal chain now,
full expansion path later,
visually provable world foundations now.
```

V1 must be playable and debuggable.
V2 must be able to deepen it without architectural replacement.
