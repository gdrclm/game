# WORLDGEN V1 COMPRESSED 26-PHASE CAUSAL PLAN

## Status
Source-of-truth compact plan for V1 implementation of the full world-generation causal stack.

## Repository
`gdrclm/game`

## Purpose

This document defines the compressed V1 version of the complete world-generation pipeline.

V1 must not remove the causal order of the official phase map. It must preserve the chain:

```text
seed
-> geography
-> pressure/rhythm
-> cosmology/religion/mental models/social norms
-> civilizations/power/dynasties/decisions/history/memory
-> tragedy/collapse
-> archipelago/islands/island histories
-> gameplay projection and disease diagnosis projection
-> natural/terrain/settlement/social/spatial/building/NPC realization
-> playable world
-> validation/rebalance
```

V1 is compressed in density, not in causality.

---

# V1 Compression Rule

V1 must include every official phase as a real package, but each phase may start with a Tier-1 structural implementation.

## V1 includes

```text
stable package outputs
stable ids
upstream references
downstream handoff fields
summary records
validation metadata
V2 extension slots
```

## V1 excludes, but reserves

```text
full genealogies
all marriages
all NPC biographies
all secondary NPCs
full minimax/expectimax traces
complete diplomacy/war/trade simulation
all infrastructure variants
all prop histories
all household histories
full daily schedules
fully authored detective branches
full narrative environment density
```

## V2 must be able to expand V1 through

```text
empty extension arrays
stable id references
summary placeholders
optional detail packages
validation warning categories
```

V1 must never require V2 to rewrite the phase contracts from scratch.

---

# Universal V1 Phase Record Contract

Every V1 phase package should expose these common fields where applicable:

```text
phaseId
packageId
sourceSeedRef
inputPackageRefs
outputRecordIds
causalSummary
validationStatus
warnings
v2ExtensionSlots
```

Every generated record should expose:

```text
recordId
sourcePhaseId
upstreamRefs
downstreamRefs
summary
confidence
v2ExtensionSlots
```

---

# Phase 0 — Master Seed Generator

## V1 role
Generate the genetic profile of the world run.

## Inherits from
```text
base seed
optional preset / hard constraints
```

## V1 must generate
```text
WorldSeedProfile
DerivedWorldTendencies
WorldSubSeedMap
visual/debug profile summary
```

## Must influence downstream
```text
macro geography tendencies
environmental volatility
maritime dependence
route fragility
conflict pressure
collapse intensity
cultural permeability
phase sub-seeds
```

## V1 visual requirement
The user must be able to see how the seed profile pushes the later world shape.

## V1 does not include
```text
actual geography
cultures
religions
states
islands
NPCs
```

## V2 extension slots
```text
advancedPresetFamilies: []
longitudinalSeedMutations: []
playerFacingWorldModeProfiles: []
```

---

# Phase 1 — Macro Geography Generator

## V1 role
Generate physical and strategic possibility space.

## Inherits from
```text
WorldSeedProfile
DerivedWorldTendencies
WorldSubSeedMap.macroGeographySeed
```

## V1 must generate
```text
MacroGeographyPackage
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
visual/debug macro maps
```

## Must influence downstream
```text
Phase 2 pressure/rhythm
Phase 7 civilizations
Phase 10 route decisions
Phase 13 tragedy drivers
Phase 15 archipelago role
Phase 17 island histories
DiseaseDiagnosis geography layer
```

## V1 visual requirement
Mountains, rivers, seas, routes, chokepoints, isolation, and archipelago region must read as one coherent tectonic/maritime system.

## V1 does not include
```text
micro-geology
final island tiles
local terrain details
fine weather cells
```

## V2 extension slots
```text
detailedPlateMotion: []
subRegionalGeology: []
riverTributaryExpansion: []
coastalMicroErosion: []
localMicroClimateCells: []
```

---

# Phase 2 — Pressure and Environmental Rhythm Generator

## V1 role
Translate macro geography into experienced environmental pressure and rhythm.

## Inherits from
```text
MacroGeographyPackage
WorldSeedProfile
```

## V1 must generate
```text
PressureFieldPackage
EnvironmentalRhythmPackage
climate hostility
resource stress
route exposure
chokepoint tension
ecological instability
isolation pressure
catastrophe frequency
seasonality
storm rhythm
navigation rhythm
scarcity rhythm
recovery / relief rhythm
visual pressure/rhythm overlays
```

