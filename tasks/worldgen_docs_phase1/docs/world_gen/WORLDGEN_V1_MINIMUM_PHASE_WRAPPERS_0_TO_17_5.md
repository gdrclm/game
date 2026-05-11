# WORLDGEN V1 MINIMUM PHASE WRAPPERS 0 TO 17.5

## Status
Source-of-truth V1 implementation scope for minimum working generators from Phase 0 through Phase 17.5.

## Purpose

V1 must not wait until every phase is fully simulated before the project can test the worldgen idea.

Instead, every phase from Phase 0 to Phase 17.5 must exist as a minimum causal generator wrapper.

The goal is to make the full causal chain testable early:

```text
Phase 0 seed/profile
-> Phase 1 geography
-> Phase 2 pressure/rhythm
-> Phase 3-6 meaning/society
-> Phase 7-12 civilization/history/memory
-> Phase 13-14 tragedy/collapse
-> Phase 15-17 archipelago/islands/history
-> Phase 17.5 gameplay + disease diagnosis projection
```

V1 must already allow testing of a compressed 200-year prehistory and its influence on disease, island roles, friend objectives, evidence, survival conflict, and final diagnosis conditions.

---

# Core Rule

Each phase wrapper must do five things:

```text
1. consume official upstream package outputs;
2. generate a real minimum package, not a placeholder;
3. write stable ids and upstream/downstream references;
4. expose V2 extension slots;
5. be visible in debug/test output so its presence can be verified.
```

A phase wrapper is not enough if it only creates empty arrays or decorative text.

A phase wrapper is enough for V1 if it produces minimum causal records that downstream phases can read.

---

# V1 Minimum Historical Density

V1 must support a compressed historical depth of roughly 200 years.

Minimum target:

```text
3 historical eras
6 to 12 major historical events
2 to 4 civilizations or cultural-political blocs
2 to 4 religious/cultural lineages
2 to 5 power centers
2 to 5 dynasty / elite lines
30 island role records
30 island history records
1 gameplay projection record per island
1 disease diagnosis projection record for important islands
```

This is not full V2 history. But it is enough for testing causality.

---

# Wrapper Quality Levels

## Level 0 — Invalid for V1
```text
schema only
empty arrays
static dummy records
no upstream references
no downstream use
```

## Level 1 — Minimum valid V1 wrapper
```text
real seeded records
upstream references
summary causal logic
stable ids
V2 extension slots
validation
visible debug output
```

## Level 2 — V1+ optional
```text
more records
better weighting
richer summaries
more event branches
more validation diversity checks
```

V1 requires Level 1 for every phase from 0 to 17.5.

---

# Phase 0 — Master Seed Wrapper

## V1 minimum generator
Already deep / full V1 foundation.

## Must output
```text
WorldSeedProfile
DerivedWorldTendencies
WorldSubSeedMap
phase seed namespaces
visual/debug summary
```

## Debug visibility
```text
world profile panel
seed axis table
sub-seed export table
```

## V2 extension slots
```text
advancedPresetFamilies: []
worldModeVariants: []
longitudinalSeedMutations: []
```

---

# Phase 1 — Macro Geography Wrapper

## V1 minimum generator
Already deep / full V1 foundation with visual proof.

