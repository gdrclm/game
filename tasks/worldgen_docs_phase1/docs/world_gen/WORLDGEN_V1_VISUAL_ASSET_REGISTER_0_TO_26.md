# WORLDGEN V1 VISUAL ASSET REGISTER 0 TO 26

## Status
Source-of-truth visual asset and debug-visualization register for V1 worldgen from Phase 0 through Phase 26.

## Purpose

V1 worldgen cannot be considered testable if its generated phases only exist as data packages.

The project already has some visual cells / SVG-like terrain elements such as grass, stone, paths, and related isometric terrain pieces. However, the complete V1 worldgen pipeline requires a much wider visual vocabulary.

This document defines the minimum visual requirements for V1 so that:

```text
Phase 0-2 can be visually inspected;
Phase 3-17.5 wrappers can be debugged through readable symbolic visuals;
Phase 18-24 realization phases can materialize history into terrain, settlements, props, and NPCs;
Phase 25 can assemble a playable/debuggable world;
Phase 26 can validate visual readability and causal continuity.
```

This register does not require final polished production art for every entry. It defines what must exist as:

```text
final or near-final game asset;
placeholder gameplay asset;
debug overlay;
icon / marker;
map symbol;
text-card visual;
future V2 extension slot.
```

---

# Visual Implementation Levels

## Level A — Game Asset
Must appear in the playable isometric world.

Examples:

```text
grass tile
water tile
bridge
house
NPC sprite
prop object
```

## Level B — Gameplay Placeholder
Can be visually simple but must be present in the playable world for testing.

Examples:

```text
placeholder shrine
placeholder warehouse
placeholder sickbed
placeholder archive shelf
```

## Level C — Debug Overlay
Does not need to be diegetic game art. Used to inspect generated data.

Examples:

```text
pressure heatmap
route network line
disease evidence marker
island role label
```

## Level D — UI / Notebook / Map Symbol
Used in map, notebook, debug panel, diagnosis board, or manual visual test export.

Examples:

```text
friend letter icon
evidence icon
false-cause marker
repair action marker
```

## Level E — V2 Reserved
Not required visually in V1, but reserved as future visual category.

Examples:

```text
full family crest set
all household prop variants
complete ritual calendar props
NPC daily schedule animation variants
```

---

# Global V1 Visual Style Requirements

All game-facing assets should follow the existing isometric project direction:

```text
flat 2.5D isometric game art;
bold dark ink contour;
high contrast;
readable at small tile scale;
large and medium shape language;
no micro-noise;
no tiny cracks as texture filler;
no painterly shading;
ornamental Kells-like / illuminated-manuscript influence where appropriate;
clear silhouettes over decorative excess.
```

Debug overlays may use simple abstract colors, icons, lines, and labels. Debug overlays are not required to match the game art style.

---

# Cross-Phase Visual Categories

V1 needs the following visual families across all phases.

```text
1. Macro-map visuals
2. Debug overlay visuals
3. Terrain tile visuals
4. Route / travel visuals
5. Water / coast / river visuals
6. Resource visuals
7. Settlement visuals
8. Infrastructure visuals
9. Religious / cultural visuals
10. Collapse / ruin visuals
11. Disease / medicine visuals
12. Evidence / investigation visuals
13. NPC / social role visuals
14. UI / notebook / map visuals
15. Validation / warning visuals
```

---

# Phase 0 — Master Seed Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| World profile summary panel | C/D | Show seed-derived tendencies |
| Seed axis icon set | D | Display maritime dependence, volatility, conflict, collapse, etc. |
| Sub-seed namespace table | C | Debug deterministic phase namespaces |
| Three-seed comparison cards | C/D | Compare different generated worlds |

## Required icons / symbols

```text
maritime dependence
route fragility
environmental volatility
collapse intensity
conflict pressure
cultural permeability
resource scarcity bias
catastrophe tendency
```

## V2 reserved visuals

```text
world mode portrait cards
advanced preset symbols
player-facing world selection UI
```

---

# Phase 1 — Macro Geography Visual Requirements

## Required V1 debug visuals