## Must influence downstream
```text
Phase 3 proto-cosmology
Phase 5 mental models
Phase 7 civilization viability
Phase 10 strategic decisions
Phase 12 trauma/memory
Phase 17 island histories
Phase 17.5 gameplay pressure projection
DiseaseDiagnosis survival conflict layer
```

## V1 visual requirement
Pressure/rhythm overlays must visibly derive from Phase 1 geography rather than appear as random heatmaps.

## V1 does not include
```text
fine local weather simulation
full disaster timeline
seasonal micro-calendar
```

## V2 extension slots
```text
fineLocalWeatherCells: []
seasonalMicroCalendar: []
disasterEventSeries: []
regionalRecoveryHistories: []
```

---

# Phase 3 — Proto-Cosmology Generator

## V1 role
Generate the first explanation models societies use to interpret the world.

## Inherits from
```text
PressureFieldPackage
EnvironmentalRhythmPackage
WorldSeedProfile
```

## V1 must generate
```text
ProtoCosmologyPackage
worldExplanationModelId
orderVsChaos
cyclicalVsLinearTime
natureRelation
moralFaultModel
humanRoleModel
sacredCentralizationBias
```

## Must influence downstream
```text
Phase 4 religion
Phase 5 mental models
Phase 6 social norms
Phase 12 memory interpretation
DiseaseDiagnosis cultural false-cause layer
```

## V1 does not include
```text
full myth libraries
many regional creation myths
cosmic genealogies
```

## V2 extension slots
```text
mythFragments: []
originMyths: []
cosmicGenealogies: []
regionalInterpretations: []
```

---

# Phase 4 — Religious-Cosmological Formation Generator

## V1 role
Generate religions as adaptive systems of explanation, cohesion, taboo, and legitimacy.

## Inherits from
```text
ProtoCosmologyPackage
PressureFieldPackage
EnvironmentalRhythmPackage
WorldSeedProfile
```

## V1 must generate
```text
ReligiousLandscapePackage
ReligiousInstitutionPackage
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

## Must influence downstream
```text
Phase 5 mental models
Phase 6 social norms
Phase 8 power structures
Phase 10 strategic decisions
Phase 12 memory/trauma
Phase 21 local social AI
DiseaseDiagnosis taboo / ritual obstruction layer
```

## V1 does not include
```text
full doctrine trees
complete ritual calendars
full priest biographies
long theological debates
```

## V2 extension slots
```text
doctrineTree: []
ritualCalendar: []
priestLineages: []
schismEvents: []
syncreticBlends: []
hereticalMovements: []
```

---

# Phase 5 — Mental Model Generator

## V1 role
Generate how societies perceive survival, conflict, outsiders, time, risk, and authority.

## Inherits from
```text
PressureFieldPackage
ReligiousLandscapePackage
ReligiousInstitutionPackage
WorldSeedProfile
```

## V1 must generate
```text
MentalLandscapePackage
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

## Must influence downstream
```text
Phase 6 social norms
Phase 7 civilization emergence
Phase 10 strategic decisions
Phase 12 cultural drift
Phase 21 social AI
Phase 24 NPC psychology skeletons
```

## V1 does not include
```text
individual psychology of all NPCs
full regional personality distributions
```

## V2 extension slots
```text
regionalVariants: []
classVariants: []
generationalShifts: []
characterPsychologySeeds: []
```

---

# Phase 6 — Social Norms and Cultural Formation Generator

## V1 role
Generate normative rules that define what institutions and behaviors are socially possible.

## Inherits from
```text
MentalLandscapePackage
ReligiousLandscapePackage
ProtoCosmologyPackage
```

