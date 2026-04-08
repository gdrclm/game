# Phase Map Document
## World Generation Program — Official Phase Map

**Repository:** `gdrclm/game`  
**Status:** Source-of-truth document for world generation phase structure  
**Audience:** design, engineering, Codex implementation passes  
**Scope:** end-to-end phase map from master seed to final playable world

---

# 1. Purpose

This document defines the **official phase structure** of the world generation program.

Its purpose is to make the generation stack:

- causally coherent;
- modular;
- deterministic by seed;
- safe for incremental implementation through Codex;
- resistant to architectural drift and hallucinated subsystems.

This document is not a task backlog and not a low-level implementation spec.  
It is the **top-level map of the generation pipeline** and the contract between major systems.

This document must stay aligned with:

- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`

If any of those governing documents change, this phase map must be revised accordingly.

---

# 2. Core principle

The world must be generated as a **causal stack**, not as disconnected content layers.

The required order is:

```text
Seed
→ master seed profile
→ macro geography
→ environmental pressures
→ environmental rhythms
→ proto-cosmology
→ religion
→ mental models
→ social norms
→ civilizations
→ power structures
→ dynasties and elites
→ strategic decisions
→ historical events
→ memory / trauma / drift
→ global tragedy
→ collapse cascade
→ archipelago role
→ island roles
→ island histories
→ archipelago gameplay projection bridge
→ natural evolution
→ terrain transformation
→ settlements
→ social AI
→ spatial consequences
→ buildings / props
→ local NPC
→ final realization
→ validation / rebalance
```

No lower phase is allowed to invent upstream history arbitrarily.  
No late phase is allowed to silently overwrite frozen upstream causes.

---

# 3. Global architecture layers

The full program is divided into 6 macro-layers:

## Layer A — World Foundations
Creates the deep structure of the world:
- base seed
- world seed profile
- derived world tendencies
- deterministic sub-seed namespaces
- macro geography
- climate / route logic
- environmental pressures

## Layer B — Meaning and Society
Creates how societies interpret and organize life:
- proto-cosmology
- religion
- mental models
- social norms

## Layer C — History and Power
Creates agents and long-term history:
- civilizations
- power structures
- dynasties
- strategic decisions
- eras
- memory / drift / trauma

## Layer D — Archipelago Convergence
Transforms the global history into the archipelago and 30 islands:
- global tragedy
- collapse cascade
- archipelago role
- island roles
- island histories

## Layer E — Gameplay Projection Bridge
Projects large historical outputs into **gameplay-facing island progression contracts**:
- island progression hints
- difficulty bands
- scenario biases
- layout hints
- expedition-facing metadata
- adapter-ready archipelago summaries

## Layer F — Playable World Realization
Turns history and gameplay projection into playable content:
- natural evolution
- terrain
- settlements
- social AI
- spatial consequences
- buildings / props
- NPC
- final playable world

---

# 4. Official phase list

## PHASE 0 — MASTER SEED GENERATOR

### Purpose
Generate the **genetic profile** of the world run.

### Generates
- `worldSeed`
- `WorldSeedProfile`
- `DerivedWorldTendencies`
- `WorldSubSeedMap`
- validation-facing expressiveness and archipelago-potential context

### Inputs
- base random seed
- optional preset world mode
- optional hard constraints profile

### Outputs
- `WorldSeedProfile`
- `DerivedWorldTendencies`
- `WorldSubSeedMap`

### Notes
This phase does not generate geography, cultures, religions, states, islands, settlements, or NPCs.  
It generates the hidden laws, biases, and deterministic phase namespaces of the world instance.

This phase is governed by `00_master_seed_generator.md`.  
Its outputs are immutable after Freeze Point A.

---

## PHASE 1 — MACRO GEOGRAPHY GENERATOR

### Purpose
Generate macro geography as **historical and political possibility space**.

### Generates
- continents
- sea regions
- climate bands
- maritime corridors
- chokepoints
- archipelago macro-region
- coastal opportunity fields
- isolated regions
- strategic cores and fragile peripheries

### Inputs
- `WorldSeedProfile`
- `DerivedWorldTendencies`
- `WorldSubSeedMap.macroGeographySeed`

### Outputs
- `MacroGeographyPackage`

### Internal sub-systems
- tectonic skeleton
- marine carving
- climate pressure
- continental cohesion
- coastal opportunity
- graph connectivity
- chokepoint analysis
- archipelago significance
- macro validation / rebalance

### Notes
This is not cosmetic geography.  
It must already encode the future possibility of empire, trade, isolation, coalition, and collapse.

---

## PHASE 2 — PRESSURE & ENVIRONMENTAL RHYTHM GENERATOR

### Purpose
Translate macro geography into **experienced environmental pressure**.

### Generates
- climate hostility
- resource stress
- route exposure
- chokepoint tension
- ecological stability / instability
- isolation pressure
- catastrophe frequency
- seasonal predictability
- perceived rhythm of the world

### Inputs
- `MacroGeographyPackage`
- `WorldSeedProfile`

### Outputs
- `PressureFieldPackage`
- `EnvironmentalRhythmPackage`

### Notes
This phase defines how the world feels to societies before ideology exists.

---

## PHASE 3 — PROTO-COSMOLOGY GENERATOR

### Purpose
Generate the first layer of **world explanation models**.

### Generates
- ordered vs chaotic world assumptions
- cyclical vs linear time assumptions
- domination vs coexistence with nature
- moral-fault vs external-fate interpretations
- heroic vs collective human role
- centralized vs distributed sacredness

### Inputs
- `PressureFieldPackage`
- `EnvironmentalRhythmPackage`
- `WorldSeedProfile`

### Outputs
- `ProtoCosmologyPackage`

### Notes
This is not formal religion yet.  
It is the conceptual soil from which religion grows.

---

## PHASE 4 — RELIGIOUS-COSMOLOGICAL FORMATION GENERATOR

### Purpose
Generate religions as **adaptive systems of explanation, cohesion, and legitimacy**.

### Generates
- dominant religious archetypes
- competing doctrines
- priestly structures
- sacred centers
- ritual systems
- schisms
- reforms
- syncretic blends
- legitimacy channels

### Inputs
- `ProtoCosmologyPackage`
- `PressureFieldPackage`
- `EnvironmentalRhythmPackage`
- `WorldSeedProfile`

### Outputs
- `ReligiousLandscapePackage`
- `ReligiousInstitutionPackage`

### Notes
Religion must be generated through utility, fit, competition, and historical reinforcement.  
It must not be chosen as a random flavor tag.

---

## PHASE 5 — MENTAL MODEL GENERATOR

### Purpose
Generate how societies **perceive survival, conflict, outsiders, and time**.

### Generates
Mental axes:
- survival logic
- conflict resolution
- world view
- time horizon
- risk processing
- outsider perception
- authority preference
- adaptation pattern

Also generates:
- dominant mental archetype
- secondary mental archetype
- cohesion
- volatility

### Inputs
- `PressureFieldPackage`
- `ReligiousLandscapePackage`
- `ReligiousInstitutionPackage`
- `WorldSeedProfile`

### Outputs
- `MentalLandscapePackage`

### Notes
Mental models must be derived from environment + religion + memory.  
They must not be flat stat presets.

---

## PHASE 6 — SOCIAL NORMS & CULTURAL FORMATION GENERATOR

### Purpose
Generate the **normative rules** of societies.

### Generates
- marriage norms
- inheritance norms
- legitimacy of violence
- outsider handling norms
- property norms
- honor / prestige hierarchy
- duty and shame structures
- tolerated hierarchy forms
- sacred and taboo behaviors

### Inputs
- `MentalLandscapePackage`
- `ReligiousLandscapePackage`
- `ProtoCosmologyPackage`

### Outputs
- `SocialNormsPackage`

### Notes
This phase defines what institutions are socially possible or impossible.

---

## PHASE 7 — CIVILIZATION EMERGENCE GENERATOR

### Purpose
Generate civilizations as **emergent social formations**, not preset nations.

### Generates
- population clusters
- cultural regions
- proto-states
- maritime polities
- chiefdoms
- confederacies
- trade republic patterns
- settlement viability regions
- expansion and survival biases

### Inputs
- `MacroGeographyPackage`
- `PressureFieldPackage`
- `EnvironmentalRhythmPackage`
- `MentalLandscapePackage`
- `SocialNormsPackage`

### Outputs
- `CivilizationSeedPackage`
- `PopulationBehaviorPackage`

### Notes
States must be outputs of geography, meaning, norms, and survival pressures.

---

## PHASE 8 — POWER STRUCTURE GENERATOR

### Purpose
Generate the internal structure of power in each civilization.

### Generates
- military power nodes
- priestly power nodes
- trade power nodes
- clan / aristocratic nodes
- bureaucratic nodes
- local autonomy nodes
- frontier strongmen
- legitimacy profiles

### Inputs
- `CivilizationSeedPackage`
- `SocialNormsPackage`
- `ReligiousInstitutionPackage`
- `MentalLandscapePackage`

### Outputs
- `PowerStructurePackage`

### Notes
Power is not equivalent to a government label.  
It is a graph of controlling actors and institutions.

---

## PHASE 9 — DYNASTY & ELITE GENERATOR

### Purpose
Generate ruling houses, elite families, and world-shaping figures.

### Generates
- dynasties
- cadet branches
- inheritance vulnerability
- marriage strategies
- elite clusters
- ruler archetypes
- religious elites
- merchant elites
- military elites

### Inputs
- `PowerStructurePackage`
- `CivilizationSeedPackage`
- `WorldSeedProfile`

### Outputs
- `DynastyPackage`
- `ElitePackage`
- `RulerRosterPackage`

### Notes
History must have carriers of will, not only anonymous state statistics.

---

## PHASE 10 — STRATEGIC DECISION GENERATOR

### Purpose
Generate decisions as actions of states, dynasties, elites, and blocs.

### Generates decision tendencies for:
- expansion
- fortification
- marriage
- reform
- trade
- suppression
- colonization
- alliance
- war
- route control
- cult sponsorship
- regional abandonment

### Inputs
- `CivilizationSeedPackage`
- `PowerStructurePackage`
- `DynastyPackage`
- `MentalLandscapePackage`
- `ReligiousLandscapePackage`

### Outputs
- `DecisionTracePackage`

### Notes
Use:
- weighted utility scoring by default;
- minimax-like adversarial lookahead for major conflicts;
- expectimax-like handling for uncertain catastrophic contexts.

---

## PHASE 11 — ERA SIMULATION GENERATOR

### Purpose
Simulate 300–400 years of world history in epochs.

### Generates
Epoch-scale history through repeated cycles of:
- diplomacy
- marriage
- trade
- war
- reform
- colonization
- succession crises
- migration
- route shifts

### Inputs
- all previous world and society packages

### Outputs
- `EpochPackage`
- `HistoricalEventLog`

### Notes
History must be produced as large waves, not only as a list of disconnected incidents.

---

## PHASE 12 — MEMORY, TRAUMA & CULTURAL DRIFT GENERATOR

### Purpose
Persist history into minds, myths, and social dispositions.

### Generates
- regional memory
- elite memory
- civilizational memory
- trauma zones
- grievance structures
- golden age memory
- reform memory
- cultural drift
- identity hardening / softening

### Inputs
- `HistoricalEventLog`
- `MentalLandscapePackage`
- `ReligiousLandscapePackage`
- `PopulationBehaviorPackage`

### Outputs
- `CulturalMemoryPackage`
- `TraumaMap`
- `CulturalDriftPackage`

### Notes
Without this phase, history disappears after it happens.

---

## PHASE 13 — GLOBAL TRAGEDY GENERATOR

### Purpose
Derive the main tragedy that breaks the old order.

### Generates
- main tragedy type
- trigger chain
- principal structural break
- consequences for the archipelago
- final historical meaning of the late-world collapse

### Inputs
- `HistoricalEventLog`
- `CulturalMemoryPackage`
- `MacroGeographyPackage`
- late-route and war states

### Outputs
- `GlobalTragedyPackage`
- `TriggerChainPackage`

### Notes
The main tragedy must be a logical consequence of accumulated world conditions, not a random narrative preset.

---

## PHASE 14 — COLLAPSE CASCADE GENERATOR

### Purpose
Simulate the breakdown after the global tragedy.

### Generates
- route collapse
- loss of specialists
- port abandonment
- frontier hardening
- settlement fragmentation
- local violence
- institutional hollowing
- decaying peripheries
- late-world pressure map

### Inputs
- `GlobalTragedyPackage`
- `HistoricalEventLog`
- `PowerStructurePackage`
- `CivilizationSeedPackage`

### Outputs
- `CollapseCascadePackage`
- `LateWorldStatePackage`

### Notes
This phase turns a large historical world into the dying structure that can converge into the archipelago.

---

## PHASE 15 — ARCHIPELAGO ROLE GENERATOR

### Purpose
Determine what the archipelago meant in the history of the world.

### Generates
- role of the archipelago in old systems
- strategic significance
- dependence network
- relation to former empires
- route centrality
- pressure gradient toward the final island

### Inputs
- `MacroGeographyPackage`
- `HistoricalEventLog`
- `CollapseCascadePackage`
- `GlobalTragedyPackage`

### Outputs
- `ArchipelagoConvergencePackage`

### Notes
The archipelago must never be an afterthought.  
It must be a meaningful scar of the larger world.

---

## PHASE 16 — ISLAND ROLE GENERATOR

### Purpose
Assign the 30 islands their functional roles in the archipelago.

### Generates examples such as:
- outer refuge
- timber supplier
- fishing colony
- repair harbor
- dynastic holding
- military waypoint
- collapsed market island
- exile island
- former customs island
- near-core fragment
- pre-final fracture node
- final heart island

### Inputs
- `ArchipelagoConvergencePackage`
- `MacroGeographyPackage`
- `LateWorldStatePackage`

### Outputs
- `IslandRolePackage`

### Notes
Each island must begin as a function in a larger historical machine.

---

## PHASE 17 — ISLAND HISTORY GENERATOR

### Purpose
Generate each island's historical trajectory.

### Generates
- founding cause
- ownership layers
- migrations
- faith shifts
- mental shifts
- periods of growth
- local crises
- reasons for decline
- present contradiction

### Inputs
- `IslandRolePackage`
- `GlobalTragedyPackage`
- `PressureFieldPackage`
- neighboring island relations
- local natural base

### Outputs
- `IslandHistoryRecord[]`

### Notes
Island history must be assembled from rule libraries, event dependencies, and global context.  
It must not be handcrafted or randomly themed.

---

## PHASE 17.5 — ARCHIPELAGO GAMEPLAY PROJECTION BRIDGE

### Purpose
Project global and island history into **gameplay-facing island progression contracts** for the current game architecture.

### Generates
- island progression profiles
- expedition-facing difficulty bands
- travel pressure bands
- settlement presence hints
- merchant / refuge / hazard likelihood bands
- layout bias hints
- scenario bias hints
- map narrative summaries
- bridge-ready metadata for existing island progression and layout systems

### Inputs
- `ArchipelagoConvergencePackage`
- `IslandRolePackage`
- `IslandHistoryRecord[]`
- `LateWorldStatePackage`
- current runtime/gameplay constraints of `gdrclm/game`

### Outputs
- `ArchipelagoGameplayProjectionPackage`
- `IslandGameplayProjectionRecord[]`

### Notes
This phase is a **bridge**, not a replacement for local realization phases.
It exists so that large historical causality can be translated into the current expedition runtime without forcing late phases to invent upstream logic.

It is the official handoff between:
- world history and convergence layers;
- 30-island gameplay progression;
- future local realization phases;
- existing runtime adapters such as progression, layout, and map/debug layers.

---

## PHASE 18 — NATURAL EVOLUTION GENERATOR

### Purpose
Make island nature historical.

### Generates
- traces of exploitation
- rewilding
- logging scars
- abandoned fields
- marsh expansion
- coastal collapse
- reclaimed ruins
- exhausted or recovering natural systems

### Inputs
- `IslandHistoryRecord[]`
- natural seeds
- collapse age
- population load
- `IslandGameplayProjectionRecord[]`

### Outputs
- `NaturalEvolutionPackage`

### Notes
Nature must remember people.

---

## PHASE 19 — TERRAIN TRANSFORMATION GENERATOR

### Purpose
Turn natural evolution into terrain-ready forms.

### Generates
- rock outcrops
- scree and collapse fields
- shrub masses
- field remnants
- tree distributions
- shore deformation
- old roads
- drowned or overgrown paths
- terrain anchor zones

### Inputs
- `NaturalEvolutionPackage`
- weather severity
- erosion pressure
- `IslandGameplayProjectionRecord[]`

### Outputs
- `TerrainTransformationPackage`

### Notes
This is the bridge from historical ecology to spatial realization.

---

## PHASE 20 — SETTLEMENT GENERATOR

### Purpose
Generate living and dead island settlements.

### Generates
- surviving settlements
- collapsed settlements
- district fragmentation
- current centers
- dead centers
- authority layout
- social groups
- district roles

### Inputs
- `IslandHistoryRecord[]`
- `NaturalEvolutionPackage`
- `LateWorldStatePackage`
- `IslandGameplayProjectionRecord[]`

### Outputs
- `SettlementGraphPackage`
- `DistrictGraphPackage`
- `LocalAuthorityPackage`

### Notes
Settlement structure must reflect both survival and collapse.

---

## PHASE 21 — SOCIAL AI GENERATOR

### Purpose
Give island societies active motives and internal tension.

### Generates
- faction goals
- local strategic intents
- resource priorities
- belief-based motivations
- pressure-driven tensions
- conflict tendencies
- alliance tendencies

### Inputs
- `SettlementGraphPackage`
- `LocalAuthorityPackage`
- `MentalLandscapePackage`
- `ReligiousLandscapePackage`
- local stress packages

### Outputs
- `LocalSocialAIStatePackage`

### Notes
This phase is where local communities stop being static lore and become active social systems.

---

## PHASE 22 — SPATIAL CONSEQUENCE GENERATOR

### Purpose
Translate history and social AI into spatially meaningful zones.

### Generates
- old and new centers
- alive zones
- dead zones
- contested zones
- sacred zones
- route zones
- work zones
- abandoned districts
- social geography

### Inputs
- `SettlementGraphPackage`
- `LocalSocialAIStatePackage`
- `TerrainTransformationPackage`
- `IslandGameplayProjectionRecord[]`

### Outputs
- `SpatialConsequencePackage`

### Notes
This phase explains why different parts of an island look and function differently.

---

## PHASE 23 — BUILDING & PROP NARRATIVE GENERATOR

### Purpose
Generate buildings and props as evidence of history.

### Generates

For buildings:
- original function
- current function
- faction linkage
- damage history
- repair history
- symbolic value

For props:
- economic meaning
- religious meaning
- labor traces
- collapse traces
- household traces
- environmental storytelling anchors

### Inputs
- `SpatialConsequencePackage`
- `IslandHistoryRecord[]`
- `NaturalEvolutionPackage`
- social groups and faction ownership

### Outputs
- `BuildingNarrativePackage`
- `PropNarrativePackage`

### Notes
This phase is essential for readable historical space.

---

## PHASE 24 — LOCAL NPC GENERATOR

### Purpose
Generate gameplay-facing people from historical and social context.

### Generates
- key residents
- mediators
- surviving specialists
- conflict figures
- memory keepers
- local cult figures
- former elite remnants
- witnesses of the old order

### Inputs
- `SettlementGraphPackage`
- `LocalSocialAIStatePackage`
- `BuildingNarrativePackage`
- migration and ownership history

### Outputs
- `LocalNPCRosterPackage`

### Notes
NPC must be born from the world, not placed as generic quest dispensers.

---

## PHASE 25 — FINAL REALIZATION GENERATOR

### Purpose
Assemble the playable world.

### Generates
- chunk data
- tiles
- routes
- structures
- props
- interaction points
- NPC placements
- map markers
- world state packages

### Inputs
- all previous packages

### Outputs
- final playable world build
- `PlayableWorldPackage`

### Notes
This is the materialization phase only.  
It must not invent history.

---

## PHASE 26 — VALIDATION, REBALANCE & PLAYABILITY PASS

### Purpose
Validate that the world is:
- causally coherent
- historically varied
- readable
- playable
- convergent toward the final island
- rich enough for gameplay

### Checks
- diversity of island roles
- quality of pressure gradient
- clarity of archipelago tragedy
- variety of settlements
- existence of social tensions
- quality of convergence toward island 30
- route readability
- survival of enough historical traces
- quality of gameplay projection handoff into local realization

### Can do
- partial rebalance
- partial rerolls of selected late layers
- collapse softening
- convergence strengthening
- restoration of lost variety

### Outputs
- `WorldValidationReport`
- `PlayableWorldSnapshot`

### Notes
Validation is not optional.  
Without it, even a deep generator can produce flat or unreadable worlds.

---

# 5. Data flow rules

All phases must obey three kinds of flow:

## 5.1 Forward pass
Normal causal flow:
```text
world laws → history → archipelago → islands → gameplay projection → local space → world build
```

## 5.2 Feedback pass
Late phases may return structured signals upward:
- too little cultural variety
- archipelago too empty
- tragedy too weak
- convergence too flat
- gameplay projection too detached from current runtime
- all islands too similar

Only approved rebalance phases may modify earlier outputs.

## 5.3 Iteration pass
Some groups of phases may rerun internally:
- diplomacy / trade / war / migration across eras
- religion / mental model under repeated crises
- local social AI after settlement shifts

---

# 6. Allowed algorithm families by layer

## Probability-driven
Use for:
- variation ranges
- climate micro-difference
- demographic variance
- event chance under valid conditions

## Rule-driven
Use for:
- causal constraints
- impossible states
- geography compatibility
- legitimacy compatibility
- island role plausibility
- gameplay projection plausibility

## Utility-driven AI
Use for:
- states
- dynasties
- factions
- religious blocs
- local communities

## Minimax-like or adversarial search
Use selectively for:
- major wars
- dynastic succession conflicts
- coalition formation against hegemonic forces
- ideological dominance contests
- critical local faction conflict nodes

## Expectimax-like uncertainty
Use for:
- catastrophic decisions
- reforms under unstable conditions
- route survival under environmental risk

---

# 7. Implementation discipline

Before Codex tasking, the repository must define:
- top-level phase map
- master seed source-of-truth
- phase interaction contracts
- orchestration rules
- phase-specific overview docs
- data contracts
- archetype libraries
- event grammar
- validation rules
- execution protocol

No implementation should begin from later phases before earlier contracts are fixed.

---

# 8. Mandatory documentation order

The official documentation order for the repository is:

## Governance layer
1. `Phase_Map_Document.md`
2. `00_master_seed_generator.md`
3. `PHASE_INTERACTION_DOCUMENT.md`
4. `WORLD_GENERATION_ORCHESTRATION.md`

## Phase-detail layer
5. `Phase 1 Overview + Contracts`
6. `Phase 2 Overview`
7. `Pressure and Rhythm System`
8. `Religious Cosmology System`
9. `Mental Model System`
10. `Civilization / Power / Dynasty System`
11. `Decision & Event Engine`
12. `Memory / Trauma / Drift System`
13. `Archipelago Convergence System`
14. `Archipelago Gameplay Projection Bridge`
15. later spatial realization docs

This order is mandatory because:
- Phase 0 laws must be fixed before downstream design;
- interaction contracts must be fixed before phase details drift;
- orchestration must be fixed before implementation begins;
- gameplay projection must be specified before local realization tries to consume island history.

---

# 9. Phase ownership boundaries

## Upstream-only phases
These must not depend on later world realization:
- 0 to 17

## Bridge phase
This translates large history into gameplay-facing projection:
- 17.5

## Downstream realization phases
These translate convergence and projection into playable local worlds:
- 18 to 26

No downstream realization phase may bypass the bridge and invent its own island progression truth.

---

# 10. Relationship to governing documents

This document defines the **official map**.  
It does not replace more detailed governing documents.

## `00_master_seed_generator.md`
Defines:
- Phase 0 semantics
- world seed profile fields
- derived tendencies
- sub-seed derivation
- validation of the foundational world profile

## `PHASE_INTERACTION_DOCUMENT.md`
Defines:
- immutable vs derived handoffs
- what each phase may and may not invent
- allowed feedback paths
- freeze points
- validation gates

## `WORLD_GENERATION_ORCHESTRATION.md`
Defines:
- execution order
- stage grouping
- reroll policy
- rebalance policy
- logging
- traceability
- failure handling

If this phase map and those documents diverge, the governing documents take precedence until this file is revised.

---

# 11. Final statement

The world generation system is not:
- a biome picker,
- a continent preset table,
- a handcrafted island sequencer,
- or a late-stage content scatterer.

It is a **causal machine** whose outputs must remain readable from:
- master seed laws,
- to macro geography,
- to history,
- to collapse,
- to archipelago role,
- to island role,
- to island history,
- to gameplay projection,
- to final playable space.

That is the required official structure for `gdrclm/game`.