## Must output
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
```

## Debug visibility
```text
macro map
relief map
mountain overlay
river basin overlay
sea/corridor overlay
archipelago overlay
route/chokepoint overlay
seed comparison snapshots
```

## V2 extension slots
```text
detailedPlateMotion: []
subRegionalGeology: []
riverTributaryExpansion: []
coastalMicroErosion: []
```

---

# Phase 2 — Pressure and Rhythm Wrapper

## V1 minimum generator
Already deep / full V1 foundation with visual overlays.

## Must output
```text
PressureFieldPackage
EnvironmentalRhythmPackage
pressure profiles
rhythm profiles
record-bound pressure/rhythm summaries
```

## Debug visibility
```text
pressure heatmaps
route exposure overlays
isolation overlays
chokepoint pressure overlays
storm / seasonality / navigation rhythm overlays
```

## V2 extension slots
```text
fineLocalWeatherCells: []
seasonalMicroCalendar: []
disasterEventSeries: []
regionalRecoveryHistories: []
```

---

# Phase 3 — Proto-Cosmology Wrapper

## V1 minimum generator
Create one to four world explanation models from Phase 2 pressure/rhythm patterns.

## Consumes
```text
WorldSeedProfile
PressureFieldPackage
EnvironmentalRhythmPackage
```

## Must output
```text
ProtoCosmologyPackage
worldExplanationModelId
dominantCosmology
secondaryCosmology optional
orderVsChaos
cyclicalVsLinearTime
natureRelation
moralFaultModel
humanRoleModel
sacredCentralizationBias
sourcePressureRefs
sourceRhythmRefs
```

## Minimum generation logic
```text
high catastrophe + irregular rhythm -> chaotic/external-fate interpretation
high seasonality + recovery rhythm -> cyclical time interpretation
high isolation + harsh pressure -> local sacredness / bounded world model
high chokepoint/route pressure -> sacred route or gate logic
```

## Must influence
```text
Phase 4 religion
Phase 5 mental model
Phase 6 social norms
Disease false-cause candidates
```

## Debug visibility
```text
cosmology summary card
source pressure/rhythm references
explanation-model tags per cultural region
```

## V2 extension slots
```text
mythFragments: []
originMyths: []
cosmicGenealogies: []
regionalInterpretations: []
```

---

# Phase 4 — Religion Wrapper

## V1 minimum generator
Create two to four religious/cultural lineages that adapt to proto-cosmology, pressure, and geography.

## Consumes
```text
ProtoCosmologyPackage
PressureFieldPackage
EnvironmentalRhythmPackage
WorldSeedProfile
```

## Must output
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
sourceCosmologyRefs
```

## Minimum generation logic
```text
centralized sacredness + route chokepoints -> sacred centers / gate temples
high catastrophe -> ritual appeasement and purity rites
high isolation -> local cult persistence
high cultural permeability -> syncretic pressure
high route dependence -> pilgrim/trade ritual overlap
```

## Must influence
```text
Phase 5 mental models
Phase 6 social norms
Phase 8 power structures
Phase 10 strategic decisions
Phase 12 memory
Disease ritual/taboo obstruction layer
```

## Debug visibility
```text
religion lineage cards
sacred center references
ritual/taboo table
religious pressure map optional
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

# Phase 5 — Mental Model Wrapper

## V1 minimum generator
Generate one dominant mental model and optional secondary mental model per cultural-political region.

## Consumes
```text
PressureFieldPackage
ReligiousLandscapePackage
ReligiousInstitutionPackage
WorldSeedProfile
```

## Must output
```text
MentalLandscapePackage
mentalModelId
regionRef
survivalLogic
conflictResolutionBias
outsiderPerception
timeHorizon
riskProcessing
authorityPreference
adaptationPattern
cohesion
volatility
sourcePressureRefs
sourceReligionRefs
```

## Minimum generation logic
```text
high isolation -> outsider suspicion
high route fragility -> cautious risk processing
high catastrophe -> short time horizon or ritual fatalism
strong priestly structure -> authority preference
high recovery rhythm -> patient/adaptive survival logic
```

## Must influence
```text
Phase 6 norms
Phase 7 civilizations
Phase 10 decisions
Phase 12 drift
Phase 21 social AI
Phase 24 NPC behavior skeletons
```

## Debug visibility
```text
mental model matrix
region-to-model mapping
source refs from pressure/religion
```

## V2 extension slots
```text
regionalVariants: []
classVariants: []
generationalShifts: []
characterPsychologySeeds: []
```

---

# Phase 6 — Social Norms Wrapper

## V1 minimum generator
Generate social norm packages that make later power, marriage, inheritance, taboo, and access logic possible.

## Consumes
```text
MentalLandscapePackage
ReligiousLandscapePackage
ProtoCosmologyPackage
```

## Must output
```text
SocialNormsPackage
normId
regionRef
marriageNormType
inheritanceNormType
violenceLegitimacy
outsiderHandling
propertyNorms
honorPrestigeHierarchy
dutyShameStructure
tabooBehaviors
sourceMentalModelRefs
sourceReligionRefs
```

## Minimum generation logic
```text
strong authority preference -> strict inheritance / elder control
outsider suspicion -> closed access norms
ritual purity -> storage/body/medicine taboos
route dependence -> guest/trader rules
high conflict pressure -> violence legitimacy increases
```

## Must influence
```text
Phase 7 civilization structures
Phase 8 power nodes
Phase 9 dynastic constraints
Phase 10 decisions
Phase 20 settlements
Phase 21 social AI
Disease trust/access/moral cost layer
```

## Debug visibility
```text
norm table by region
access/taboo tags
marriage/inheritance summary
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