## V1 must generate
```text
SocialNormsPackage
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

## Must influence downstream
```text
Phase 7 civilization emergence
Phase 8 power structures
Phase 9 dynasty logic
Phase 10 decisions
Phase 20 settlements
Phase 21 social AI
Phase 24 NPC grounding
DiseaseDiagnosis access/trust/moral cost layer
```

## V1 does not include
```text
all individual marriages
all inheritance disputes
full family trees
full village law systems
```

## V2 extension slots
```text
marriageRulesDetailed: []
inheritanceCaseLaw: []
familyTreeExpansionHooks: []
tabooExceptions: []
localCustomVariants: []
```

---

# Phase 7 — Civilization Emergence Generator

## V1 role
Generate civilizations as emergent formations from geography, pressure, meaning, and norms.

## Inherits from
```text
MacroGeographyPackage
PressureFieldPackage
EnvironmentalRhythmPackage
MentalLandscapePackage
SocialNormsPackage
```

## V1 must generate
```text
CivilizationSeedPackage
PopulationBehaviorPackage
civilizationId
populationClusterRefs
culturalRegionRefs
polityType
settlementViabilityRefs
maritimeDependence
expansionBias
survivalBias
```

## Must influence downstream
```text
Phase 8 power structures
Phase 9 dynasties/elites
Phase 10 decisions
Phase 11 eras
Phase 15 archipelago role
Phase 24 NPC ancestry context
```

## V1 does not include
```text
full demographic simulation
all towns and villages
all language families
```

## V2 extension slots
```text
demographicCurves: []
languageFamilies: []
regionalSubcultures: []
protoStateTransitions: []
colonizationRoutes: []
```

---

# Phase 8 — Power Structure Generator

## V1 role
Generate internal structures of control and legitimacy.

## Inherits from
```text
CivilizationSeedPackage
SocialNormsPackage
ReligiousInstitutionPackage
MentalLandscapePackage
```

## V1 must generate
```text
PowerStructurePackage
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

## Must influence downstream
```text
Phase 9 dynasties/elites
Phase 10 decisions
Phase 12 memory/trauma
Phase 13 tragedy power drivers
Phase 20 local authority
Phase 24 NPC power grounding
DiseaseDiagnosis political concealment layer
```

## V1 does not include
```text
full bureaucracy
all offices and ranks
complete minor actor graph
```

## V2 extension slots
```text
officeHierarchy: []
bureaucraticDepartments: []
localPowerSubnodes: []
rankTitles: []
covertInfluenceEdges: []
```

---

# Phase 9 — Dynasty and Elite Generator

## V1 role
Generate carriers of power, will, inheritance, legitimacy, and future conflict.

## Inherits from
```text
PowerStructurePackage
CivilizationSeedPackage
WorldSeedProfile
```

## V1 must generate
```text
DynastyPackage
ElitePackage
RulerRosterPackage
dynastyId
eliteId
lineageId
powerNodeRefs
legitimacyBasis
inheritanceVulnerability
marriageStrategy
successionRisk
eliteConflictPressure
```

## Must influence downstream
```text
Phase 10 strategic decisions
Phase 11 eras
Phase 12 elite memory
Phase 13 tragedy drivers
Phase 17 island ownership layers
Phase 24 local NPC lineage refs
```

## V1 does not include
```text
all marriages
all births/deaths
full genealogical tree
all secondary elite branches
full biographies for every ruler
```

## V2 extension slots
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

# Phase 10 — Strategic Decision Generator

## V1 role
Generate major actions taken by civilizations, elites, dynasties, religious blocs, and power structures.

## Inherits from
```text
CivilizationSeedPackage
PowerStructurePackage
DynastyPackage
MentalLandscapePackage
ReligiousLandscapePackage
```

## V1 must generate
```text
DecisionTracePackage
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

## V1 supported decision types
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

## Must influence downstream
```text
Phase 11 era simulation
Phase 12 memory
Phase 13 tragedy trigger chains
Phase 14 collapse cascade
Phase 15 archipelago role
DiseaseDiagnosis economic/political/infrastructure layers
```

## V1 does not include
```text
full minimax for every war
full expectimax for every catastrophe
complete diplomatic negotiation graph
complete marriage alliance simulation
```

## V2 extension slots
```text
minimaxTrace: []
expectimaxTrace: []
negotiationRounds: []
marriageAllianceDetails: []
warCampaignPlans: []
coalitionFormationTrace: []
```

---

# Phase 11 — Era Simulation Generator

## V1 role
Generate compressed epoch-scale history from accumulated decisions and pressures.

## Inherits from
```text
all previous world/society/power/decision packages
```

## V1 must generate
```text
EpochPackage
HistoricalEventLog
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

## V1 target density
```text
3 to 5 epochs
8 to 20 major events total
```

## Must influence downstream
```text
Phase 12 memory/trauma/drift
Phase 13 global tragedy
Phase 15 archipelago role
Phase 17 island histories
Phase 24 NPC historical grounding
```

