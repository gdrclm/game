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

---

# V1 Must Include By Phase

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

## Phase 7 — Civilization Emergence V1

Must include:

```text
civilizationId
populationClusterRefs
culturalRegionRefs
polityType
settlementViabilityRefs
maritimeDependence
expansionBias
survivalBias
```

V1 does not include:

```text
full demographic simulation
all towns and villages
all language families
```

V2 extension slots:

```text
demographicCurves: []
languageFamilies: []
regionalSubcultures: []
protoStateTransitions: []
colonizationRoutes: []
```

---

## Phase 8 — Power Structures V1

Must include:

```text
powerNodeId
civilizationId
nodeType
controlDomain
legitimacySource
autonomyLevel
conflictWithNodeIds
supportsNodeIds
collapseSensitivity
```

V1 does not include:

```text
full bureaucracy
complete power graph for every minor actor
all offices and ranks
```

V2 extension slots:

```text
officeHierarchy: []
bureaucraticDepartments: []
localPowerSubnodes: []
rankTitles: []
covertInfluenceEdges: []
```

---

## Phase 9 — Dynasties and Elites V1

Must include:

```text
dynastyId
eliteId
civilizationId
powerNodeRefs
legitimacyBasis
inheritanceVulnerability
marriageStrategy
successionRisk
eliteConflictPressure
lineageId
```

V1 does not include:

```text
all marriages
all births/deaths
full genealogical tree
all secondary elite branches
full biographies for every ruler
```

V2 extension slots:

```text
marriageLinks: []
birthDeathRecords: []
cadetBranches: []
fullGenealogy: []
rulerBiographies: []
eliteBiographies: []
secondaryEliteFamilies: []
```

---

## Phase 10 — Strategic Decisions V1

Must include:

```text
decisionId
actorRef
decisionType
inputPressures
expectedGain
expectedRisk
chosenAction
rejectedActions
consequenceSeedRefs
```

Supported V1 decision types:

```text
trade_control
route_fortification
religious_suppression
medical_suppression
marriage_alliance_summary
colonization_or_abandonment
war_or_raid_summary
reform_attempt
monopoly_preservation
```

V1 does not include:

```text
full minimax for every war
full expectimax for every catastrophe
complete diplomatic negotiation graph
complete marriage alliance simulation
```

V2 extension slots:

```text
minimaxTrace: []
expectimaxTrace: []
negotiationRounds: []
marriageAllianceDetails: []
warCampaignPlans: []
coalitionFormationTrace: []
```

---

## Phase 11 — Era Simulation V1

Must include:

```text
epochId
timeRange
dominantConflict
majorEventIds
tradeShiftIds
warSummaryIds
migrationWaveIds
successionCrisisIds
routeShiftIds
religiousShiftIds
```

V1 target density:

```text
3 to 5 epochs
8 to 20 major events total
```

V1 does not include:

```text
full 300-400 year granular simulation
hundreds of minor incidents
all marriages across every generation
complete war-by-war campaign map
```

V2 extension slots:

```text
minorEvents: []
fullYearlyTimeline: []
warCampaigns: []
diplomaticTreaties: []
marriageEvents: []
tradeContracts: []
reformDebates: []
```

---

## Phase 12 — Memory, Trauma, Drift V1

Must include:

```text
memoryId
sourceEventId
memoryType
affectedGroupRefs
traumaIntensity
grievanceStructure
identityHardening
culturalDriftDirection
tabooInfluenceRefs
```

V1 does not include:

```text
full oral tradition corpus
full myth rewriting over generations
complete memory variants by family line
```

V2 extension slots:

```text
oralTraditions: []
mythRewrites: []
familyMemoryVariants: []
regionalMemoryVersions: []
forgottenContradictions: []
```

---

## Phase 13 — Global Tragedy V1

Must include:

```text
tragedyId
tragedyType
triggerChainIds
rootEventRefs
powerDriverRefs
religiousDriverRefs
memoryDriverRefs
geographicDriverRefs
principalStructuralBreak
archipelagoConsequenceSeeds
```

V1 does not include:

```text
all tragedy sub-events
full local version of tragedy for every region
```

V2 extension slots:

```text
regionalTragedyVariants: []
subEvents: []
failedPreventionAttempts: []
propagandaVersions: []
```

---

## Phase 14 — Collapse Cascade V1

Must include:

```text
collapseEventId
routeCollapseRefs
specialistLossRefs
portAbandonmentRefs
settlementFragmentationRefs
institutionalHollowingRefs
lateWorldPressureRefs
```

V1 does not include:

```text
complete collapse timeline for every settlement
all local violence incidents
full population attrition model
```

V2 extension slots:

```text
localCollapseEvents: []
violenceIncidents: []
populationAttritionCurves: []
specialistDeathRecords: []
failedReliefAttempts: []
```