# Phase 7 — Civilization Emergence Wrapper

## V1 minimum generator
Generate two to four civilizations or cultural-political blocs as outputs of geography, pressure, mental models, and norms.

## Consumes
```text
MacroGeographyPackage
PressureFieldPackage
EnvironmentalRhythmPackage
MentalLandscapePackage
SocialNormsPackage
```

## Must output
```text
CivilizationSeedPackage
PopulationBehaviorPackage
civilizationId
homeRegionRefs
culturalRegionRefs
polityType
settlementViabilityRefs
maritimeDependence
expansionBias
survivalBias
sourceGeographyRefs
sourceNormRefs
```

## Minimum generation logic
```text
coastal opportunity + maritime dependence -> maritime polity / trade republic
harsh isolated interior -> clan/confederacy or frontier bloc
high route centrality -> trade corridor civilization
resource stress + strong norms -> defensive/cohesive society
```

## Must influence
```text
Phase 8 power structures
Phase 9 dynasties/elites
Phase 10 decisions
Phase 11 history
Phase 15 archipelago role
Phase 24 NPC ancestry context
```

## Debug visibility
```text
civilization map overlay
civilization cards
source geography/norm references
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

# Phase 8 — Power Structure Wrapper

## V1 minimum generator
Generate two to five power centers and their legitimacy/control domains.

## Consumes
```text
CivilizationSeedPackage
SocialNormsPackage
ReligiousInstitutionPackage
MentalLandscapePackage
```

## Must output
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
sourceCivilizationRef
sourceReligionRef
sourceNormRef
```

## Minimum generation logic
```text
religious legitimacy + sacred center -> priestly power node
maritime trade civilization -> merchant/trade power node
high conflict pressure -> military node
strict inheritance norms -> dynastic/aristocratic node
high local autonomy -> fragmented frontier power
```

## Must influence
```text
Phase 9 dynasties/elites
Phase 10 decisions
Phase 13 tragedy power drivers
Phase 20 local authority
Phase 24 NPC grounding
Disease political concealment layer
```

## Debug visibility
```text
power graph
node influence table
conflict/support edges
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

# Phase 9 — Dynasty and Elite Wrapper

## V1 minimum generator
Generate two to five dynasty/elite lines as carriers of long-term decisions and local inheritance.

## Consumes
```text
PowerStructurePackage
CivilizationSeedPackage
WorldSeedProfile
SocialNormsPackage
```

## Must output
```text
DynastyPackage
ElitePackage
RulerRosterPackage
dynastyId
eliteId
lineageId
civilizationId
powerNodeRefs
legitimacyBasis
inheritanceVulnerability
marriageStrategy
successionRisk
eliteConflictPressure
sourceNormRefs
```

## Minimum generation logic
```text
strict inheritance + high dynasty pressure -> strong dynasty line with succession risk
merchant power -> elite trade house
religious legitimacy -> priestly lineage
route control -> customs/harbor elite
```

## Must influence
```text
Phase 10 strategic decisions
Phase 11 succession/trade/war events
Phase 12 elite memory
Phase 13 tragedy drivers
Phase 17 island ownership layers
Phase 24 NPC lineage refs
```

## Debug visibility
```text
dynasty/elite cards
lineage summary table
power-node references
```

## V1 explicitly does not generate
```text
all marriages
full genealogy
all births/deaths
all ruler biographies
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