## V1 does not include
```text
full 300-400 year granular simulation
hundreds of minor incidents
all marriages across generations
complete war-by-war campaign map
```

## V2 extension slots
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

# Phase 12 — Memory, Trauma and Cultural Drift Generator

## V1 role
Persist history into myths, grievance, taboo, identity, and social dispositions.

## Inherits from
```text
HistoricalEventLog
MentalLandscapePackage
ReligiousLandscapePackage
PopulationBehaviorPackage
```

## V1 must generate
```text
CulturalMemoryPackage
TraumaMap
CulturalDriftPackage
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

## Must influence downstream
```text
Phase 13 tragedy meaning
Phase 14 collapse responses
Phase 17 island present contradictions
Phase 21 local social AI
Phase 24 NPC wound/secret/blindspot
DiseaseDiagnosis trust/morality/false-cause layer
```

## V1 does not include
```text
full oral tradition corpus
full myth rewriting over generations
complete memory variants by family line
```

## V2 extension slots
```text
oralTraditions: []
mythRewrites: []
familyMemoryVariants: []
regionalMemoryVersions: []
forgottenContradictions: []
```

---

# Phase 13 — Global Tragedy Generator

## V1 role
Derive the main tragedy that breaks the old order from accumulated causes.

## Inherits from
```text
HistoricalEventLog
CulturalMemoryPackage
MacroGeographyPackage
DecisionTracePackage
PowerStructurePackage
DynastyPackage
ReligiousLandscapePackage
late route / war / pressure states
```

## V1 must generate
```text
GlobalTragedyPackage
TriggerChainPackage
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

## Must influence downstream
```text
Phase 14 collapse cascade
Phase 15 archipelago role
Phase 17 island histories
DiseaseDiagnosis root systemic cause layer
```

## V1 does not include
```text
all tragedy sub-events
full local version of tragedy for every region
```

## V2 extension slots
```text
regionalTragedyVariants: []
subEvents: []
failedPreventionAttempts: []
propagandaVersions: []
```

---

# Phase 14 — Collapse Cascade Generator

## V1 role
Simulate the breakdown after the global tragedy at compressed structural density.

## Inherits from
```text
GlobalTragedyPackage
HistoricalEventLog
PowerStructurePackage
CivilizationSeedPackage
MacroGeographyPackage
PressureFieldPackage
```

## V1 must generate
```text
CollapseCascadePackage
LateWorldStatePackage
collapseEventId
routeCollapseRefs
specialistLossRefs
portAbandonmentRefs
settlementFragmentationRefs
institutionalHollowingRefs
lateWorldPressureRefs
```

## Must influence downstream
```text
Phase 15 archipelago role
Phase 16 island roles
Phase 17 island histories
Phase 20 settlements
DiseaseDiagnosis route failure / medicine failure layer
```

## V1 does not include
```text
complete collapse timeline for every settlement
all local violence incidents
full population attrition model
```

## V2 extension slots
```text
localCollapseEvents: []
violenceIncidents: []
populationAttritionCurves: []
specialistDeathRecords: []
failedReliefAttempts: []
```

---

# Phase 15 — Archipelago Role Generator

## V1 role
Determine what the archipelago meant in the old world and what scar it became after collapse.

## Inherits from
```text
MacroGeographyPackage
HistoricalEventLog
CollapseCascadePackage
GlobalTragedyPackage
```

## V1 must generate
```text
ArchipelagoConvergencePackage
archipelagoRoleId
oldSystemRole
strategicSignificance
dependenceNetworkRefs
formerEmpireRefs
routeCentrality
collapseScarType
pressureGradientToFinalIsland
```

## Must influence downstream
```text
Phase 16 island roles
Phase 17 island histories
Phase 17.5 gameplay projection
DiseaseDiagnosis archipelago-level systemic repair layer
```

## V1 does not include
```text
full trade ledger of every island
complete imperial administration tree
```

## V2 extension slots
```text
tradeLedgers: []
imperialAdministrationTree: []
routeTreaties: []
oldCustomsRecords: []
```

---

# Phase 16 — Island Role Generator

## V1 role
Assign all 30 islands their function in the historical machine of the archipelago.

## Inherits from
```text
ArchipelagoConvergencePackage
MacroGeographyPackage
LateWorldStatePackage
```