| Visual item | Level | Purpose |
|---|---|---|
| Macro geography overview map | C | Inspect whole generated world |
| Tectonic / plate map | C | Show physical foundation |
| Relief map | C | Show altitude and terrain logic |
| Mountain system overlay | C | Show mountain chains |
| Volcanic zone overlay | C | Show unstable geological zones |
| River basin overlay | C | Show drainage and hydrology structure |
| Sea region overlay | C | Show maritime space |
| Archipelago region overlay | C | Show archipelago within larger geography |
| Macro route overlay | C | Show travel/trade corridors |
| Chokepoint overlay | C | Show strategic bottlenecks |
| Isolated zone overlay | C | Show remote/peripheral spaces |
| Strategic region overlay | C | Show geography-derived strategic zones |

## Required game-facing asset families derived from Phase 1

| Asset family | Level | Notes |
|---|---|---|
| mountain / cliff tile family | A/B | Needed later for terrain and route constraints |
| river tile family | A/B | River channels, crossings, banks |
| sea / deep water tile family | A | Existing water style can be expanded |
| coast / shore tile family | A | Edge between land and water |
| island edge / erosion tile family | A/B | Needed for archipelago readability |
| volcanic rock / ash ground family | B | Needed if volcanic zones appear |
| highland / lowland ground variants | B | Derived from relief |
| isolated rocky outcrop props | B | Strategic/peripheral terrain readability |

## V2 reserved visuals

```text
detailed geological strata
micro erosion features
small tributary networks
subregional geology textures
```

---

# Phase 2 — Pressure and Rhythm Visual Requirements

## Required V1 debug overlays

| Visual item | Level | Purpose |
|---|---|---|
| Climate hostility heatmap | C | Hot/cold/humid pressure |
| Resource stress heatmap | C | Food/water/resource pressure |
| Route exposure overlay | C | Dangerous or costly routes |
| Chokepoint tension overlay | C | Bottleneck stress |
| Isolation pressure overlay | C | Remoteness and support delay |
| Ecological instability overlay | C | Fragility/recovery |
| Catastrophe frequency overlay | C | Storm/flood/drought/volcanic risk |
| Seasonality overlay | C | Cyclical predictability |
| Storm rhythm overlay | C | Storm cadence |
| Navigation window overlay | C | Safe/blocked travel windows |
| Recovery / relief overlay | C | Environmental forgiveness |

## Required game-facing asset hooks

| Asset family | Level | Notes |
|---|---|---|
| storm-wet ground variant | B | Visual state for weather/rhythm testing |
| drought/dry ground variant | B | Resource stress cue |
| flooded path variant | B | Route exposure cue |
| broken / dangerous bridge variant | A/B | Route/chokepoint gameplay |
| safe refuge marker | B/D | Recovery/relief support |
| hazardous route marker | B/D | Navigation risk |

## V2 reserved visuals

```text
full local weather cycles
animated storm states
seasonal tile transformations
regional disaster scars per event
```

---

# Phase 3 — Proto-Cosmology Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Cosmology summary card | C/D | Show explanation model produced from pressure/rhythm |
| Worldview icon set | D | Order/chaos, cyclical/linear, nature relation |
| Sacredness distribution marker | C/D | Centralized vs distributed sacredness |

## Game-facing optional placeholders

| Asset family | Level | Notes |
|---|---|---|
| early sacred marker / stone sign | B | Used later by religion/culture phases |
| route-gate symbolic mark | B | For sacred route/chokepoint worldview |

## V2 reserved visuals

```text
myth fragment illustrations
cosmic genealogy charts
regional myth murals
```

---

# Phase 4 — Religion Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Religion lineage card | C/D | Debug religion generation |
| Sacred center marker | C/D | Map/debug marker |
| Ritual system icon | D | Ritual type / taboo type |
| Taboo marker | D | Blocks access / modifies social behavior |

## Required game-facing asset families

| Asset family | Level | Notes |
|---|---|---|
| shrine / small altar | B | Minimal religious place |
| temple / sacred building placeholder | B | For settlements/island history |
| ritual post / marker stone | B | Readable at tile scale |
| taboo boundary sign | B/D | Used for forbidden zones |
| sacred storage seal | B | Useful for disease/infrastructure conflict |

## V2 reserved visuals

```text
full doctrine-specific temple variants
ritual calendar props
priestly costume sets
schism / heresy symbols
```