# Phase 10 — Strategic Decision Wrapper

## V1 minimum generator
Generate a compact set of strategic decisions that seed 200-year history.

## Consumes
```text
CivilizationSeedPackage
PowerStructurePackage
DynastyPackage
ElitePackage
MentalLandscapePackage
ReligiousLandscapePackage
PressureFieldPackage
MacroGeographyPackage
```

## Must output
```text
DecisionTracePackage
6 to 12 decision records
decisionId
actorRef
decisionType
inputPressures
expectedGain
expectedRisk
chosenAction
rejectedActions
consequenceSeedRefs
sourcePowerRefs
sourceGeographyRefs
```

## Minimum decision types
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

## Minimum generation logic
```text
actors choose from weighted utility scores
major adversarial decisions may include a simplified conflict score
catastrophic decisions may include simplified uncertainty score
```

## Must influence
```text
Phase 11 eras
Phase 12 memory
Phase 13 tragedy trigger chains
Phase 14 collapse
Phase 15 archipelago role
Disease economic/political/infrastructure layers
```

## Debug visibility
```text
decision trace table
actor -> decision -> consequence links
rejected option summaries
```

## V1 explicitly does not generate
```text
full minimax traces
full expectimax traces
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

# Phase 11 — Era Simulation Wrapper

## V1 minimum generator
Generate a compressed 200-year historical arc from strategic decisions.

## Consumes
```text
all previous world/society/power/decision packages
DecisionTracePackage
```

## Must output
```text
EpochPackage
HistoricalEventLog
3 historical eras
6 to 12 major events minimum
up to 20 major events allowed
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

## Minimum generation logic
```text
Era 1: expansion / foundation / route formation
Era 2: tension / war / reform / monopoly hardening
Era 3: late instability / failed correction / tragedy setup
```

## Must influence
```text
Phase 12 memory/trauma
Phase 13 global tragedy
Phase 15 archipelago role
Phase 17 island histories
Disease root chain
```

## Debug visibility
```text
200-year timeline summary
major event graph
epoch cards
cause-effect event links
```

## V1 explicitly does not generate
```text
full yearly timeline
hundreds of minor incidents
all marriages across generations
complete campaign maps
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

# Phase 12 — Memory, Trauma and Drift Wrapper

## V1 minimum generator
Persist the compressed history into memories, grievances, taboos, identity hardening, and cultural drift.

## Consumes
```text
HistoricalEventLog
MentalLandscapePackage
ReligiousLandscapePackage
PopulationBehaviorPackage
```

## Must output
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

## Minimum generation logic
```text
war/famine/route failure -> trauma nodes
religious suppression/reform -> taboo hardening or schism memory
monopoly abuse -> grievance structures
failed medical/reform action -> silence, shame, or distrust
```

## Must influence
```text
Phase 13 tragedy meaning
Phase 14 collapse response
Phase 17 island contradiction
Phase 21 social AI
Phase 24 NPC wound/secret/blindspot
Disease trust/false-cause layer
```

## Debug visibility
```text
memory graph
trauma map/table
source event -> memory -> downstream effect links
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

# Phase 13 — Global Tragedy Wrapper

## V1 minimum generator
Derive the main tragedy from accumulated history, decisions, memory, power, geography, and pressure.

## Consumes
```text
HistoricalEventLog
CulturalMemoryPackage
MacroGeographyPackage
DecisionTracePackage
PowerStructurePackage
DynastyPackage
ReligiousLandscapePackage
PressureFieldPackage
```

## Must output
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