## V1 must generate
```text
IslandRolePackage
30 islandRole records
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

## Must influence downstream
```text
Phase 17 island histories
Phase 17.5 gameplay projection
Phase 20 settlement presence
DiseaseDiagnosis island disease role
```

## V1 does not include
```text
many micro-roles per island
full internal administrative history
```

## V2 extension slots
```text
microRoles: []
administrativeSubfunctions: []
seasonalRoleVariants: []
minorDependencyEdges: []
```

---

# Phase 17 — Island History Generator

## V1 role
Generate each island's historical trajectory and present contradiction.

## Inherits from
```text
IslandRolePackage
GlobalTragedyPackage
CollapseCascadePackage
PressureFieldPackage
neighboring island relations
local natural base
```

## V1 must generate
```text
IslandHistoryRecord[]
30 island history records
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

## V1 target density
```text
3 to 6 history beats per island
```

## Must influence downstream
```text
Phase 17.5 gameplay projection
Phase 18 natural evolution
Phase 20 settlements
Phase 23 building/prop narrative
Phase 24 NPC grounding
DiseaseDiagnosis evidence placement and friend objectives
```

## V1 does not include
```text
deep full timeline for every island
all families and minor local incidents
complete biographies of all historical residents
```

## V2 extension slots
```text
fullTimeline: []
familyHistories: []
minorIncidents: []
historicalResidentBiographies: []
localLegends: []
```

---

# Phase 17.5 — Archipelago Gameplay Projection Bridge

## V1 role
Translate historical convergence and island histories into gameplay-facing contracts.

## Inherits from
```text
ArchipelagoConvergencePackage
IslandRolePackage
IslandHistoryRecord[]
LateWorldStatePackage
current gdrclm/game runtime constraints
```

## V1 must generate
```text
ArchipelagoGameplayProjectionPackage
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

## V1 disease diagnosis projection must generate
```text
DiseaseTruthProfile
IslandDiagnosisProjectionRecord[]
FriendLetterProjection[]
EvidenceSlot[]
FalseCausalityProfile
DiagnosisEndingConditionMatrix
```

## Must influence downstream
```text
Phase 18 natural evolution
Phase 19 terrain transformation
Phase 20 settlements
Phase 21 social AI
Phase 22 spatial consequence
Phase 23 building/prop evidence carriers
Phase 24 NPC disease/social roles
Phase 25 playable world
```

## V1 does not include
```text
fully authored island quest scripts
manual detective cases for all islands
all optional narrative branches
```

## V2 extension slots
```text
optionalCaseBranches: []
secondaryEvidenceChains: []
alternateFriendLetterVersions: []
expandedFalseCausalityBranches: []
lateGameVariantEndings: []
```

---

# Phase 18 — Natural Evolution Generator

## V1 role
Make island nature remember exploitation, abandonment, collapse, and recovery.

## Inherits from
```text
IslandHistoryRecord[]
collapse age
population load
IslandGameplayProjectionRecord[]
```

## V1 must generate
```text
NaturalEvolutionPackage
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

## Must influence downstream
```text
Phase 19 terrain transformation
Phase 22 spatial zones
Phase 23 prop/building environmental traces
DiseaseDiagnosis natural/environmental disease carriers
```

## V1 does not include
```text
full ecological simulation
individual species succession
complete plant community timelines
```

## V2 extension slots
```text
speciesSuccession: []
plantCommunityTimeline: []
faunaMigrationRecords: []
detailedEcologicalRecovery: []
```

---

# Phase 19 — Terrain Transformation Generator

## V1 role
Turn historical ecology and collapse into terrain-ready forms and anchors.

## Inherits from
```text
NaturalEvolutionPackage
weather severity
erosion pressure
IslandGameplayProjectionRecord[]
```

## V1 must generate
```text
TerrainTransformationPackage
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

## Must influence downstream
```text
Phase 20 settlements
Phase 22 spatial consequence
Phase 25 tile/chunk realization
DiseaseDiagnosis route/survival conflict layer
```

## V1 does not include
```text
final tile placement
high-density terrain microfeatures
```

## V2 extension slots
```text
microTerrainFeatures: []
seasonalTerrainVariants: []
routeErosionHistory: []
```

---

# Phase 20 — Settlement Generator

## V1 role
Generate living and dead settlement structure from island history and collapse.

## Inherits from
```text
IslandHistoryRecord[]
NaturalEvolutionPackage
LateWorldStatePackage
IslandGameplayProjectionRecord[]
```

## V1 must generate
```text
SettlementGraphPackage
DistrictGraphPackage
LocalAuthorityPackage
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