---

# Phase 5 — Mental Model Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Mental model matrix | C | Debug society perception |
| Outsider trust marker | D | Access/trust gameplay |
| Risk-processing marker | D | Explains cautious/aggressive decisions |
| Authority preference marker | D | Explains social/political NPC behavior |

## Game-facing optional hooks

| Asset family | Level | Notes |
|---|---|---|
| closed settlement gate sign | B | Outsider suspicion |
| warning sign / local notice | B | Risk handling / community caution |

## V2 reserved visuals

```text
class-specific attitude symbols
regional personality portraits
NPC psychological state icons
```

---

# Phase 6 — Social Norms Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Social norms table | C | Debug norms by region |
| Marriage/inheritance icon markers | D | Future dynasty/family extension |
| Property boundary marker | D/B | Spatial/social claim |
| Shame/duty/honor marker | D | Social cost debug |
| Access taboo marker | D/B | Gate for disease/evidence access |

## Required game-facing asset families

| Asset family | Level | Notes |
|---|---|---|
| property boundary posts | B | Settlement/social space |
| locked communal store sign | B | Access conflict |
| elder authority sign / banner | B | Social hierarchy cue |
| forbidden object marker | B/D | Investigation/social restriction |

## V2 reserved visuals

```text
family crests
marriage contract props
inheritance archive sets
local legal tablets / ledgers
```

---

# Phase 7 — Civilization Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Civilization region overlay | C | Debug map |
| Civilization card | C/D | Summary of polity/culture |
| Maritime/trade dependence marker | D | Links to routes and archipelago |
| Settlement viability overlay | C | Shows where societies could grow |

## Required game-facing asset hooks

| Asset family | Level | Notes |
|---|---|---|
| cultural banner placeholder | B | Civilization/faction readable marker |
| trade route marker | B/D | Route/civilization link |
| old border stone | B | Historical territory trace |

## V2 reserved visuals

```text
language family symbols
full cultural pattern sets
civilization-specific building variants
```

---

# Phase 8 — Power Structure Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Power graph | C | Debug control nodes |
| Power node icon set | D | Military, priestly, trade, clan, bureaucracy, local autonomy |
| Conflict/support edge markers | C | Debug power relations |
| Legitimacy marker | D | Explains authority |

## Required game-facing asset families

| Asset family | Level | Notes |
|---|---|---|
| authority house / hall placeholder | B | Local power center |
| customs sign / trade office | B | Trade power |
| guard post / watch point | B | Military power |
| priestly office sign | B | Religious power |

## V2 reserved visuals

```text
office hierarchy insignia
bureaucratic document variants
covert influence markers
rank title plaques
```

---

# Phase 9 — Dynasty and Elite Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Dynasty / elite card | C/D | Debug lineage |
| Lineage marker | D | Link NPC/building/island ownership |
| Succession risk marker | D | Future history driver |
| Elite conflict marker | D | Political tension |

## Required game-facing asset hooks

| Asset family | Level | Notes |
|---|---|---|
| simple crest / seal placeholder | B/D | Used on documents, doors, storage |
| elite house marker | B | Former/current elite trace |
| inherited storage seal | B | Disease/infrastructure evidence hook |

## V2 reserved visuals

```text
full genealogy charts
individual heraldry sets
ruler portrait cards
marriage-link visuals
cadet branch crests
```

---

# Phase 10 — Strategic Decision Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Decision trace table | C | Debug actor decisions |
| Actor -> decision -> consequence graph | C | Causal chain |
| Decision type icon set | D | Trade, war, suppression, reform, monopoly, marriage alliance |
| Rejected action marker | C/D | Shows alternative path not taken |

## Game-facing asset hooks

| Asset family | Level | Notes |
|---|---|---|
| old decree / notice prop | B | Decision trace in world |
| trade monopoly ledger | B | Disease/economic evidence |
| route fortification remnant | B | Terrain/building hook |
| failed reform document | B | Archive/evidence hook |

## V2 reserved visuals

```text
full war campaign maps
diplomatic treaty variants
marriage alliance documents
minimax/expectimax trace diagrams
```

---

# Phase 11 — Era Simulation Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| 200-year timeline summary | C | Manual review of history |
| Epoch cards | C/D | Foundation, tension, late instability |
| Major event graph | C | Cause-effect history |
| Route shift marker | C/D | Connects history to geography |

