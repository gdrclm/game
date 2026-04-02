# Project Roadmap

## Purpose

This roadmap defines how the project should grow without collapsing into one large, tightly coupled gameplay script.

The target is simple:

- new content should be added through registries and narrow runtime APIs
- new UI should not own gameplay rules
- large files should be split before they become the default place for unrelated features
- save data should remain stable while systems evolve

This document complements [ARCHITECTURE.md](./ARCHITECTURE.md).

## Current Checkpoint

- Phase 0 is complete: the project has guardrails, a save version, and a file-size watch list.
- Phase 1 is complete: state schema and save/migration helpers now exist.
- Phase 2 is complete: status, inventory, action, merchant, and dialogue UI now live in dedicated modules, while `js/ui/ui-system.js` acts as a compatibility facade and helper bridge.
- Quest tracking and collapsible right-side panels now follow the same split pattern through dedicated UI modules instead of pushing more stateful rendering into the facade.
- Phase 3 is complete: item definitions now live in `item-catalog` and `item-registry`, while inventory mutations plus item-use flow route through `inventory-runtime` and `item-effects`.
- Phase 4 is complete as a foundation pass: NPC and dialogue registries/runtimes now exist, merchant talk flow is data-driven, and dialogue nodes support conditions and effects.
- Phase 5 is complete: merchant delivery quests and bag-upgrade artisan orders now route through `quest-registry`, `quest-runtime`, and `bag-upgrade-runtime`, with shared quest ids, active/completed tracking, progress sync, accept/complete/fail hooks, and persisted quest state.
- Phase 6 is complete: pricing, reward scaling, merchant transactions, and chest rewards now route through `pricing`, `reward-scaling`, `shop-runtime`, and catalog-driven loot selection, while late-island drain/recovery tuning and zero-stat penalties are centralized outside UI glue.
- Phase 7 is complete: `interaction-router` and `world-spawn-runtime` now own both the public interaction boundary and the live implementation, while `js/interaction-system.js` has been reduced to a thin compatibility facade.
- Phase 8 is complete: expedition shared/layout/profile/progression/bridge modules now own the live implementation, while `js/expedition-system.js` has been reduced to a thin compatibility bridge.
- Phase 9 is complete: `topology-painter` and `chunk-generator` now own both the public map-generation boundary and the live implementation, while `js/map-generator.js` has been reduced to a thin compatibility facade.
- Survival balance is now on an explicit tuning pass: long islands seed guaranteed recovery points, expedition houses can become camps, wells, and forage spots, and zeroed stats now affect routing, recovery, and step costs directly.
- Fog of war and the archipelago map now have their own split runtime/UI path: explored tiles persist separately from the legacy UI facade, and the map overlay renders discovered islands, houses, quest givers, rivers, and resource points.
- Tier-based loot now follows the `T1–T6` island windows from `note_for_future.md`: chests and merchants pull from the shared item catalog instead of hand-maintained loot lists.
- Bag growth now follows the six-stage artisan line from `note_for_future.md`: special craftsmen appear in progression windows, track bag-loadout quests, and unlock slots from `4` up to `10`.
- Remaining work is now cleanup and hardening, not missing phase boundaries: browser smoke coverage, collapsing compatibility facades, and removing duplicated legacy helpers from oversized files.

## Growth Rules

These rules should stay true for every new feature:

- `window.Game` remains the runtime root, but new systems expose narrow APIs through `window.Game.systems`
- definitions and runtime are separate concerns
- no new gameplay rules should be added directly to `js/ui/ui-system.js`
- no new content should be added through ad-hoc `if/else` chains when a registry fits better
- any file that grows beyond roughly `250` lines and owns more than one responsibility should be split
- state shape changes must be explicit and versioned
- all gameplay entities must use stable ids: `itemId`, `npcId`, `questId`, `dialogueId`, `shopId`, `encounterId`

## Target Architecture

### State

- `js/state/game-state-schema.js`
- `js/state/save-load.js`

### Events

- `js/events/game-events.js`

### UI