## Minimum generation logic
```text
choose tragedy from strongest accumulated driver cluster
must reference at least one geography/route driver
must reference at least one power/decision driver
must reference at least one memory/religion/social driver
```

## Must influence
```text
Phase 14 collapse cascade
Phase 15 archipelago role
Phase 17 island histories
Disease root/systemic cause
```

## Debug visibility
```text
tragedy cause chain diagram
root drivers table
why-this-tragedy summary
```

## V1 explicitly does not generate
```text
all tragedy sub-events
full local tragedy variants for every region
```

## V2 extension slots
```text
regionalTragedyVariants: []
subEvents: []
failedPreventionAttempts: []
propagandaVersions: []
```

---

# Phase 14 — Collapse Cascade Wrapper

## V1 minimum generator
Translate the global tragedy into structural breakdown.

## Consumes
```text
GlobalTragedyPackage
HistoricalEventLog
PowerStructurePackage
CivilizationSeedPackage
MacroGeographyPackage
PressureFieldPackage
```

## Must output
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

## Minimum generation logic
```text
tragedy breaks routes, institutions, specialists, ports, settlement cohesion
collapse severity follows pressure/rhythm and power fragility
archipelago consequence seeds are produced for Phase 15
```

## Must influence
```text
Phase 15 archipelago role
Phase 16 island roles
Phase 17 island histories
Disease medicine/access/repair layers
```

## Debug visibility
```text
collapse cascade graph
route-loss table
specialist/port/institution loss summary
```

## V1 explicitly does not generate
```text
complete collapse timeline for every settlement
all local violence incidents
population attrition curves
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

# Phase 15 — Archipelago Role Wrapper

## V1 minimum generator
Determine what the archipelago was in the old system and what scar it became after collapse.

## Consumes
```text
MacroGeographyPackage
HistoricalEventLog
CollapseCascadePackage
GlobalTragedyPackage
DecisionTracePackage
```

## Must output
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

## Minimum generation logic
```text
archipelago role must derive from macro routes, collapse effects, and historical decisions
final island pressure gradient must be explicit
old-system role must explain why 30 islands are connected historically
```

## Must influence
```text
Phase 16 island roles
Phase 17 island histories
Phase 17.5 gameplay projection
Disease archipelago/systemic repair layer
```

## Debug visibility
```text
archipelago role card
old-system network diagram
pressure gradient toward final island
```

## V1 explicitly does not generate
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

# Phase 16 — Island Role Wrapper

## V1 minimum generator
Assign all 30 islands their functional roles in the archipelago.

## Consumes
```text
ArchipelagoConvergencePackage
MacroGeographyPackage
LateWorldStatePackage
CollapseCascadePackage
```

## Must output
```text
IslandRolePackage
30 IslandRole records
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

## Minimum generation logic
```text
each island gets one dominant function
optional secondary function
roles must follow archipelago network and pressure gradient
neighbor dependencies must create a readable 30-island chain
```

## Must influence
```text
Phase 17 island histories
Phase 17.5 gameplay projection
Disease island role assignments
```

## Debug visibility
```text
30-island role table
archipelago route/role map
neighbor dependency graph
```

## V1 explicitly does not generate
```text
many micro-roles per island
full internal administrative detail
```

## V2 extension slots
```text
microRoles: []
administrativeSubfunctions: []
seasonalRoleVariants: []
minorDependencyEdges: []
```

---

# Phase 17 — Island History Wrapper

## V1 minimum generator
Generate a compressed history for every island.

## Consumes
```text
IslandRolePackage
GlobalTragedyPackage
CollapseCascadePackage
PressureFieldPackage
ReligiousLandscapePackage
MentalLandscapePackage
SocialNormsPackage
neighboring island relations
```

## Must output
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

## Minimum generation logic
```text
each island receives 3 to 6 history beats
at least one beat must reference old function
at least one beat must reference collapse/tragedy
at least one beat must create present contradiction
important islands must expose possible disease/evidence hooks
```