## Game-facing asset hooks

| Asset family | Level | Notes |
|---|---|---|
| old battlefield remnant | B | War summary trace |
| abandoned trade marker | B | Route shift trace |
| migration camp remnant | B | Migration event trace |
| succession crisis archive prop | B | Dynasty/history trace |

## V2 reserved visuals

```text
full yearly timeline UI
battle/campaign illustrations
minor event prop variants
complete treaty archive set
```

---

# Phase 12 — Memory, Trauma and Drift Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Memory graph | C | Event -> memory -> behavior |
| Trauma marker | C/D | Region/island trauma |
| Grievance marker | D | Explains distrust/conflict |
| Taboo influence marker | D | Links memory to social rules |

## Required game-facing asset hooks

| Asset family | Level | Notes |
|---|---|---|
| memorial marker / grave sign | B | Trauma trace |
| warning mural / taboo inscription | B | Memory as visible rule |
| broken communal object | B | Collapse/memory prop |
| old famine marker / empty granary prop | B | Trauma-driven behavior |

## V2 reserved visuals

```text
oral tradition illustrations
family memory objects
regional myth variants
forgotten contradiction markers
```

---

# Phase 13 — Global Tragedy Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Tragedy cause-chain diagram | C | Show tragedy is derived |
| Root driver table | C | Geography/power/memory/religion drivers |
| Structural break marker | D | Identifies what broke |
| Tragedy type icon | D | Debug / map / notebook |

## Required game-facing asset hooks

| Asset family | Level | Notes |
|---|---|---|
| tragedy scar marker | B | Visible trace in world |
| broken route monument | B | Macro tragedy to island trace |
| failed prevention archive prop | B | V2 optional, V1 placeholder possible |

## V2 reserved visuals

```text
regional tragedy variants
propaganda posters
failed prevention scene props
sub-event illustrations
```

---

# Phase 14 — Collapse Cascade Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Collapse cascade graph | C | Route/institution/specialist breakdown |
| Route loss overlay | C | Macro route collapse |
| Port abandonment marker | C/D | Maritime collapse |
| Specialist loss marker | D | Medicine/craft/social loss |
| Institutional hollowing marker | D | Explains weak authority |

## Required game-facing asset families

| Asset family | Level | Notes |
|---|---|---|
| abandoned port module | B | Maritime collapse |
| broken dock / pier | A/B | Playable traversal |
| ruined workshop | B | Specialist loss |
| empty office / abandoned authority prop | B | Institutional hollowing |
| collapsed storage prop | B | Disease/infrastructure link |

## V2 reserved visuals

```text
violence incident props
population attrition settlement variants
failed relief convoy props
specialist death records
```

---

# Phase 15 — Archipelago Role Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Archipelago role card | C | Explains old system role |
| Old-system network diagram | C | Shows archipelago connections |
| Pressure gradient to final island | C/D | Progression readability |
| Former empire / dependence marker | D | History link |

## Required game-facing asset hooks

| Asset family | Level | Notes |
|---|---|---|
| old customs marker | B | Archipelago as former system |
| route milestone / sea marker | B | Travel chain |
| final island foreshadow marker | B/D | Progression hook |

## V2 reserved visuals

```text
full trade ledgers
imperial administration props
route treaty artifacts
customs archive set
```

---

# Phase 16 — Island Role Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| 30-island role table | C | Manual review |
| Island role map | C/D | Visualize role distribution |
| Neighbor dependency graph | C | Show inter-island logic |
| Island role icon set | D | Fishing, refuge, repair, market, exile, military, customs, final heart, etc. |

## Required game-facing asset hooks

| Asset family | Level | Notes |
|---|---|---|
| island role map marker | D | Map UI / debug |
| resource function marker | B/D | Shows island function |
| collapsed function marker | B/D | Old role now broken |

## V2 reserved visuals

```text
micro-role icons
seasonal role variants
administrative subfunction props
minor dependency markers
```

---

# Phase 17 — Island History Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Island history card | C/D | Founding, ownership, faith shifts, decline, contradiction |
| 30-island history table | C | Manual review |
| Present contradiction marker | D | Core island narrative conflict |
| Ownership layer marker | D | Former/current control |
| Local crisis marker | D | History beat |