---

## Phase 15 — Archipelago Role V1

Must include:

```text
archipelagoRoleId
oldSystemRole
strategicSignificance
dependenceNetworkRefs
formerEmpireRefs
routeCentrality
collapseScarType
pressureGradientToFinalIsland
```

V1 does not include:

```text
full trade ledger of every island
complete imperial administration tree
```

V2 extension slots:

```text
tradeLedgers: []
imperialAdministrationTree: []
routeTreaties: []
oldCustomsRecords: []
```

---

## Phase 16 — Island Roles V1

Must include:

```text
islandRoleId
islandIndex
functionalRole
oldSystemFunction
routePosition
resourceFunction
socialFunction
collapseFunction
neighborDependencyRefs
```

V1 target density:

```text
30 island role records
1 dominant function per island
1 secondary function optional
```

V1 does not include:

```text
many micro-roles per island
full internal administrative history
```

V2 extension slots:

```text
microRoles: []
administrativeSubfunctions: []
seasonalRoleVariants: []
minorDependencyEdges: []
```

---

## Phase 17 — Island Histories V1

Must include:

```text
islandHistoryId
islandIndex
foundingCause
ownershipLayers
migrationSummary
faithShiftSummary
mentalShiftSummary
growthPeriodSummary
localCrisisRefs
declineReason
presentContradiction
```

V1 target density:

```text
30 island history records
3 to 6 history beats per island
```

V1 does not include:

```text
deep full timeline for every island
all families and minor local incidents
complete biographies of all historical residents
```

V2 extension slots:

```text
fullTimeline: []
familyHistories: []
minorIncidents: []
historicalResidentBiographies: []
localLegends: []
```

---

## Phase 17.5 — Gameplay Projection Bridge V1

Must include:

```text
IslandGameplayProjectionRecord[]
progressionBand
travelPressure
survivalPressure
settlementPresence
merchantLikelihood
refugeLikelihood
hazardBias
scenarioBiases
layoutHints
mapNarrativeSummary
```

Must also include disease diagnosis projection:

```text
DiseaseTruthProfile
IslandDiagnosisProjectionRecord[]
FriendLetterProjection[]
EvidenceSlot[]
FalseCausalityProfile
DiagnosisEndingConditionMatrix
```

V1 does not include:

```text
fully authored island quest scripts
manual detective cases for all islands
all optional narrative branches
```

V2 extension slots:

```text
optionalCaseBranches: []
secondaryEvidenceChains: []
alternateFriendLetterVersions: []
expandedFalseCausalityBranches: []
lateGameVariantEndings: []
```

---

## Phase 18 — Natural Evolution V1

Must include:

```text
naturalEvolutionId
islandIndex
exploitationTraceRefs
rewildingState
loggingScarRefs
fieldRemnantRefs
marshExpansionRefs
coastalCollapseRefs
reclaimedRuinRefs
```

V1 does not include:

```text
full ecological simulation
individual species succession
complete plant community timelines
```

V2 extension slots:

```text
speciesSuccession: []
plantCommunityTimeline: []
faunaMigrationRecords: []
detailedEcologicalRecovery: []
```

---

## Phase 19 — Terrain Transformation V1

Must include:

```text
terrainTransformationId
islandIndex
rockOutcropHints
collapseFieldHints
shrubMassHints
fieldRemnantHints
oldRoadHints
drownedPathHints
terrainAnchorZones
```

V1 does not include:

```text
final tile placement
high-density terrain microfeatures
```

V2 extension slots:

```text
microTerrainFeatures: []
seasonalTerrainVariants: []
routeErosionHistory: []
```

---

## Phase 20 — Settlements V1

Must include:

```text
settlementId
islandIndex
settlementState
survivingOrCollapsed
currentCenterRefs
deadCenterRefs
authorityLayoutRefs
socialGroupRefs
districtRoleRefs
```

V1 target density:

```text
0 to 3 settlement records per island
```

V1 does not include:

```text
full population list
all households
complete local economy simulation
```

V2 extension slots:

```text
households: []
populationRoster: []
localEconomyGraph: []
craftGuilds: []
minorSocialGroups: []
```

---

## Phase 21 — Social AI V1

Must include:

```text
localSocialAIStateId
islandIndex
factionGoalRefs
resourcePriorities
beliefMotivationRefs
pressureDrivenTensions
conflictTendencies
allianceTendencies
```

V1 does not include:

```text
full autonomous NPC simulation
hour-by-hour schedules for all residents
complex multi-agent planning
```

V2 extension slots:

```text
agentPlans: []
hourlySchedules: []
negotiationState: []
longTermFactionStrategies: []
```

---

## Phase 22 — Spatial Consequences V1

Must include:

```text
spatialConsequenceId
islandIndex
aliveZones
deadZones
contestedZones
sacredZones
routeZones
workZones
abandonedDistricts
socialGeographySummary
```

V1 does not include:

```text
exact final geometry
all micro-zones
```

V2 extension slots:

```text
microZones: []
exactGeometryHints: []
seasonalZoneShifts: []
forbiddenAccessSubzones: []
```

---

## Phase 23 — Building and Prop Narrative V1

Must include:

For buildings:

```text
buildingNarrativeId
islandIndex
originalFunction
currentFunction
factionLink
historyDamageState
repairHistoryState
symbolicValue
evidenceCarrierRole optional
```

For props:

```text
propNarrativeId
islandIndex
economicMeaning
religiousMeaning
laborTrace
collapseTrace
householdTrace
environmentalStorytellingAnchor
evidenceCarrierRole optional
```

V1 target density:

```text
key buildings only
key props only
only evidence-facing props when needed
```

V1 does not include:

```text
all props in all houses
full object history for every item
```

V2 extension slots:

```text
allPropHistories: []
householdObjectSets: []
craftMarks: []
ownershipMarks: []
secondaryEvidenceThreads: []
```

---

## Phase 24 — Local NPC V1

Must include:

```text
npcId
islandIndex
npcRole
lineageRef optional
powerRef optional
memoryRef optional
tabooRef optional
buildingRef optional
factionRef optional
diseaseRole optional
trustGate optional
moralCostRole optional
biographySkeleton
```

V1 target density:

```text
1 to 5 key NPCs per important island
0 to 2 key NPCs per minor island
```

V1 biography skeleton must include:

```text
origin
socialFunction
woundOrNeed
secretOrBlindspot
relationshipToDisease
relationshipToIslandHistory
playerFacingFunction
```

V1 does not include:

```text
full biography of every NPC
all secondary NPCs
complete family trees
all schedules and daily routines
full dialogue trees
```

V2 extension slots:

```text
fullBiography: []
familyTreeRefs: []
marriageLinks: []
dailySchedule: []
secondaryNpcRelations: []
dialogueMemory: []
lifeEvents: []
```

---

## Phase 25 — Final Realization V1

Must include:

```text
PlayableWorldPackage
chunkDataRefs
tileGenerationHints
routeRefs
structurePlacementHints
propPlacementHints
interactionPointRefs
npcPlacementRefs
mapMarkerRefs
worldStatePackageRefs
```

V1 does not include:

```text
final polished art placement for every prop
complete authored level design per island
```

V2 extension slots:

```text
artDirectedPropOverrides: []
manualLevelDesignPatches: []
cinematicCompositionAnchors: []
```

---

## Phase 26 — Validation and Rebalance V1

Must include checks for:

```text
causal continuity
phase output presence
stable references
island role diversity
pressure gradient
archipelago convergence
tragedy clarity
settlement variety
social tension existence
NPC grounding
building/prop evidence grounding
disease diagnosis readability
friend objective vs survival conflict
anti-repetition between islands
ending condition reachability
```

V1 does not include:

```text
full playtest telemetry optimization
large-scale automatic content rewriting
```

V2 extension slots:

```text
telemetryDrivenRebalance: []
automaticNarrativePatchSuggestions: []
largeScalePartialRerollPolicies: []
```

---

# V1 Disease-Diagnosis Minimum

V1 must support the survival-diagnosis experience.

Required:

```text
DiagnosisCompleteness
MedicalReadiness
SocialTrust
SystemicRepair
DiseaseTruthProfile
FalseCausalityProfile
FriendLetterProjection
IslandDiagnosisProjectionRecord
EvidenceSlot
EndingConditionMatrix
```

V1 must guarantee:

```text
1. Every important island has a friend objective.
2. Every friend objective conflicts with survival, trust, route, inventory, time, morality, or access.
3. Each important island reveals one disease fragment.
4. No two neighboring important islands repeat the same dominant pattern.
5. Evidence supports triangulation through independent source groups.
6. False causality is possible but not arbitrary.
7. Endings depend on diagnosis, medicine, trust, and repair.
```

V1 does not include:

```text
fully authored detective cases per island
manual branching dialogue for every witness
all optional evidence chains
complete contradiction web for every NPC
```

V2 extension slots:

```text
secondaryEvidenceChains: []
optionalWitnessContradictions: []
expandedInterrogationBranches: []
advancedHypothesisGraph: []
lateMutationVariants: []
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
```

---

# Final Statement

The V1 skeleton is not a simplified world with missing meaning.

It is the first structurally complete version of the full world-generation machine:

```text
less density now,
full causal chain now,
full expansion path later.
```

V1 must be playable and debuggable.
V2 must be able to deepen it without architectural replacement.