## Must influence
```text
Phase 17.5 gameplay projection
DiseaseDiagnosisProjection
Phase 18 natural evolution
Phase 20 settlement state
Phase 23 building/prop evidence
Phase 24 NPC grounding
```

## Debug visibility
```text
30 island history table
per-island history card
island contradiction list
source references from earlier phases
```

## V1 explicitly does not generate
```text
full timeline for every island
all families and minor local incidents
complete historical resident biographies
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

# Phase 17.5 — Gameplay and Disease Diagnosis Projection Wrapper

## V1 minimum generator
Translate archipelago/island history into playable island progression and survival-diagnosis structure.

## Consumes
```text
ArchipelagoConvergencePackage
IslandRolePackage
IslandHistoryRecord[]
LateWorldStatePackage
PressureFieldPackage
EnvironmentalRhythmPackage
current gdrclm/game runtime constraints
```

## Must output
```text
ArchipelagoGameplayProjectionPackage
IslandGameplayProjectionRecord[]
DiseaseTruthProfile
IslandDiagnosisProjectionRecord[]
FriendLetterProjection[]
EvidenceSlot[]
FalseCausalityProfile
DiagnosisEndingConditionMatrix
```

## Minimum generation logic
```text
each island receives gameplay role metadata
important islands receive diagnosis roles
each important island receives friend objective
each friend objective must conflict with survival/trust/route/inventory/time/morality/access
disease chain must reference geography, infrastructure, economy/politics/culture, medicine, and repair
evidence must support triangulation through independent groups
false causality must be plausible but not random
```

## Must influence
```text
Phase 18-24 downstream realization
Phase 25 playable world assembly
Phase 26 validation
runtime quest/interaction/dialogue planning
```

## Debug visibility
```text
island gameplay projection table
island diagnosis projection table
friend letter list
evidence graph
false causality graph
ending condition matrix
anti-repetition report
```

## V1 explicitly does not generate
```text
fully authored island quest scripts
manual detective cases for all islands
all optional narrative branches
full dialogue trees
```

## V2 extension slots
```text
optionalCaseBranches: []
secondaryEvidenceChains: []
alternateFriendLetterVersions: []
expandedFalseCausalityBranches: []
lateGameVariantEndings: []
advancedHypothesisGraph: []
```

---

# Minimum Chain Test For V1

A V1 test run must be able to show this chain for at least three seeds:

```text
Seed profile
-> visible geography
-> environmental pressure/rhythm
-> society explanation models
-> religion/taboo
-> mental/social norms
-> civilizations/power/dynasties
-> strategic decisions
-> 200-year compressed history
-> memory/trauma
-> global tragedy
-> collapse
-> archipelago role
-> 30 island roles
-> 30 island histories
-> gameplay progression
-> disease diagnosis projection
```

If this chain is not visible in debug output, V1 is not ready.

---

# V1 Acceptance Criteria For Phase 0-17.5

```text
[ ] Every phase from 0 to 17.5 has a real generator wrapper.
[ ] No phase from 3 to 17.5 is only schema/stub.
[ ] Every wrapper produces stable ids.
[ ] Every wrapper writes upstreamRefs and downstreamRefs.
[ ] Every wrapper has V2 extension slots.
[ ] Phase 11 produces a compressed 200-year historical arc.
[ ] Phase 13 tragedy references accumulated upstream causes.
[ ] Phase 15 archipelago role derives from history/collapse/geography.
[ ] Phase 16 creates 30 island roles.
[ ] Phase 17 creates 30 island histories.
[ ] Phase 17.5 creates gameplay and disease diagnosis projection.
[ ] Debug output can prove the full causal chain exists.
```

---

# Final Statement

V1 is not a collection of completed early phases plus missing later phases.

V1 is a minimum working causal world machine from Phase 0 to Phase 17.5.

```text
Every phase exists.
Every phase derives from previous causes.
Every phase leaves references for the next phase.
Every deferred future feature has an extension slot.
The 200-year prehistory already exists in compressed form.
The disease diagnosis already derives from that compressed history.
```