## Required game-facing asset hooks

| Asset family | Level | Notes |
|---|---|---|
| ownership seal on building/prop | B | History trace |
| abandoned worksite | B | Growth/decline trace |
| faith-shift marker / overwritten symbol | B | Religion history trace |
| migration remnant / camp object | B | Migration history trace |
| local crisis memorial | B | Island-specific trauma |

## V2 reserved visuals

```text
full island timeline UI
family history props
historical resident portraits
local legend illustrations
minor incident object sets
```

---

# Phase 17.5 — Gameplay Projection and Disease Diagnosis Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Island gameplay projection table | C | Progression review |
| Island diagnosis projection table | C | Disease role review |
| Friend letter card/list | D/UI | Narrative objective |
| Evidence graph | C/D | Triangulation |
| False causality graph | C/D | Wrong conclusions |
| Ending condition matrix | C/D | Diagnosis/medicine/trust/repair endings |
| Anti-repetition report | C | Island variety check |
| Objective vs survival conflict marker | D | Core experience rule |

## Required game-facing / UI asset families

| Asset family | Level | Notes |
|---|---|---|
| friend letter icon/card | D/UI | Gives island objective |
| evidence marker | D/B | Map/notebook/world |
| sample container / vial | B | Medical collection |
| infected material sample | B | Disease object |
| diagnosis notebook section | D/UI | Player-facing system |
| false-cause warning marker | D/UI | Debug or late gameplay |
| repair action marker | D/B | Systemic repair |
| trust gate marker | D/UI | Social access |
| moral dilemma marker | D/UI | Island 15-type situations |

## Required disease/evidence prop families

| Asset family | Level | Notes |
|---|---|---|
| sick fish / diseased food prop | B | Symptom evidence |
| salt / contaminated storage prop | B | Infrastructure/economy disease chain |
| wet crystal wall patch | B | Storage evidence |
| burned hands medical icon / sickbed cue | B/D | Symptom visual |
| archive ledger | B | Political/economic proof |
| old ban notice | B | Religious/cultural obstruction |
| broken filter / contaminated well | B | Repair target |

## V2 reserved visuals

```text
advanced hypothesis board
expanded interrogation UI
optional witness contradiction markers
late mutation variants
alternate letter illustrations
secondary evidence chains
```

---

# Phase 18 — Natural Evolution Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Natural evolution debug table | C | Exploitation/rewilding/collapse |
| Rewilding state marker | D | Nature remembers people |
| Exploitation trace marker | D | Human impact |

## Required game-facing asset families

| Asset family | Level | Notes |
|---|---|---|
| overgrown field tile/prop | B | Abandoned agriculture |
| logging scar stump cluster | B | Exploitation |
| marsh expansion edge tile | B | Natural change |
| reclaimed ruin vegetation | B | Nature over history |
| coastal collapse edge | B | Shoreline history |

## V2 reserved visuals

```text
species succession variants
fauna migration markers
detailed ecological recovery stages
```

---

# Phase 19 — Terrain Transformation Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Terrain anchor zone map | C | Debug placement hints |
| Old road / drowned path overlay | C/D | Traversal history |
| Collapse field marker | D | Hazard/terrain |

## Required game-facing asset families

| Asset family | Level | Notes |
|---|---|---|
| rock outcrop tile/prop | A/B | Existing stone family can expand |
| scree / rubble tile | B | Collapse and terrain hazard |
| shrub mass tile/prop | B | Terrain readability |
| old road / path tile variants | A/B | Existing path family can expand |
| drowned path tile | B | Route/travel hazard |
| field remnant tile | B | Settlement/nature history |

## V2 reserved visuals

```text
micro terrain features
seasonal terrain variants
route erosion history variants
```

---

# Phase 20 — Settlement Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Settlement graph debug | C | Living/dead settlements |
| District graph debug | C | District roles |
| Local authority marker | D | Social power |
| Dead center / current center marker | D | Settlement state |

## Required game-facing asset families