## V1 target density
```text
0 to 3 settlement records per island
```

## Must influence downstream
```text
Phase 21 local social AI
Phase 22 spatial consequences
Phase 23 buildings/props
Phase 24 NPC roster
DiseaseDiagnosis social trust / access / repair layers
```

## V1 does not include
```text
full population list
all households
complete local economy simulation
```

## V2 extension slots
```text
households: []
populationRoster: []
localEconomyGraph: []
craftGuilds: []
minorSocialGroups: []
```

---

# Phase 21 — Social AI Generator

## V1 role
Give island societies active motives and internal tensions.

## Inherits from
```text
SettlementGraphPackage
LocalAuthorityPackage
MentalLandscapePackage
ReligiousLandscapePackage
local stress packages
IslandGameplayProjectionRecord[]
```

## V1 must generate
```text
LocalSocialAIStatePackage
localSocialAIStateId
islandIndex
factionGoalRefs
resourcePriorities
beliefMotivationRefs
pressureDrivenTensions
conflictTendencies
allianceTendencies
```

## Must influence downstream
```text
Phase 22 spatial consequence
Phase 23 building/prop ownership
Phase 24 NPC motives
DiseaseDiagnosis moral dilemmas and trust gates
```

## V1 does not include
```text
full autonomous NPC simulation
hour-by-hour schedules for all residents
complex multi-agent planning
```

## V2 extension slots
```text
agentPlans: []
hourlySchedules: []
negotiationState: []
longTermFactionStrategies: []
```

---

# Phase 22 — Spatial Consequence Generator

## V1 role
Translate settlement, social AI, terrain, and island history into meaningful zones.

## Inherits from
```text
SettlementGraphPackage
LocalSocialAIStatePackage
TerrainTransformationPackage
IslandGameplayProjectionRecord[]
```

## V1 must generate
```text
SpatialConsequencePackage
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

## Must influence downstream
```text
Phase 23 building/prop narrative
Phase 24 NPC placement context
Phase 25 playable realization
DiseaseDiagnosis location/evidence/access design
```

## V1 does not include
```text
exact final geometry
all micro-zones
```

## V2 extension slots
```text
microZones: []
exactGeometryHints: []
seasonalZoneShifts: []
forbiddenAccessSubzones: []
```

---

# Phase 23 — Building and Prop Narrative Generator

## V1 role
Generate buildings and props as readable evidence of history, labor, collapse, religion, economy, and disease.

## Inherits from
```text
SpatialConsequencePackage
IslandHistoryRecord[]
NaturalEvolutionPackage
social groups and faction ownership
DiseaseDiagnosisProjection
```

## V1 must generate
```text
BuildingNarrativePackage
PropNarrativePackage
buildingNarrativeId
propNarrativeId
islandIndex
originalFunction
currentFunction
factionLink
historyDamageState
repairHistoryState
symbolicValue
economicMeaning
religiousMeaning
laborTrace
collapseTrace
householdTrace
environmentalStorytellingAnchor
evidenceCarrierRole optional
```

## V1 target density
```text
key buildings only
key props only
evidence-facing props when needed
```

## Must influence downstream
```text
Phase 24 NPC links
Phase 25 interaction points / structure and prop placement
DiseaseDiagnosis evidence discovery
```

## V1 does not include
```text
all props in all houses
full object history for every item
```

## V2 extension slots
```text
allPropHistories: []
householdObjectSets: []
craftMarks: []
ownershipMarks: []
secondaryEvidenceThreads: []
```

---

# Phase 24 — Local NPC Generator

## V1 role
Generate gameplay-facing people as carriers of history, power, memory, taboo, disease truth, and social cost.

## Inherits from
```text
SettlementGraphPackage
LocalSocialAIStatePackage
BuildingNarrativePackage
PropNarrativePackage
migration and ownership history
PowerStructurePackage
DynastyPackage
CulturalMemoryPackage
DiseaseDiagnosisProjection
```

## V1 must generate
```text
LocalNPCRosterPackage
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

## V1 biography skeleton
```text
origin
socialFunction
woundOrNeed
secretOrBlindspot
relationshipToDisease
relationshipToIslandHistory
playerFacingFunction
```