- `js/ui/status-ui.js`
- `js/ui/inventory-ui.js`
- `js/ui/action-ui.js`
- `js/ui/merchant-ui.js`
- `js/ui/dialogue-ui.js`
- `js/ui/quest-ui.js`
- `js/ui/map-ui.js`
- `js/ui/ui-system.js` as a thin facade

### Inventory

- `js/inventory/item-catalog.js`
- `js/inventory/item-registry.js`
- `js/inventory/inventory-runtime.js`
- `js/inventory/item-effects.js`

### NPC and Dialogue

- `js/npc/npc-registry.js`
- `js/npc/npc-runtime.js`
- `js/dialogue/dialogue-registry.js`
- `js/dialogue/dialogue-runtime.js`

### Quests

- `js/quests/quest-registry.js`
- `js/quests/quest-runtime.js`
- `js/quests/bag-upgrade-data.js`
- `js/quests/bag-upgrade-runtime.js`

### Economy

- `js/economy/pricing.js`
- `js/economy/shop-runtime.js`
- `js/economy/reward-scaling.js`

### Interactions

- `js/interactions/interaction-router.js`
- `js/interactions/world-spawn-runtime.js`

### Expedition and Map

- `js/expedition/expedition-shared.js`
- `js/expedition/shape-builders.js`
- `js/expedition/house-profiles.js`
- `js/expedition/island-layout.js`
- `js/expedition/progression.js`
- `js/expedition/bridge-runtime.js`
- `js/map/map-runtime.js`
- `js/map/topology-painter.js`
- `js/map/chunk-generator.js`

## State Schema Plan

The runtime state should be explicit and grouped by ownership.

### Player state

- `playerPos`
- `playerFacing`
- `stats`
- `gold`
- `inventory`
- `selectedInventorySlot`

### World state

- `currentIslandIndex`
- `visitedIslandIds`
- `resolvedHouseIds`
- `tradedHouseIds`
- `merchantStateByHouseId`
- `placedBridgeTiles`
- `collapsedBridgeTiles`
- `groundItemsByWorldKey`
- `worldFlags`

### Narrative state

- `activeDialogueId`
- `activeDialogueNodeId`
- `activeQuestIds`
- `completedQuestIds`
- `questStateById`
- `npcStateByNpcId`

### UI state

- `isPaused`
- `isGameOver`
- `hasWon`
- `lastActionMessage`
- `openMerchantHouseId`

## Event Bus Plan

Introduce a small event bus so UI and systems stop calling each other directly in every branch.

### First events to add

- `player:statsChanged`
- `inventory:changed`
- `world:tileChanged`
- `interaction:changed`
- `merchant:updated`
- `quest:accepted`
- `quest:advanced`
- `quest:completed`
- `dialogue:started`
- `dialogue:advanced`

### Event bus rules

- pure runtime systems emit events after state changes
- UI modules subscribe and re-render only their own area
- render systems do not own business logic

## Phase Plan

## Phase 0 - Baseline and Guardrails

- [x] Add this roadmap to the repo and keep it updated when modules move
- [x] Add a short "feature growth rules" section to `ARCHITECTURE.md`
- [x] Add a simple save version number to runtime state
- [x] Add a file-size watch list for oversized runtime files

Definition of done:

- every large file has a planned split target
- the team has one source of truth for future refactors

## Phase 1 - State Ownership

- [x] Create `js/state/game-state-schema.js`
- [x] Create `js/state/save-load.js`
- [x] Move save-shape knowledge out of feature modules
- [x] Add migration helpers for future schema changes

Definition of done:

- state fields are grouped by domain
- new systems stop adding state ad-hoc

## Phase 2 - UI Split

- [x] Create `js/ui/status-ui.js`
- [x] Create `js/ui/inventory-ui.js`
- [x] Move status summaries, overlays, pause handling, and movement/path cost hooks fully into `js/ui/status-ui.js`
- [x] Move inventory rendering, portrait drawing, and slot selection fully into `js/ui/inventory-ui.js`
- [x] Create `js/ui/action-ui.js`
- [x] Create `js/ui/merchant-ui.js`
- [x] Create `js/ui/dialogue-ui.js`
- [x] Route live UI behavior through dedicated modules
- [x] Reduce `js/ui/ui-system.js` to facade/helper responsibility, keeping only compatibility fallback bodies as cleanup debt