| Asset family | Level | Notes |
|---|---|---|
| house / hut modular family | A/B | Existing house generator can expand |
| dead house / abandoned house variant | B | Collapse state |
| market stall / trade table | B | Economy |
| small workshop | B | Specialist/craft |
| locket/storehouse entrance | B | Infrastructure/disease |
| settlement gate / fence | B | Access/trust |
| safe sleep refuge marker/building | B | Survival |

## V2 reserved visuals

```text
household variants
local economy building families
craft guild interiors
minor social group spaces
```

---

# Phase 21 — Social AI Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Faction goal table | C | Debug social motives |
| Resource priority marker | D | Explains NPC behavior |
| Conflict tendency marker | D | Local tension |
| Alliance tendency marker | D | Social graph |

## Required game-facing/UI hooks

| Asset family | Level | Notes |
|---|---|---|
| faction marker / colored banner placeholder | B/D | Social grouping |
| disputed resource marker | B/D | Conflict object |
| closed/open access marker | D/UI | Trust gate |

## V2 reserved visuals

```text
NPC schedules
agent plan visualization
negotiation state UI
long-term faction strategy overlays
```

---

# Phase 22 — Spatial Consequence Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Alive/dead zone overlay | C | Spatial consequence |
| Contested zone overlay | C/D | Social tension |
| Sacred zone overlay | C/D | Culture/religion |
| Work zone overlay | C/D | Economy/labor |
| Route zone overlay | C/D | Traversal |
| Abandoned district overlay | C/D | Collapse trace |

## Required game-facing asset hooks

| Asset family | Level | Notes |
|---|---|---|
| alive district prop density set | B | More maintained area |
| dead district prop density set | B | Ruined/empty area |
| contested barricade / marker | B | Social conflict |
| sacred boundary objects | B | Religious access |
| work-zone clutter props | B | Labor/economy traces |

## V2 reserved visuals

```text
exact geometry hints
micro-zone variants
seasonal zone shifts
forbidden subzone markers
```

---

# Phase 23 — Building and Prop Narrative Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| Building narrative table | C | Original/current function |
| Prop narrative table | C | Economic/religious/labor/collapse traces |
| Evidence carrier marker | D | Shows which props/buildings carry evidence |
| Damage/repair state marker | D | History visible in object |

## Required game-facing asset families

| Asset family | Level | Notes |
|---|---|---|
| warehouse / storehouse | B | Disease/economy/infrastructure |
| archive shelf / ledger table | B | Evidence |
| broken filter object | B | Repair/disease |
| workbench / tools | B | Specialist/workshop |
| religious object / shrine prop | B | Culture |
| damaged door / sealed door | B | Access gate |
| household trace props | B | Human history |
| labor trace props | B | Economy/work |

## V2 reserved visuals

```text
all household object sets
all prop histories
ownership marks
craft marks
secondary evidence props
```

---

# Phase 24 — Local NPC Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| NPC role card | C/D | Debug NPC grounding |
| NPC relationship to disease marker | D | Witness/liar/healer/concealer/etc. |
| Trust gate marker | D/UI | Social access |
| Moral cost marker | D/UI | Dilemma |
| Lineage/power/memory link marker | C/D | NPC upstream grounding |

## Required game-facing asset families

| Asset family | Level | Notes |
|---|---|---|
| generic key NPC sprite base | A/B | Minimum playable NPC |
| fisherman variant | B | Early disease/survival |
| merchant variant | B | Economy/trade |
| healer/doctor variant | B | Medicine |
| elder/starosta variant | B | Authority/moral dilemma |
| religious keeper variant | B | Taboo/culture |
| worker/laborer variant | B | Infrastructure/evidence |
| courier variant | B | Route/logistics |
| sick resident variant | B | Disease symptom |

## V2 reserved visuals

```text
full biography portraits
family resemblance variants
daily routine animation sets
secondary NPC crowds
relationship graph portraits
```

---

# Phase 25 — Final Realization Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| PlayableWorldPackage debug map | C | Final assembly view |
| Chunk/tile placement debug | C | World realization |
| Interaction point marker | D/B | Player actions |
| NPC placement marker | D/B | Playable placement |
| Map marker set | D/UI | Navigation and objective |

## Required game-facing asset families

