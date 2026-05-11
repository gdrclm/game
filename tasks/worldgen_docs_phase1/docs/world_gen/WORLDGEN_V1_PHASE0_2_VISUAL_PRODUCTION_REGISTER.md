# WORLDGEN V1 PHASE 0-2 VISUAL PRODUCTION REGISTER

## Status
Source-of-truth visual production register for Phase 0, Phase 1, and Phase 2 V1 readiness.

## Purpose

The previous broad V1 visual register is not detailed enough for Phase 0-2.

Phase 0-2 are not just a source of grass, stone, path, and water tiles. They are the deep physical foundation of the generated world:

```text
world seed laws
-> tectonic skeleton
-> relief and elevation
-> continents and seas
-> mountain systems
-> volcanic zones
-> hydrosphere and river basins
-> climate envelope
-> marine carving and coastlines
-> archipelago macro-region
-> coastal opportunities
-> connectivity graphs
-> chokepoints
-> isolated/peripheral zones
-> strategic regions
-> pressure fields
-> environmental rhythms
```

V1 must visually prove that these systems exist and are causally linked.

This document defines the more detailed visual asset and debug visualization needs for Phase 0-2.

---

# Existing Phase 1 Contract Signals

Phase 1 package structure already requires these physical and strategic record families:

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
strategicRegions
coastalOpportunityMap optional
isolatedZones optional
```

Therefore V1 visuals must represent these families, either as:

```text
macro debug map layers;
map symbols;
terrain/material families;
placeholder game assets;
future V2 reserved visual families.
```

---

# Existing Phase 1 Debug Stage Signals

The current Phase 1 debug bundle references these stage ids:

```text
tectonicSkeleton
reliefElevation
hydrosphere
riverSystem
marineCarving
climateEnvelope
continentalCohesion
coastalOpportunity
connectivityGraph
chokepoints
isolationPeriphery
archipelagoSignificance
strategicRegionSynthesis
validationRebalance
```

These stages define the visual testing order for Phase 1.

---

# Visual Readiness Levels For Phase 0-2

## Level 1 — Debug readable
Required for all generated records.

```text
map overlay
icon
symbol
line graph
heatmap
summary card
seed comparison snapshot
```

## Level 2 — Gameplay placeholder
Required for records that affect player navigation, survival, resources, terrain, settlements, disease, or island readability.

```text
simple isometric tile
simple prop
simple structure marker
route object
hazard marker
resource marker
```

## Level 3 — Game-art production asset
Required only for core repeated world elements used directly in the current playable map.

```text
water
shore
grass/ground variants
rock/stone variants
path/road
bridge
river edge
mountain/cliff proxy
resource props
```

## Level 4 — V2 reserved detail
Not required for V1 but must be declared now.

```text
full geological strata
large rock material library
seasonal transformations
advanced biome-specific foliage
micro-climate variation props
```

---

# Phase 0 — Master Seed Visual Register

Phase 0 is not visible as terrain, but it must be visible as a control panel and causal explanation layer.

## Required debug/UI visuals

| Visual | Level | Notes |
|---|---:|---|
| WorldSeedProfile panel | 1 | Shows hidden world laws |
| DerivedWorldTendencies panel | 1 | Shows how seed pushes geography/history |
| WorldSubSeedMap table | 1 | Shows deterministic namespaces |
| Three-seed comparison cards | 1 | Shows different world profiles |
| Seed influence arrows | 1 | Shows which values affect Phase 1/2 |

## Required icon categories

```text
maritimeDependence
routeFragility
terrainViolence / relief aggression
environmentalVolatility
catastropheBias
resourceScarcityBias
collapseIntensity
conflictPressure
dynastyPressure
culturalPermeability
isolationBias
archipelagoPotential
```

## Phase 0 -> Phase 1 visual influence mapping

| Phase 0 tendency | Must visually influence |
|---|---|
| maritimeDependence | sea corridors, archipelago significance, coastal opportunity |
| environmentalVolatility | volcanic zones, catastrophe pressure, unstable coastlines |
| routeFragility | chokepoints, isolated zones, route exposure |
| conflictPressure | strategic regions, chokepoint value, future power/war tendency |
| collapseIntensity | late-world pressure, tragedy/collapse severity, island decline |
| culturalPermeability | later religion/syncretism/trade-cultural overlap |
| dynastyPressure | later elite/dynasty line density |

## V2 reserved visuals

```text
world profile portrait cards
interactive seed sliders
preset world mode thumbnails
advanced seed mutation timeline
```

---

# Phase 1 — Macro Geography Visual Register

Phase 1 must be visually readable as a single coherent physical system.

## 1. Tectonic Skeleton Visuals

### Required debug visuals

| Visual | Level | Notes |
|---|---:|---|
| Plate boundary map | 1 | Primary tectonic structure |
| Plate motion vector overlay | 1/4 | V1 can be simplified, V2 deepens |
| Collision / rift / subduction markers | 1 | Explains mountain/volcanic generation |
| Tectonic stress heatmap | 1 | Supports future volcanic/relief logic |

### Required game-facing asset implications

| Asset family | Level | Notes |
|---|---:|---|
| tectonic ridge / highland proxy | 2 | Placeholder for mountain/highland systems |
| fault-line cliff motif | 2/3 | Useful for readable terrain edges |
| cracked basalt / fractured ground | 2 | Not generic stone; tectonic surface cue |

### V2 reserved

```text
detailed plate motion animation
subduction trench visual set
rift valley tile family
fault scar variants
```

---

## 2. Relief and Elevation Visuals

### Required debug visuals

| Visual | Level | Notes |
|---|---:|---|
| Elevation heatmap | 1 | Altitude readability |
| Relief region overlay | 1 | Lowlands/highlands/mountains/basins |
| Slope burden overlay | 1 | Feeds Phase 2 terrain pressure |
| Ridge / basin separation lines | 1 | Explains rivers and routes |

### Required game-facing asset families

| Asset family | Level | Notes |
|---|---:|---|
| lowland ground variants | 2/3 | Not only grass; flat traversable terrain |
| upland ground variants | 2/3 | Harder terrain visual |
| cliff / escarpment edge proxies | 2/3 | Readable elevation boundary |
| mountain base tile/proxy | 2 | V1 can use symbolic blocked terrain |
| scree / talus / slope rubble | 2 | Transition between mountain and path |
| basin floor terrain | 2 | Often wet/fertile/sedimented |

### V2 reserved

```text
multi-step elevation tile set
isometric cliff stack library
regional slope shape variants
fine relief erosion marks
```

---

## 3. Rock / Geological Material Families

V1 must not treat all non-grass terrain as one generic stone.

Phase 1 does not need full geology simulation, but it needs a minimum rock/material vocabulary that can visually support tectonics, volcanic zones, river basins, coasts, mountains, and collapse.

### Required V1 material families

| Material family | Level | Purpose |
|---|---:|---|
| dark volcanic rock / basalt | 2/3 | Volcanic zones, harsh coast, old lava/ash ground |
| pale sedimentary stone / limestone | 2 | Coast, river basins, eroded cliffs, settlements |
| hard mountain stone / granite-like mass | 2/3 | Mountain systems, highland outcrops |
| shale / layered broken stone | 2 | Erosion, cliffs, collapsed paths |
| wet river stone / rounded stones | 2/3 | River beds, crossings, shorelines |
| coastal rock / salt-worn stone | 2/3 | Sea edges, archipelago identity |
| rubble / collapsed masonry-stone mix | 2 | Later collapse/settlement phases |
| mineral stain / colored crust overlays | 2 | Disease/contamination and geology cues |

### Debug/material symbols

```text
volcanicMaterial
sedimentaryMaterial
mountainCoreMaterial
riverStoneMaterial
coastalErosionMaterial
collapseRubbleMaterial
mineralStainMaterial
```

### V2 reserved

```text
full rock-type atlas
ore/mineral family visuals
regional lithology palettes
stratified cliff cross-section motifs
quarry-specific stone variants
```

---

## 4. Continents and Landmass Visuals

### Required debug visuals

| Visual | Level | Notes |
|---|---:|---|
| Continent boundary map | 1 | Large landmasses |
| Continental cohesion overlay | 1 | Explains civilization emergence potential |
| Core/periphery region overlay | 1 | Feeds later history/power |
| Coastal vs inland gradient | 1 | Feeds maritime/trade logic |

### Required game-facing implications

| Asset family | Level | Notes |
|---|---:|---|
| continental landmass debug symbol | 1 | Map-level only |
| inland terrain marker | 2 | Later differentiates island/continental traces |
| old continental influence marker | 2/D | For archipelago history traces |

### V2 reserved

```text
continent-specific palettes
continental cultural material motifs
large-scale atlas map style
```

---

## 5. Sea Regions and Marine Carving Visuals

### Required debug visuals

| Visual | Level | Notes |
|---|---:|---|
| Sea region overlay | 1 | Maritime areas |
| Shallow/deep sea distinction | 1/2 | Navigation and coast logic |
| Marine carving/coastal erosion overlay | 1 | Explains coast shape |
| Storm-exposed sea marker | 1 | Feeds Phase 2 storm/navigation |
| Navigable corridor overlay | 1 | Macro routes |

### Required game-facing asset families

| Asset family | Level | Notes |
|---|---:|---|
| deep sea tile | 3 | Not same as shore water |
| shallow coastal water tile | 3 | More readable near land |
| turbulent sea marker/tile variant | 2 | Storm/nav hazard |
| eroded shore tile | 2/3 | Marine carving cue |
| beach / sediment shore tile | 2/3 | Coast type variation |
| rocky shore tile | 2/3 | Tectonic/volcanic coast cue |
| salt crust / tide mark overlay | 2 | Disease/salt economy hooks |

### V2 reserved

```text
current direction variants
storm sea animation
reef/sandbar families
wave-exposure coast variants
```

---

## 6. Mountain System Visuals

### Required debug visuals

| Visual | Level | Notes |
|---|---:|---|
| Mountain system overlay | 1 | Chain shapes and IDs |
| Ridge line overlay | 1 | Explains rivers/routes |
| Pass / barrier marker | 1 | Route constraints |
| Mountain rain-shadow marker | 1 | Climate/river implication |

### Required game-facing asset families

| Asset family | Level | Notes |
|---|---:|---|
| mountain silhouette/proxy tile | 2/3 | Blocked/high-burden terrain |
| highland rock outcrop | 2/3 | Usable in island terrain |
| pass marker / narrow route | 2 | Chokepoint gameplay |
| scree field | 2 | Hazard/readability |
| cliff shadow / ink edge motif | 2/3 | Style-consistent height cue |

### V2 reserved

```text
mountain biome sets
snow line variants
range-specific silhouettes
pass fortification visuals
```

---

## 7. Volcanic Zone Visuals

### Required debug visuals

| Visual | Level | Notes |
|---|---:|---|
| Volcanic zone overlay | 1 | Unstable geology |
| Lava/ash field marker | 1/2 | V1 symbolic if not gameplay |
| Volcanic instability marker | 1 | Feeds catastrophe pressure |
| Mineral spring / fumarole marker | 2 | Disease/medicine hooks possible |

### Required game-facing asset families

| Asset family | Level | Notes |
|---|---:|---|
| ash ground tile | 2 | Harsh ground |
| black volcanic rock | 2/3 | Strong material identity |
| cracked hot ground marker | 2 | Hazard placeholder |
| mineral vent / fumarole prop | 2 | Environment/disease/medicine hook |
| sulfur/mineral stain overlay | 2 | Visual cause marker |

### V2 reserved

```text
lava flow variants
volcanic event scars
steam/fumarole animation
geothermal settlement props
```

---

## 8. Hydrosphere and River Basin Visuals

### Required debug visuals

| Visual | Level | Notes |
|---|---:|---|
| River basin overlay | 1 | Basin IDs and boundaries |
| Main river line overlay | 1 | Drainage logic |
| Tributary marker | 1/4 | V1 simplified, V2 detailed |
| Water reliability overlay | 1 | Feeds Phase 2 hydrology stress |
| Floodplain / wetland marker | 1/2 | Later biome/settlement/disease relevance |

### Required game-facing asset families

| Asset family | Level | Notes |
|---|---:|---|
| river water tile | 3 | Separate from sea water |
| riverbank tile | 3 | Bank transition |
| ford / crossing tile | 2/3 | Gameplay route |
| wetland/marsh ground tile | 2/3 | Disease/survival relevance |
| floodplain sediment ground | 2 | Fertile/wet lowland cue |
| dry riverbed tile | 2 | Drought/instability cue |
| spring / well source prop | 2 | Settlement/medicine hook |
| contaminated water marker | 2/D | Disease hook |

### V2 reserved

```text
tributary network assets
seasonal river width variants
waterfall/rapids if needed
basin-specific vegetation
```

---

## 9. Climate Band Visuals

### Required debug visuals

| Visual | Level | Notes |
|---|---:|---|
| Climate band overlay | 1 | Macro climate regions |
| Temperature pressure overlay | 1 | Hot/cold burden |
| Humidity overlay | 1 | Disease/storage relevance |
| Wind/storm exposure marker | 1 | Rhythm/catastrophe relevance |

### Required game-facing biome/ground families

V1 should not use grass as the default answer for all land.

| Biome / climate visual family | Level | Purpose |
|---|---:|---|
| temperate grass / meadow ground | 3 | Existing grass can cover only this slice |
| sparse dry grass / scrub | 2/3 | Drier bands |
| wet grass / marsh edge | 2/3 | Humid bands, disease/storage relevance |
| reed / wetland vegetation | 2 | River/marsh |
| bare dirt / exposed soil | 2/3 | Dry/worn terrain |
| sandy / pale shore soil | 2/3 | Coast/lowland |
| cold highland ground | 2 | Harsh/cold pressure |
| ash/volcanic barren ground | 2 | Volcanic/catastrophe |
| salt-crusted ground | 2 | Archipelago/economy/disease hook |
| cultivated/remnant field ground | 2 | Later settlement/natural evolution |

### V2 reserved

```text
regional foliage libraries
seasonal biome transformation
climate-specific prop ecology
microclimate palettes
```

---

## 10. Archipelago Region Visuals

### Required debug visuals

| Visual | Level | Notes |
|---|---:|---|
| Archipelago boundary overlay | 1 | Shows macro-region |
| Island chain structure overlay | 1 | Shows island group logic |
| Archipelago significance marker | 1/D | Why this region matters |
| Relation to macro routes overlay | 1 | Not detached island cluster |
| Final island pressure gradient marker | 1/D | Later Phase 15/17.5 use |

### Required game-facing asset families

| Asset family | Level | Notes |
|---|---:|---|
| island edge tile family | 3 | Coastline readability |
| small island silhouette marker | 1/D | Map/debug |
| reef/sandbar placeholder | 2 | Navigation/route |
| pier/dock connection asset | 2/3 | Inter-island travel |
| coastal storage marker | 2 | Economy/disease hook |

### V2 reserved

```text
archipelago-specific coast palettes
island chain map art
sea-route wind/current markers
reef/sandbar detailed variants
```

---

## 11. Coastal Opportunity Visuals

### Required debug visuals

| Visual | Level | Notes |
|---|---:|---|
| Coastal opportunity heatmap | 1 | Where ports/settlements/trade can emerge |
| Harbor candidate marker | 1/D | Future settlements/routes |
| Dangerous coast marker | 1/D | Storm/exposure |
| Resource coast marker | 1/D | Fishing/salt/trade potential |

### Required game-facing asset families

| Asset family | Level | Notes |
|---|---:|---|
| harbor/pier placeholder | 2/3 | Later settlement/trade |
| fishing spot marker | 2 | Resource/survival |
| salt collection marker | 2 | Economy/disease |
| exposed rocky landing | 2 | Route danger |
| safe cove marker | 2/D | Refuge/travel |

### V2 reserved

```text
port type variants
harbor infrastructure families
coastal trade prop sets
saltworks variants
```

---

## 12. Connectivity Graph / Macro Route Visuals

### Required debug visuals

| Visual | Level | Notes |
|---|---:|---|
| Land route graph | 1 | Macro travel across land |
| Sea route graph | 1 | Maritime corridors |
| Hybrid route graph | 1 | Combined travel network |
| Route mode marker | 1/D | Land/sea/mixed |
| Route reliability marker | 1/D | Feeds Phase 2 travel exposure |
| Route cost line width / style | 1 | Visualizes travel burden |

### Required game-facing asset hooks

| Asset family | Level | Notes |
|---|---:|---|
| trail/path tile variants | 3 | Existing path should become route family |
| old road tile | 2/3 | Historical routes |
| sea route map marker | D | UI/map |
| ferry/passage marker | 2/D | Inter-island route |
| blocked route marker | 2/D | Collapse/gameplay |

### V2 reserved

```text
route age variants
caravan road infrastructure
maritime navigation markers
seasonally blocked route visuals
```

---

## 13. Chokepoint Visuals

### Required debug visuals

| Visual | Level | Notes |
|---|---:|---|
| Chokepoint marker | 1/D | Strategic bottleneck |
| Chokepoint pressure ring | 1 | Stress value |
| Failure impact marker | 1/D | What breaks if lost |
| Dependency concentration marker | 1/D | How many routes depend on it |

### Required game-facing asset families

| Asset family | Level | Notes |
|---|---:|---|
| narrow pass marker | 2 | Mountain/terrain chokepoint |
| bridge chokepoint asset | 3 | Travel bottleneck |
| strait/ferry chokepoint marker | 2/D | Maritime bottleneck |
| customs gate / checkpoint | 2 | History/power |
| collapsed chokepoint variant | 2 | Collapse/disease logistics |

### V2 reserved

```text
fortified pass variants
customs office props
chokepoint battle scars
seasonally passable chokepoints
```

---

## 14. Isolation / Periphery Visuals

### Required debug visuals

| Visual | Level | Notes |
|---|---:|---|
| Isolated zone overlay | 1 | Remote regions |
| Support delay marker | 1/D | Survival/logistics |
| Peripheral exposure marker | 1/D | Border/edge risk |
| Access fragility marker | 1/D | Route dependency |

### Required game-facing asset hooks

| Asset family | Level | Notes |
|---|---:|---|
| remote marker / broken sign | 2/D | Isolated island/zone |
| poor/neglected route tile variant | 2 | Periphery condition |
| sparse refuge marker | 2/D | Low support |
| abandoned aid/supply prop | 2 | Collapse/access failure |

### V2 reserved

```text
periphery-specific settlement palettes
support-delay event props
remote community variants
```

---

## 15. Strategic Region Visuals

### Required debug visuals

| Visual | Level | Notes |
|---|---:|---|
| Strategic region overlay | 1 | Macro political/history possibility |
| Core region marker | 1/D | Future civilization/power |
| Fragile periphery marker | 1/D | Future collapse/isolation |
| Strategic candidate score card | 1 | Debug route/coast/choke significance |

### Required game-facing hooks

| Asset family | Level | Notes |
|---|---:|---|
| strategic marker symbol | D | Map/debug |
| old boundary marker | 2 | Later civilization/power history |
| route-control structure placeholder | 2 | Later power/chokepoint |

### V2 reserved

```text
strategic region atlas
political boundary visual variants
historical border markers
```

---

# Phase 2 — Visual Production Register

Phase 2 turns Phase 1 geography into experienced environmental pressure and rhythm. It needs overlays and gameplay cues.

---

## 1. Climate Pressure Visuals

### Required debug overlays

```text
coldPressure heatmap
heatPressure heatmap
humidityPressure heatmap
climateExposurePressure overlay
```

### Required game-facing assets

```text
cold highland ground variant
wet humid ground variant
dry exposed soil variant
fog/mist marker for humid zones
sun-baked/dry edge marker
```

### V2 reserved

```text
localized weather animation
temperature-based seasonal palette shifts
microclimate prop sets
```

---

## 2. Terrain Pressure Visuals

### Required debug overlays

```text
terrainHarshness heatmap
slopeBurden overlay
fragmentationBurden overlay
mobilityTerrainPenalty overlay
```

### Required game-facing assets

```text
hard slope / scree tile
blocked cliff marker
rough rock ground
fragmented rubble field
heavy terrain path overlay
```

### V2 reserved

```text
fine slope-step tile library
terrain fatigue animation cues
micro obstacle sets
```

---

## 3. Hydrology Pressure Visuals

### Required debug overlays

```text
waterReliabilityInverse overlay
waterStress heatmap
droughtPressure overlay
floodInstability overlay
```

### Required game-facing assets

```text
safe water source marker
unsafe water marker
dry well / cracked basin prop
flooded path variant
muddy crossing tile
wet storage marker
```

### V2 reserved

```text
seasonal flood stages
water quality visual states
river swelling animation
```

---

## 4. Food / Resource Pressure Visuals

### Required debug overlays

```text
foodStress heatmap
foodReliabilityInverse overlay
fertilitySupportInverse overlay
scarcityBaseline overlay
```

### Required game-facing assets

```text
forage marker
poor forage marker
fish resource marker
spoiled food marker
field remnant / infertile soil cue
storage crate scarcity variant
```

### V2 reserved

```text
resource-specific ecology variants
crop condition stages
food spoilage visual system
```

---

## 5. Travel Exposure Visuals

### Required debug overlays

```text
travelExposure overlay
routeReliabilityInverse overlay
movementUncertaintyPressure overlay
detourBurden overlay
```

### Required game-facing assets

```text
dangerous route marker
safe route marker
blocked route marker
detour sign / broken sign
unstable bridge marker
rough path variant
```

### V2 reserved

```text
route history visual states
seasonal passability states
travel-risk animation markers
```

---

## 6. Chokepoint Pressure Visuals

### Required debug overlays

```text
chokepointPressure overlay
failureImpactPressure overlay
dependencyConcentration overlay
```

### Required game-facing assets

```text
bridge bottleneck
narrow pass
strait/ferry marker
collapsed bottleneck
checkpoint/customs marker
```

### V2 reserved

```text
fortified chokepoints
battle-damaged chokepoints
political checkpoint variants
```

---

## 7. Isolation Pressure Visuals

### Required debug overlays

```text
isolationPressure overlay
supportDelayBurden overlay
peripheralExposure overlay
accessFragility overlay
```

### Required game-facing assets

```text
remote island marker
low support/refuge marker
abandoned supply prop
fragile route marker
isolated settlement sign
```

### V2 reserved

```text
support caravan markers
remote community visual families
periphery-specific decay sets
```

---

## 8. Ecological Fragility Visuals

### Required debug overlays

```text
ecologicalFragility overlay
ecologicalStabilityInverse overlay
regenerationWeakness overlay
carryingCapacityBrittleness overlay
```

### Required game-facing assets

```text
fragile vegetation marker
overharvested ground
recovering vegetation patch
dead reeds / broken ecology prop
brittle soil / erosion patch
```

### V2 reserved

```text
succession stages
species diversity visual states
ecosystem recovery animation
```

---

## 9. Catastrophe Pressure Visuals

### Required debug overlays

```text
catastrophePressure overlay
stormBreakRisk overlay
volcanicInstability overlay
floodBreakRisk overlay
droughtBreakRisk overlay
```

### Required game-facing assets

```text
storm damage prop
flood debris
volcanic ash patch
drought crack tile
broken dock / storm-broken bridge
```

### V2 reserved

```text
catastrophe event aftermath sets
storm/flood/volcanic animation states
localized disaster scars
```

---

## 10. Environmental Rhythm Visuals

### Required debug overlays

```text
seasonalityStrength overlay
stormCadence overlay
navigationWindowReliability overlay
scarcityCadence overlay
predictability overlay
recoveryTempo overlay
```

### Required game-facing/UI assets

```text
navigation window icon
storm warning icon
scarcity cycle icon
recovery/refuge icon
safe interval marker
blocked interval marker
```

### V2 reserved

```text
calendar wheel UI
seasonal map animation
storm cadence timeline
scarcity/recovery forecast UI
```

---

# Corrected Minimum Phase 0-2 Game Asset List

This replaces the oversimplified idea that grass/stone/path are enough.

## Ground / biome / surface

```text
temperate grass ground
sparse dry grass / scrub ground
wet grass / marsh edge
reed / wetland vegetation
bare dirt / exposed soil
sandy / pale shore soil
cold highland ground
ash / volcanic barren ground
salt-crusted ground
floodplain sediment ground
cultivated/remnant field ground
mud / wet route ground
drought cracked ground
```

## Rock / geological materials

```text
dark volcanic basalt
pale sedimentary / limestone stone
hard mountain stone / granite-like mass
shale / layered broken stone
wet rounded river stones
coastal salt-worn rock
collapsed rubble / masonry-stone mix
mineral stain / colored crust overlay
fault-line fractured ground
scree / talus field
```

## Water / coast / hydrology

```text
deep sea water
shallow coastal water
river water
riverbank
ford / crossing
flooded path
unsafe water marker
safe water source marker
dry riverbed
dry well / cracked basin
spring / well source prop
contaminated water marker
```

## Relief / mountain / route terrain

```text
mountain proxy tile
highland rock outcrop
cliff / escarpment edge
narrow pass marker
rough slope tile
blocked cliff marker
heavy terrain path overlay
old road / rough trail
broken route marker
detour sign
```

## Volcanic / catastrophe

```text
ash ground
black volcanic rock
cracked hot ground marker
mineral vent / fumarole prop
sulfur/mineral stain
storm damage prop
flood debris
drought crack tile
storm-broken dock / bridge
```

## Archipelago / maritime / chokepoint

```text
island edge tile family
rocky shore
sediment beach shore
eroded shore
salt tide mark overlay
reef/sandbar placeholder
pier/dock connection
strait/ferry marker
bridge bottleneck
customs/checkpoint marker
safe cove marker
exposed rocky landing
```

## Resource / pressure cues

```text
forage marker
poor forage marker
fish resource marker
spoiled food marker
fragile vegetation marker
overharvested ground
recovering vegetation patch
dead reeds / broken ecology prop
storage scarcity crate
safe refuge marker
low support/refuge marker
```

---

# Corrected Debug Overlay List For Phase 0-2

```text
WorldSeedProfile panel
DerivedWorldTendencies panel
WorldSubSeedMap table
plate boundary map
plate motion / collision / rift markers
relief elevation heatmap
mountain system overlay
volcanic zone overlay
river basin overlay
hydrology / water reliability overlay
sea region overlay
marine carving / erosion overlay
climate band overlay
continental cohesion overlay
coastal opportunity heatmap
land connectivity graph
sea connectivity graph
hybrid connectivity graph
macro route overlay
chokepoint overlay
isolated zone overlay
strategic region overlay
archipelago significance overlay
climate pressure overlay
terrain pressure overlay
hydrology pressure overlay
food/resource pressure overlay
travel exposure overlay
chokepoint pressure overlay
isolation pressure overlay
ecological fragility overlay
catastrophe pressure overlay
environmental rhythm overlays
three-seed comparison snapshot
```

---

# Manual Review Questions For Phase 0-2 Visuals

A V1 Phase 0-2 visual review must answer:

```text
Can I see how the seed profile shaped the physical world?
Can I see tectonic cause behind mountains, volcanic zones, and relief?
Can I see why river basins flow where they do?
Can I see why seas, corridors, and coasts create archipelago logic?
Can I see chokepoints and macro routes from the map without reading JSON?
Can I distinguish at least several rock/material families?
Can I distinguish wetland, dry, highland, shore, volcanic, and salt/crust surfaces?
Can I see that pressure fields derive from geography?
Can I see that rhythm fields are separate from pressure fields?
Can I compare three seeds and recognize different worlds?
```

If the answer is no, Phase 0-2 visual readiness is incomplete.

---

# Production Rule

The Phase 0-2 visual foundation must be treated as a world-atlas problem, not a simple terrain-tile problem.

Grass is only one surface family.
Stone is not one material.
Water is not one tile.
Path is not one route type.

V1 must visually distinguish enough physical systems for later phases to inherit them meaningfully.

---

# Final Statement

Phase 0-2 visuals are the foundation for all later narrative survival-diagnosis systems.

If tectonics, relief, rivers, seas, rock/material families, climate bands, chokepoints, routes, isolation, and pressure/rhythm cannot be visually inspected, then later phases cannot be trusted as causally grounded.