Definition of done:

- each UI panel renders independently
- button handlers are no longer mixed with inventory rules, merchant rules, and status calculations

## Phase 3 - Inventory Foundations

- [x] Create `js/inventory/item-registry.js`
- [x] Move item definitions and `createInventoryItem` helpers out of loot-only logic into `js/inventory/item-registry.js`
- [x] Create `js/inventory/inventory-runtime.js`
- [x] Create `js/inventory/item-effects.js`
- [x] Move pickup, drop, consume, and use flow out of `js/ui/ui-system.js`
- [x] Route all item use/drop/pickup through inventory runtime

Definition of done:

- a new item can be added by adding registry data and an optional effect handler
- inventory UI does not decide item behavior

## Phase 4 - NPC and Dialogue Foundations

- [x] Create `js/npc/npc-registry.js`
- [x] Create `js/npc/npc-runtime.js`
- [x] Create `js/dialogue/dialogue-registry.js`
- [x] Create `js/dialogue/dialogue-runtime.js`
- [x] Support dialogue node conditions and effects

Definition of done:

- a new NPC can be added without changing core interaction code
- dialogue trees are data-driven

## Phase 5 - Quest Runtime

- [x] Create `js/quests/quest-registry.js`
- [x] Create `js/quests/quest-runtime.js`
- [x] Move merchant quest logic into the shared quest layer
- [x] Support accept, advance, complete, fail, repeatable flags

Definition of done:

- shops, NPCs, shelters, and world events can all drive quests through one runtime

## Phase 6 - Economy Runtime

- [x] Create `js/economy/pricing.js`
- [x] Move merchant buy/sell formulas out of loot glue code and into `js/economy/pricing.js`
- [x] Create `js/economy/shop-runtime.js`
- [x] Create `js/economy/reward-scaling.js`
- [x] Move merchant transactions and persisted merchant state out of `js/ui/ui-system.js`
- [x] Give shops explicit `shopId` and stock definitions
- [x] Move late-island drain/recovery tuning and zero-stat penalty scaling into `js/economy/reward-scaling.js`

Definition of done:

- item pricing and reward scaling are isolated and testable
- merchant behavior no longer lives inside house encounter branches

## Phase 7 - Interactions and Spawns

- [x] Create `js/interactions/interaction-router.js`
- [x] Create `js/interactions/world-spawn-runtime.js`
- [x] Keep adjacency, click resolution, and available actions in the router
- [x] Keep placement and persistence of world objects in spawn runtime

Definition of done:

- new world interactions do not bloat one catch-all interaction file

## Phase 8 - Expedition Split

- [x] Create `js/expedition/island-layout.js`
- [x] Create `js/expedition/progression.js`
- [x] Create `js/expedition/bridge-runtime.js`
- [x] Leave `js/expedition-system.js` as a facade or remove it after migration

Definition of done:

- progression tuning, island shape planning, and bridge lifecycle stop sharing one file

## Phase 9 - Map Generator Split

- [x] Create `js/map/topology-painter.js`
- [x] Create `js/map/chunk-generator.js`
- [x] Keep chunk assembly separate from land-painting helpers
- [x] Keep generation data independent from runtime interaction logic

Definition of done:

- new biome and terrain features can be added without digging through one huge generator file

## Migration Map

This section lists where current code should move next.

## `js/ui/ui-system.js`

### Move to `js/ui/status-ui.js`

- `getStats`
- `getStatValue`
- `setStatValue`
- `changeStatValue`
- `getFocusMultiplier`
- `countDepletedStats`
- `getCriticalDepletionMultiplier`
- `getAverageStatRatio`
- `getConditionScreenState`
- `restoreFullEnergy`
- `updateStats`
- `syncStatusOverlay`
- `syncConditionOverlay`
- `togglePause`
- `applyMovementStepCosts`
- `applyPathCompletionCosts`