| Asset family | Level | Notes |
|---|---|---|
| base terrain tile set | A | Grass/stone/path/water/shore minimum |
| route/travel tile set | A/B | Paths, bridges, blocked routes |
| core structure set | B | Houses, storehouses, shrines, docks |
| core prop set | B | Resources, evidence, medicine, tools |
| core NPC set | B | Key roles |
| objective marker set | D/UI | Letters, evidence, repair, transition |

## V2 reserved visuals

```text
art-directed prop overrides
manual level design patches
cinematic composition anchors
polished final asset variants
```

---

# Phase 26 — Validation and Rebalance Visual Requirements

## Required V1 visuals

| Visual item | Level | Purpose |
|---|---|---|
| World validation report UI/export | C/D | Review pass/fail |
| Visual readability checklist | C | Manual test |
| Causal chain trace view | C | Phase inheritance proof |
| Seed comparison report | C | Different worlds |
| Island repetition warning view | C | Anti-repetition |
| Missing asset category report | C | Visual production planning |
| Disease readability report | C | Investigation clarity |

## Required validation categories

```text
missing visual category
missing debug overlay
unreadable island role
missing disease evidence visual
Phase 0-2 visual proof missing
NPC role lacks visual carrier
building/prop evidence carrier missing
friend objective lacks UI visual
repair action lacks world marker
```

## V2 reserved visuals

```text
telemetry-driven readability heatmaps
automatic visual patch suggestions
large-scale art coverage dashboards
```

---

# Minimum Game Asset Set For V1 Manual Testing

The following game-facing assets should exist as final or placeholder before V1 is considered manually testable.

## Terrain / environment

```text
grass base tile
stone / rock base tile
path / trail tile
water tile
shore / coast tile
river tile
bridge tile or object
broken bridge variant
mud / wet ground variant
rubble / collapse tile
shrub / overgrowth tile
field remnant tile
```

## Structures

```text
basic house
abandoned house
storehouse / warehouse
small dock / pier
shrine / altar
authority house / elder house
workshop
lazarus / sick shelter placeholder
archive / record room placeholder
market stall / trader spot
```

## Props

```text
crate / barrel
salt barrel / contaminated storage
ledger / archive book
friend letter
sample vial / container
sick fish / diseased food
broken filter / contaminated well part
warning sign / taboo marker
old seal / crest marker
work tools
medical herbs / stabilizer ingredient
repair material bundle
```

## NPCs

```text
generic NPC base
fisherman
merchant
healer
authority elder / starosta
religious keeper
worker / laborer
courier
sick resident
player hero placeholder with urban/student look
```

## UI / debug / map symbols

```text
island role icon set
friend objective icon
evidence icon
sample icon
repair icon
trust gate icon
moral dilemma icon
false causality icon
medicine readiness icon
diagnosis completeness icon
systemic repair icon
social trust icon
warning / validation icon
route danger icon
safe refuge icon
```

---

# Minimum Debug Overlay Set For V1 Manual Testing

```text
Phase 0 world profile panel
Phase 1 macro map
Phase 1 relief/mountain overlay
Phase 1 river/sea/archipelago overlay
Phase 1 route/chokepoint overlay
Phase 2 pressure heatmap
Phase 2 rhythm overlay
Phase 3-6 society summary cards
Phase 7-12 history timeline and event graph
Phase 13 tragedy cause chain
Phase 14 collapse graph
Phase 15 archipelago role network
Phase 16 island role table/map
Phase 17 island history table/cards
Phase 17.5 diagnosis projection table
Phase 17.5 evidence graph
Phase 17.5 ending matrix
Phase 26 validation/readability report
```

---

# Production Rule

Do not wait until Phase 18-25 to think about visuals.

Phase wrappers from Phase 3 onward may be mostly abstract, but each must expose visual/debug categories so the generated causal chain can be inspected before final game assets exist.

V1 visual readiness requires two parallel tracks:

```text
1. game-facing placeholder assets for playable testing;
2. debug-facing overlays/cards/tables for worldgen inspection.
```

---

# Final Statement

V1 does not require final polished art for every phase.

V1 does require that every generated phase has a visible carrier:

```text
map overlay,
debug card,
icon,
marker,
placeholder object,
terrain tile,
structure,
prop,
NPC,
or UI symbol.
```

If a phase cannot be visually inspected, its generator cannot be trusted during V1 manual testing.
