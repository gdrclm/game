# Project Architecture

## Master plan

The project now follows a staged growth plan:

1. Keep `window.Game` as the single runtime root.
2. Add reusable content through registries, not ad-hoc switches.
3. Route all chunk and tile queries through one world layer.
4. Split large systems by responsibility before adding more gameplay.
5. Cache expensive visuals at chunk or object level instead of per-frame rebuilding.
6. Keep runtime files under 250 lines and split before extending.

See also `ROADMAP.md` for the staged migration plan and function-by-function split targets.

## Feature growth rules

1. Keep `window.Game` as the runtime root and expose new systems through narrow `window.Game.systems.*` APIs.
2. Keep definitions, runtime logic, and UI boundaries separate.
3. Do not add new gameplay rules directly to `js/ui/ui-system.js`.
4. Prefer registries over ad-hoc `if/else` chains when adding new content.
5. Treat save shape changes as explicit, versioned migrations.
6. Give gameplay entities stable ids such as `itemId`, `npcId`, `questId`, `dialogueId`, `shopId`, and `encounterId`.

## Oversized file watch list

- `js/ui/ui-system.js`
  Split into status, inventory, merchant, action, and dialogue modules before adding more UI rules.
- `js/expedition/island-layout.js`
  Keep contour building, placement search, and final island assembly from drifting back toward one catch-all expedition file.
- `js/expedition/house-profiles.js`
  Keep safe-point generation, merchant/chest planning, and house assignment narrow as expedition content expands.
- `js/map/topology-painter.js`
  Split terrain painter helpers further before adding more biome-specific topology rules.
- `js/map/chunk-generator.js`
  Keep chunk assembly, house placement, and travel-zone stamping from collapsing back together.
- `js/interactions/world-spawn-runtime.js`
  Split spawn planners and ground-item persistence again if more interaction families are added.
- `js/loot-system.js`
  Keep chest-outcome tables and loot-plan assembly narrow as more scenario-specific chest rules are added.

## Current structure

- `index.html`
  Boot order for all runtime modules.
- `css/style.css`
  Global page and overlay styling.
- `assets/character_idle.png`
  Raster directional player sprite sheet used by the runtime renderer.

### Core

- `js/config.js`
  Shared config, colors, canvas, top-level `window.Game`.
- `js/state/game-state-schema.js`
  Central default state domains and compatibility normalization.
- `js/state/save-load.js`
  Save snapshot building, migration helpers, and storage glue.
- `js/game-state.js`
  Runtime state only.
- `js/utils.js`
  Generic math and seeded random helpers.
- `js/init.js`
  Startup, initial chunk generation, and event wiring.

### Shared systems

- `js/content-registry.js`
  Reusable content definitions such as tile passability and tile drawing.
- `js/world/chunk-store.js`
  Chunk indexing, lookup, storage, and unload behavior.
- `js/world/tile-query.js`
  Tile inspection and derived player context updates.
- `js/world-system.js`
  Compatibility facade that assembles the world APIs exposed through `window.Game.systems.world`.

### Gameplay systems

- `js/inventory/item-catalog.js`
  Tier windows `T1–T6`, large item catalog, and content-level item definitions from `note_for_future.md`.
- `js/inventory/item-registry.js`
  Registry-owned item metadata access, quest-category matching, weighted catalog selection, and inventory item builders.
- `js/inventory/inventory-runtime.js`
  Inventory mutations, stack handling, and ground-item transfer runtime.
- `js/inventory/item-effects.js`
  Consumable, bridge-building, map-reveal, teleport, trap-ward, and inventory-use effect resolution.
- `js/economy/pricing.js`
  Merchant buy and sell formulas plus item-value access.
- `js/economy/reward-scaling.js`
  Drain, recovery, zero-stat penalties, and merchant quest reward scaling.
- `js/economy/shop-runtime.js`
  Catalog-driven merchant stock generation, persisted shop state, and buy/sell/quest transaction runtime.
- `js/quests/quest-registry.js`
  Shared quest templates and future quest-type definitions.
- `js/quests/quest-runtime.js`
  Shared quest ids, progress tracking, acceptance, completion, and failure state.
- `js/quests/bag-upgrade-data.js`
  Six artisan definitions plus staged bag-upgrade requirements and progression windows.
- `js/quests/bag-upgrade-runtime.js`
  Bag-slot cap, artisan encounter creation, bag-loadout quest evaluation, and slot-upgrade completion.
- `js/map-generator.js`
  Thin compatibility bridge to the split map runtime.
- `js/map/map-runtime.js`
  Explored-tile persistence, fog-of-war capture, and discovered-world map data assembly.
- `js/map/topology-painter.js`
  Public topology-painting boundary for land, shoreline, and terrain layers.
- `js/map/chunk-generator.js`
  Public chunk-assembly boundary and live `generateChunk` facade.
- `js/pathfinding.js`
  Path search using the world layer and house traversal rules.
- `js/movement.js`
  Route playback, chunk streaming, and player context refresh.
- `js/input.js`
  Click and keyboard input.
- `js/interaction-system.js`
  Thin compatibility bridge to the split interaction runtime.
- `js/interactions/world-spawn-runtime.js`
  Public runtime boundary for persistent world-item placement and interaction spawn state.
- `js/interactions/interaction-router.js`
  Public runtime boundary for adjacency, click resolution, and interaction lookup.
- `js/expedition-system.js`
  Thin compatibility bridge to the split expedition runtime.
- `js/expedition/expedition-shared.js`
  Shared expedition constants, direction helpers, seeded layout random, and stable chunk keys.
- `js/expedition/shape-builders.js`
  Relative island-shape construction and placement helper primitives.
- `js/expedition/house-profiles.js`
  Expedition house profile generation, safe-point planning, and profile assignment.