### Move to `js/ui/inventory-ui.js`

- `getInventory`
- `getUnlockedInventorySlots`
- `getSelectedInventoryItem`
- `normalizeInventoryItem`
- `buildInventorySlot`
- `renderInventory`
- `drawPortrait`
- `handleInventoryClick`
- `selectInventorySlot`

### Move to `js/inventory/inventory-runtime.js`

- `addInventoryItem`
- `removeInventoryItemAtIndex`
- `countInventoryItem`
- `consumeInventoryItemById`
- `consumeSelectedInventoryItem`
- `pickupGroundItem`
- `dropSelectedInventoryItem`

### Move to `js/inventory/item-effects.js`

- `getConsumableEffectForUse`
- `applyInventoryConsumableEffect`
- `buildRewardEffectDrops`
- `buildItemEffectDrop`
- `buildGoldEffectDrop`
- `isBridgeBuilderItem`
- `getBuildDirectionCandidates`
- `getBuildableBridgeTarget`
- `buildBridgeFromInventoryItem`
- `useInventoryItem`
- `performSleep` only if sleep remains item-like, otherwise keep in action runtime

### Move to `js/ui/merchant-ui.js`

- `closeMerchantPanel`
- `getOpenMerchantSource`
- `escapeHtml`
- `formatQuantityLabel`
- `getMerchantInspectableItems`
- `getMerchantDescriptionState`
- `renderMerchantPanel`
- `openMerchantPanel`
- `handleMerchantPanelClick`

### Move to `js/economy/shop-runtime.js`

- `persistMerchantState`
- `completeMerchantQuest`
- `buyMerchantStock`
- `sellInventoryItemToMerchant`

### Move to `js/ui/action-ui.js`

- `getDefaultActionHint`
- `setActionButtonState`
- `updateActionButtons`
- `handleUseAction`
- `handleInspectAction`
- `handleTalkAction`
- `handleActionClick`
- `setActionMessage`

### Move to shared gameplay runtime

- `resolveHouseUse`
- `inspectActiveHouse`
- `applyLootPlan`
- `describeLootResults`
- `applyStatDeltas`
- `applyScaledRewardStats`
- `describeAppliedRewards`
- `ensureGameOverState`
- `triggerVictory`

## `js/loot-system.js`

### Move to `js/inventory/item-registry.js`

- `getItemDefinition`
- `describeItem`
- `getConsumableEffect`
- `isItemStackable`
- `getItemBaseValue`
- `createInventoryItem`

### Move to `js/economy/pricing.js`

- `getMerchantBuyPrice`
- `getMerchantSellPrice`

### Keep in loot generation or move later to reward modules

- `getPoolForIsland`
- `pickWeightedEntry`
- `createGoldDrop`
- `createItemDrop`
- `mergeDrops`
- `createChestLootPlan`
- `describeDrop`
- `describeLootPlan`

### Move to `js/economy/shop-runtime.js`

- `createMerchantStock`
- `createMerchantQuest`

## `js/interaction-system.js`

### Move to `js/interactions/world-spawn-runtime.js`

- `collectDoorCandidates`
- `collectPerimeterCandidates`
- `collectWildernessCandidates`
- `collectInteriorCandidates`
- `createInteractionRecord`
- `createGroundItemInteractionRecord`
- `appendPersistentGroundItems`
- `createChunkInteractions`
- `syncGroundItemInteraction`
- `addGroundItemDrop`
- `replaceGroundItemAtWorld`
- `removeInteraction`

### Move to `js/interactions/interaction-router.js`

- `getInteractionAtChunkTile`
- `canReachInteractionFrom`
- `isAdjacentToInteraction`
- `getAdjacentInteraction`
- `getInteractionAtWorld`
- `getGroundItemAtWorld`
- `resolveClickTarget`

### Keep as small shared helpers

- `tileKey`
- `isGroundTile`
- `isInteriorInteractionKind`
- `isGroundItemInteraction`

## `js/expedition-system.js`