## V1 target density
```text
1 to 5 key NPCs per important island
0 to 2 key NPCs per minor island
```

## Must influence downstream
```text
Phase 25 dialogue/interactions/placements
Phase 26 NPC grounding validation
DiseaseDiagnosis witness/lie/trust/moral price runtime
```

## V1 does not include
```text
full biography of every NPC
all secondary NPCs
complete family trees
all schedules and daily routines
full dialogue trees
```

## V2 extension slots
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

# Phase 25 — Final Realization Generator

## V1 role
Assemble the playable world package from all previous packages without inventing new upstream truth.

## Inherits from
```text
all previous packages
IslandGameplayProjectionRecord[]
DiseaseDiagnosisProjection
LocalNPCRosterPackage
BuildingNarrativePackage
SpatialConsequencePackage
TerrainTransformationPackage
```

## V1 must generate
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

## Must influence downstream
```text
runtime adapters
map/debug overlays
island progression runtime
interaction runtime
Phase 26 validation
```

## V1 does not include
```text
final polished art placement for every prop
complete authored level design per island
```

## V2 extension slots
```text
artDirectedPropOverrides: []
manualLevelDesignPatches: []
cinematicCompositionAnchors: []
```

---

# Phase 26 — Validation, Rebalance and Playability Pass

## V1 role
Validate that the generated world is causally coherent, readable, playable, diverse, and expandable.

## Inherits from
```text
all previous packages
PlayableWorldPackage
runtime constraints
```

## V1 must generate
```text
WorldValidationReport
PlayableWorldSnapshot
blockingReasons
warningCategories
partialRebalanceRecommendations
seedComparisonReports
```

## V1 must validate
```text
causal continuity
phase output presence
stable references
extension slot presence
Phase 0-2 visual proof readiness
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

## V1 does not include
```text
full playtest telemetry optimization
large-scale automatic content rewriting
```

## V2 extension slots
```text
telemetryDrivenRebalance: []
automaticNarrativePatchSuggestions: []
largeScalePartialRerollPolicies: []
```

---

# V1 Disease-Diagnosis Minimum

V1 must support the narrative survival-diagnosis experience.

Required systems:

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

Required guarantees:

```text
1. Every important island has a friend objective.
2. Every friend objective conflicts with survival, trust, route, inventory, time, morality, or access.
3. Each important island reveals one disease fragment.
4. No two neighboring important islands repeat the same dominant pattern.
5. Evidence supports triangulation through independent source groups.
6. False causality is possible but not arbitrary.
7. Endings depend on diagnosis, medicine, trust, and repair.
8. Disease evidence can be traced back to worldgen causes.
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

# V1 Causal Inheritance Summary

```text
Phase 0 creates the hidden laws.
Phase 1 turns them into geography.
Phase 2 turns geography into experienced pressure.
Phase 3 turns pressure into explanation models.
Phase 4 turns explanation into religion and taboo.
Phase 5 turns pressure/religion into social perception.
Phase 6 turns perception into norms.
Phase 7 turns geography/norms into civilizations.
Phase 8 turns civilizations into power structures.
Phase 9 turns power into dynasties and elites.
Phase 10 turns actors into strategic decisions.
Phase 11 turns decisions into historical eras.
Phase 12 turns history into memory and trauma.
Phase 13 turns accumulated causes into tragedy.
Phase 14 turns tragedy into collapse.
Phase 15 turns collapse into archipelago meaning.
Phase 16 turns archipelago meaning into island roles.
Phase 17 turns island roles into island histories.
Phase 17.5 turns histories into gameplay and diagnosis projections.
Phase 18 turns histories into natural traces.
Phase 19 turns natural traces into terrain anchors.
Phase 20 turns history/terrain into settlements.
Phase 21 turns settlements into social motives.
Phase 22 turns motives into spatial zones.
Phase 23 turns zones into buildings/props as evidence.
Phase 24 turns all of this into NPCs.
Phase 25 assembles playable world.
Phase 26 validates the whole causal chain.
```

---

# Final Rule

V1 is acceptable only if the whole chain is present and readable.

V1 is not required to contain all future depth.
V1 is required to preserve the architecture that will allow that depth to be added.

```text
V1 = complete causal skeleton + visual Phase 0-2 proof + playable diagnosis projection.
V2 = full density expansion on top of the V1 skeleton.
```