- `js/expedition/island-layout.js`
  Public island-layout boundary for archetypes, placement candidates, and live island assembly.
- `js/expedition/progression.js`
  Public progression boundary for archipelago state, lookup, and drain/recovery access.
- `js/expedition/bridge-runtime.js`
  Public bridge lifecycle boundary for placement, weakening, collapse, and transition behavior.

### UI

- `js/ui/status-ui.js`
  Status summaries, overlays, pause state, and movement/path cost UI hooks.
- `js/ui/inventory-ui.js`
  Inventory slot rendering, portrait drawing, and slot selection handling.
- `js/ui/action-ui.js`
  Action-button availability, default hints, and player action dispatch.
- `js/ui/merchant-ui.js`
  Merchant and artisan panel rendering, quest submission, and trade interaction handling.
- `js/ui/dialogue-ui.js`
  Dialogue message presentation and future dialogue UI sync points.
- `js/ui/quest-ui.js`
  Active quest tracker rendering, merchant/artisan progress summary, and collapsible quest-card state.
- `js/ui/map-ui.js`
  Archipelago map overlay, fog-of-war drawing, and map button lifecycle outside the legacy UI facade.
- `js/ui/ui-system.js`
  Compatibility facade plus shared helpers while the UI split remains in progress.

### Narrative

- `js/npc/npc-registry.js`
  NPC archetype definitions and default dialogue mapping.
- `js/npc/npc-runtime.js`
  Stable npc id resolution and persisted NPC state lookup.
- `js/dialogue/dialogue-registry.js`
  Data-driven dialogue definitions with conditions and effects.
- `js/dialogue/dialogue-runtime.js`
  Dialogue start, node resolution, effect application, and active dialogue state.

### Houses

- `js/houses/layout/house-layout-core.js`
  Shared layout helpers such as tile keys, padding expansion, and local isometric projection.
- `js/houses/layout/house-footprints.js`
  Reusable cell-based footprint presets and random footprint selection.
- `js/houses/layout/house-layout-metadata.js`
  Cached wall segments, window placement, door choice, and roof span metadata.
- `js/houses/layout/house-placement.js`
  Chunk placement, overlap checks, and final placed house metadata.
- `js/houses/render/house-palettes.js`
  Palette packs for procedural SVG house families.
- `js/houses/render/house-svg-utils.js`
  Shared SVG point helpers and image creation utilities.
- `js/houses/render/house-body-builder.js`
  Floor, wall, door, and window geometry generation.
- `js/houses/render/house-interior-builder.js`
  Interior floor, perimeter border, and back-wall geometry for roof-hidden house mode.
- `js/houses/render/house-roof-builder.js`
  Roof, fringe, and chimney geometry generation.
- `js/houses/render/house-svg-builder.js`
  SVG assembly from geometry builders and cached layout metadata.
- `js/houses/render/house-variant-cache.js`
  Variant-level image cache for generated SVGs.
- `js/houses/render/house-drawer.js`
  Visible house draw pass.
- `js/houses/house-runtime.js`
  House world lookup, collision rules, and traversal rules.

### Rendering

- `js/render/camera-system.js`
  Projection and camera movement.
- `js/render/chunk-renderer.js`
  Chunk canvas cache creation and chunk drawing.
- `js/render/debug-renderer.js`
  Debug HUD updates and scene diagnostics output.
- `js/render/entity-renderer.js`
  Route, entity, interaction, and transient effect draw passes.
- `js/render/player-renderer.js`
  Player sprite loading, facing direction mapping, and sprite drawing with fallback.
- `js/render/scene-renderer.js`
  Island backdrop, camera-aware scene orchestration, and render entrypoints.

## DRY rules

1. Shared tile behavior belongs in `content-registry.js`.
2. Shared chunk or tile lookup belongs in `world-system.js`.
3. New gameplay systems should consume registries and world queries instead of duplicating lookup logic.
4. Cached object rendering should live with the object renderer, not in unrelated systems.
5. SVG palettes, SVG helpers, geometry builders, and caches should live in separate files.

## SRP rules

1. Generators create data.
2. Runtime systems answer game rules.
3. Render systems draw cached or queryable data.
4. Input systems decide intent, not world structure.
5. Movement systems play routes, not compute visuals.
6. Procedural SVG systems should separate presets, geometry, assembly, and caching.

## Extension workflow

When adding a new reusable object type:

1. Define its metadata and passability needs.
2. Add shared content behavior if needed in `content-registry.js`.
3. Add world query helpers if the object needs lookup outside its own module.
4. Add generator code to create chunk metadata once.
5. Split SVG work into presets, palettes, geometry builders, SVG assembly, and caching.
6. Expose a narrow runtime API through `window.Game.systems`.

## Performance rules

1. Avoid direct per-frame scans that can be precomputed during generation.
2. Avoid repeated `Object.keys(...).length` in render paths.
3. Prefer per-chunk or per-object caches over rebuilding geometry each frame.
4. Refresh derived player context only when the player tile changes.
5. Precompute reusable layout metadata once and reuse it in render builders.

## Next safe refactors

If the project keeps growing, the next safe splits are:

- remove compatibility fallback bodies from `js/ui/ui-system.js` after the delegated UI paths are browser-verified
- split `js/loot-system.js` chest tables again if reward, empty, and risky outcomes continue to grow independently
- split `js/expedition/island-layout.js` and `js/expedition/house-profiles.js` further if expedition content grows beyond the current shared/layout/profile boundaries
- add a small event bus so quest, shop, and interaction runtime changes stop relying on direct UI-triggered refresh chains
- repeat the house pipeline for other procedural object families:
  presets -> layout metadata -> geometry builders -> svg assembly -> cache -> runtime bridge