Migration status: completed. `js/expedition-system.js` is now a thin bridge; live code is owned by the split expedition modules below.

### Move to `js/expedition/island-layout.js`

- island contour selection
- route style selection
- relative chunk map building
- placement candidate search
- island placement and translation
- island record assembly
- house plan assignment by island archetype

Concrete function groups:

- `getWorldLayoutPlan`
- `chooseArchetype`
- `chooseContourKind`
- `chooseRouteStyle`
- shape builders
- placement builders
- `buildIslandProgression`
- `createAbsoluteIslandRecord`
- `buildPlacedIsland`

### Move to `js/expedition/progression.js`

- drain and recovery multipliers
- island progression metadata
- chunk progression lookups
- island record lookups
- archipelago lifecycle

Concrete function groups:

- `ensureArchipelago`
- `resetArchipelago`
- `getIslandRecord`
- `getIslandIndex`
- `getChunkProgression`
- `getDrainMultiplier`
- `getRecoveryMultiplier`
- `scaleDrain`
- `scaleRecovery`

### Move to `js/expedition/bridge-runtime.js`

- fragile bridge detection
- saved bridge state
- bridge collapse and placement
- tile transition bridge behavior

Concrete function groups:

- `isFragileBridgeTile`
- `getCollapsedBridgeState`
- `getPlacedBridgeState`
- `isBridgeCollapsed`
- `applyCollapsedBridges`
- `applyPlacedBridges`
- `collapseBridgeAt`
- `placeBridgeAt`
- `handleTileTransition`

## `js/map-generator.js`

### Move to `js/map/topology-painter.js`

- grid painting helpers
- land brushes and blob painting
- directional lobe painting
- edge opening and bay carving
- rock barriers and topology features
- shoreline painting

Concrete function groups:

- `buildChunkGrid`
- `paintLandBrush`
- `paintBlob`
- `paintIslandBody`
- `paintEdgeOpening`
- `carveBridgeChannel`
- `carveConnectionToEdge`
- `carveBay`
- `carveRockBarrier`
- `carveDiamondArea`
- `carveTopologyFeatures`
- `addRandomRocks`
- `addShoreline`

### Move to `js/map/chunk-generator.js`

- spawn area protection
- shape placement helpers
- house and interaction tile maps
- ocean chunk creation
- main chunk assembly

Concrete function groups:

- `ensureSpawnArea`
- `flattenShape`
- `canPlaceShape`
- `stampShape`
- `placeShapeWithRandomAttempts`
- `setTileIfPossible`
- `buildHouseTileMap`
- `buildInteractionTileMap`
- `createOceanChunk`
- `generateChunk`

## Recommended Work Order

Follow this order to keep the game playable after each step:

1. state schema and save versioning
2. UI split
3. inventory runtime and item registry
4. economy runtime
5. dialogue runtime
6. quest runtime
7. interaction router and spawn runtime
8. expedition split
9. map split

## Quality Gates Per Phase

- [ ] syntax checks pass on all touched files
- [ ] no new file crosses `250` lines without a review
- [ ] current save data still loads or is migrated
- [ ] one smoke test path is checked manually in the browser
- [ ] new system owns its own definitions, runtime, and UI boundary

## Immediate Next Milestone

The roadmap phases are now in place. The next practical milestone should be cleanup and hardening:

- browser-smoke the merchant, quest, bridge, interaction, and map flows after the runtime split
- remove compatibility fallback bodies from `js/ui/ui-system.js` once the delegated paths are fully verified in the browser
- remove remaining merchant compatibility helpers from `js/loot-system.js` after pricing/shop coverage is stable
- split `js/expedition/island-layout.js` and `js/expedition/house-profiles.js` further if new expedition features are added, so the internal expedition modules stay narrow
- add a small event bus so quest, shop, and interaction updates stop depending on direct UI-triggered re-renders
- tune late-island economy using the new `reward-scaling` boundary instead of patching survival values directly in UI or expedition glue

This is the highest leverage next step because the architectural boundaries now exist; the remaining risk is in browser coverage, facade cleanup, and balancing follow-through.
