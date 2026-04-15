# Progress Log

## Changelog Discipline

- If a task introduces Phase 0 schema drift, its progress entry must include an explicit migration note.
- A migration note must say which contracts/docs were updated and whether the drift was additive, rename/removal, or semantic reinterpretation.
- No contract-visible field meaning may change silently; if no migration note is present, the change should be treated as non-schema work.

## 2026-04-13

### PH0-MICRO-01
- Created the initial `js/worldgen/phase0/` scaffold with an isolated `window.Game.systems.worldgenPhase0` namespace plus `window.Game.systems.worldgen.phase0` bridge.
- Added explicit stub modules and folders for orchestration, contracts, validation, debug artifacts, adapters, deterministic RNG, profile synthesis, tone synthesis, derived tendencies, and sub-seed derivation.
- Wired Phase 0 scripts into `index.html` in a safe pre-Phase-1 load order, while keeping every future generation-facing function as an explicit `TODO CONTRACTED` stub.
- Kept latent axis synthesis, world tone logic, derived tendencies logic, sub-seed derivation logic, and Phase 1/macro geography integration out of scope for this microstep.

### PH0-MICRO-02
- Refined `js/worldgen/phase0/index.js` into a dedicated public export surface for Phase 0 instead of a plain string-only entry list.
- Added a frozen public API builder plus safe entry-point discovery helpers: descriptor export, presence check, and resolver for the approved Phase 0 surface only.
- Kept `index.js` strictly as an export/coordination layer: no validation rules, no world synthesis, no sub-seed logic, and no gameplay/UI coupling were added.

### PH0-MICRO-03
- Replaced the Phase 0 `contracts.js` stub with a dedicated runtime contract module for all official Phase 0 outputs and the export bundle shape.
- Added contract descriptors, skeleton factories, structural validators, and assertion helpers for `WorldSeedProfile`, `DerivedWorldTendencies`, `WorldSubSeedMap`, `Phase0ValidationReport`, and the full Phase 0 bundle.
- Kept the module strictly structural: no profile synthesis, no world-tone generation, no sub-seed derivation logic, and no Phase 1 or gameplay-specific rules were added.

### PH0-MICRO-04
- Replaced the Phase 0 RNG stub with a working deterministic wrapper in `js/worldgen/phase0/deterministic-rng.js`.
- Added a seed-stable draw API for Phase 0 submodules: `nextFloat`, `nextRange`, `nextInt`, `nextBool`, `nextIndex`, `pick`, `shuffle`, plus seed/state/draw-count snapshot helpers.
- Kept sub-seed derivation explicitly out of scope; the module currently initializes only a root Phase 0 RNG context and marks sub-seed work as deferred.

### PH0-MICRO-05
- Replaced the `assemblePhase0Bundle` stub in `js/worldgen/phase0/master-seed-generator.js` with a working root export bundle assembler.
- Added canonical root packaging for `worldSeedProfile`, `derivedWorldTendencies`, `worldSubSeedMap`, and `validationReport`, backed by existing contract skeleton factories and structural assertion.
- Kept the step strictly assembly-only: no profile synthesis, no tendency synthesis, no sub-seed derivation, and no validation scoring logic were added.

### PH0-MICRO-06
- Replaced the Phase 0 validation stub with a deterministic validation-report builder in `js/worldgen/phase0/validation.js`.
- Added canonical score-map and diagnostics-structure helpers, then exposed `buildPhase0ValidationReport` through the Phase 0 public API for downstream assembly/debug usage.
- Kept actual scoring rules and reroll-advice generation out of scope; `validatePhase0Export` still remains an explicit `TODO CONTRACTED` stub for a later pass.

### PH0-MICRO-07
- Replaced the Phase 0 debug stub with a deterministic summary exporter in `js/worldgen/phase0/debug/index.js`.
- Added JSON-friendly summary export, markdown summary export, and a safe debug artifact bundle that packages normalized snapshots for profile, tendencies, sub-seeds, and validation report.
- Extended the public Phase 0 API with debug-summary entry points while keeping visual debug UI, heatmaps, and any gameplay-facing debug surfaces out of scope.

### PH0-MICRO-08
- Implemented a dedicated `intakeBaseRandomSeed()` step in `js/worldgen/phase0/master-seed-generator.js` for required Phase 0 seed ingestion.
- Updated `normalizePhase0Input()` to use the new base-seed intake and return a deterministic frozen input object containing only normalized `baseRandomSeed`.
- Exposed the intake step through the Phase 0 public API while keeping `worldPresetMode` and `hardConstraintsProfile` explicitly out of scope for later microsteps.

### PH0-MICRO-09
- Implemented `intakeWorldPresetMode()` in `js/worldgen/phase0/master-seed-generator.js` for optional Phase 0 preset-mode intake.
- Added deterministic preset normalization in the input layer: trimming, lowercase/underscore canonicalization, and explicit null-like aliases without turning presets into world tone or final world truth.
- Updated `normalizePhase0Input()` and the Phase 0 public API to include the optional normalized `worldPresetMode`, while keeping hard-constraints intake out of scope.

### PH0-MICRO-10
- Implemented `intakeHardConstraintsProfile()` in `js/worldgen/phase0/master-seed-generator.js` for optional Phase 0 hard-constraints intake.
- Added a deterministic shallow ingestion layer for recognized `WorldSeedProfile` numeric axes, with unit-interval normalization and a frozen canonical `hardConstraintsProfile` payload for constraint-driven runs.
- Updated `normalizePhase0Input()` and the Phase 0 public API to expose the optional normalized `hardConstraintsProfile`, while explicitly deferring richer bounds semantics and latent-axis application.

### PH0-MICRO-11
- Added `normalizePhase0Options()` in `js/worldgen/phase0/master-seed-generator.js` as a dedicated normalization layer for Phase 0 optional input fields.
- Centralized canonical option shaping for `worldPresetMode` and `hardConstraintsProfile`, with safe defaults for missing, partial, or non-object option payloads.
- Updated `normalizePhase0Input()` and the Phase 0 public API to consume the normalized option object without introducing deeper invalid-option rejection or any profile synthesis logic.

### PH0-MICRO-12
- Added explicit invalid-option rejection in `js/worldgen/phase0/master-seed-generator.js` for Phase 0 intake payloads.
- `normalizePhase0Options()` now rejects non-object option payloads, unknown top-level option keys, and unknown keys inside `hardConstraintsProfile`, returning readable error messages with allowed-key lists.
- Kept the step strictly in the intake layer: no UI handling, no downstream adapter expansion, and no latent-axis synthesis were added.

### PH0-MICRO-13
- Replaced the `buildWorldSeedProfile()` stub in `js/worldgen/phase0/world-profile-synthesizer.js` with deterministic raw latent-axis generation for all canonical Phase 0 numeric axes.
- Wired profile synthesis to the existing Phase 0 input normalization, contract skeletons, and deterministic RNG wrapper, using a fixed per-axis draw order under a dedicated RNG scope.
- Kept the step strictly raw: no anti-flatness shaping, no correlation shaping, and no real world-tone synthesis were added; `worldTone` currently remains a contract-safe placeholder fallback.

### PH0-MICRO-14
- Added an explicit normalized range enforcement layer in `js/worldgen/phase0/world-profile-synthesizer.js` for canonical Phase 0 profile axes.
- Introduced clamp-based post-processing helpers that guarantee all latent-axis values remain in `[0.0 .. 1.0]` before profile assembly, without changing field semantics.
- Wired `buildWorldSeedProfile()` through this safety layer while keeping anti-flatness shaping and other higher-order transforms out of scope.

### PH0-MICRO-15
- Added deterministic anti-flatness shaping in `js/worldgen/phase0/world-profile-synthesizer.js` to push overly generic mid-range axis values away from profile sludge.
- Introduced a controlled expressiveness layer with fixed shaping parameters, center-distance expansion, and a deadzone floor, while preserving explicit hard-constrained axes as-is.
- Wired `buildWorldSeedProfile()` through the anti-flatness pass after normalized range enforcement and before profile assembly, without adding pair consistency adjustment or world-tone synthesis.

### PH0-MICRO-16
- Added deterministic correlation shaping in `js/worldgen/phase0/world-profile-synthesizer.js` through a dedicated correlation RNG scope plus fixed cluster-driven and axis-driven blending rules.
- Implemented correlation-aware shaping helpers for latent axes so related fields now influence each other before anti-flatness shaping, while explicit hard-constrained axes remain unchanged.
- Kept the step strictly limited to correlated sampling / shaping: no final pair consistency pass, no geography logic, and no history logic were added.

### PH0-MICRO-17
- Added deterministic pair consistency adjustment in `js/worldgen/phase0/world-profile-synthesizer.js` for documented tension-pairs inside the Phase 0 profile.
- Introduced a soft contradiction-reduction pass that gently dampens conflicting high-high pairs while preserving explicit hard-constrained axes and keeping the profile expressive.
- Wired `buildWorldSeedProfile()` through the new pair-adjustment layer after correlation and anti-flatness shaping, without adding world-tone synthesis or a full validation reroll loop.

### PH0-MICRO-18
- Replaced the Phase 0 `world-tone-synthesizer.js` stub with a deterministic descriptive `worldTone` derivation layer that reads only the numeric `WorldSeedProfile` axes.
- Added readable tone selection across a fixed descriptor registry so `worldTone` is now synthesized from profile shape instead of relying on the contract fallback value or on preset-mode control.
- Wired `buildWorldSeedProfile()` through the new tone pass after latent-axis shaping and pair consistency adjustment, while keeping derived tendencies, validation scoring, and downstream phase logic out of scope.

### PH0-MICRO-19
- Replaced the `js/worldgen/phase0/derived-tendencies.js` stub with a partial deterministic derived-tendency pass for `likelyWorldPattern`.
- Added a readable world-pattern descriptor registry and scoring pass derived only from `WorldSeedProfile`, while preserving contract-safe defaults for the other tendency fields.
- Kept `likelyConflictMode`, `likelyCollapseMode`, `likelyReligiousPattern`, and `likelyArchipelagoRole` explicitly deferred to their dedicated future microsteps.

### PH0-MICRO-20
- Extended `js/worldgen/phase0/derived-tendencies.js` with deterministic `likelyConflictMode` synthesis derived only from the existing normalized `WorldSeedProfile`.
- Added a readable conflict-mode descriptor registry covering route, dynastic, frontier-pressure, religious-fragmentation, and resource/isolation conflict patterns.
- Kept `likelyCollapseMode`, `likelyReligiousPattern`, and `likelyArchipelagoRole` explicitly deferred to later microsteps and preserved them on contract-safe defaults for now.

### PH0-MICRO-21
- Extended `js/worldgen/phase0/derived-tendencies.js` with deterministic `likelyCollapseMode` synthesis derived only from the normalized `WorldSeedProfile`.
- Added a readable collapse-mode descriptor registry covering slow-periphery fade, sudden route cascade, dynastic disintegration, ecological shock breakdown, and compound collapse.
- Kept `likelyReligiousPattern` and `likelyArchipelagoRole` explicitly deferred to later microsteps and preserved them on contract-safe defaults for now, without adding any validation scoring logic.

### PH0-MICRO-22
- Extended `js/worldgen/phase0/derived-tendencies.js` with deterministic `likelyReligiousPattern` synthesis derived only from upstream Phase 0 profile semantics.
- Added a readable religious-pattern descriptor registry covering high orthodoxy, reform-prone, fear-and-appeasement, trade-syncretic, and memory-bound ancestral patterns.
- Kept `likelyArchipelagoRole` explicitly deferred to its later microstep and preserved it on a contract-safe default, without introducing formal religion systems or any Phase 3/4 logic.

### PH0-MICRO-23
- Extended `js/worldgen/phase0/derived-tendencies.js` with deterministic `likelyArchipelagoRole` synthesis derived only from Phase 0 profile semantics as a readable downstream hint.
- Added a readable archipelago-role descriptor registry covering bridge, customs belt, wound of world, imperial chain, remnant core, and exilic edge patterns for Phase 1/15-facing interpretation.
- Kept the output strictly as a descriptive summary hint: no geography generation was added, and the future archipelago role generator is not replaced by this layer.

### PH0-MICRO-24
- Added an official downstream phase namespace registry in `js/worldgen/phase0/subseed-deriver.js` for all current `WorldSubSeedMap` contract keys.
- Introduced stable naming-convention helpers plus namespace-resolution helpers so later sub-seed derivation can use a single source of truth for phase names and contract keys.
- Kept actual sub-seed derivation explicitly out of scope and left `deriveWorldSubSeedMap()` as a deferred stub, without mixing registry logic into the RNG wrapper.

### PH0-MICRO-25
- Replaced the `deriveWorldSubSeedMap()` stub in `js/worldgen/phase0/subseed-deriver.js` with stable deterministic sub-seed derivation from root seed plus normalized world-profile context.
- Added a profile-context signature and per-namespace uint32 hash pass so all `WorldSubSeedMap` contract keys now export reproducible downstream seeds.
- Kept deeper collision-safe namespace derivation and downstream adapter work explicitly deferred to later microsteps.

### PH0-MICRO-26
- Extended `js/worldgen/phase0/subseed-deriver.js` with deterministic collision-safe namespace derivation for downstream sub-seeds.
- Added a stable retry/salt pass on top of namespace hashing so every `WorldSubSeedMap` key resolves to a distinct downstream seed without changing the phase registry design.
- Kept phase-specific consumers and downstream adapter work out of scope for this microstep.

### PH0-MICRO-27
- Extended `js/worldgen/phase0/subseed-deriver.js` with a downstream-readable sub-seed export layer on top of `WorldSubSeedMap`.
- Added an export-contract descriptor plus helpers to build readable export entries and resolve seeds by contract key or namespace id without introducing bridge adapters.
- Kept real downstream generators and Phase 1 bridge adapters out of scope for this microstep.

### PH0-MICRO-28
- Extended `js/worldgen/phase0/validation.js` with deterministic expressiveness scoring for Phase 0 non-flatness.
- Added a pure profile-based score pass and integrated it into `buildPhase0ValidationReport()` so `scores.expressiveness` is now computed from `WorldSeedProfile` when provided.
- Kept controlled-extremeness, derived-readability, archipelago-potential, and downstream-usability scoring explicitly deferred to later microsteps.

### PH0-MICRO-29
- Extended `js/worldgen/phase0/validation.js` with deterministic controlled-extremeness scoring for Phase 0 profile validation.
- Added a pure profile-based penalty model for overly extreme multi-axis profiles and integrated it into `buildPhase0ValidationReport()` as `scores.controlledExtremeness`.
- Kept reroll advice, derived-readability, archipelago-potential, and downstream-usability scoring explicitly deferred, and did not modify latent axes outside validation output.

### PH0-MICRO-30
- Extended `js/worldgen/phase0/validation.js` with deterministic `derivedReadability` scoring for the readable synthesis layer of Phase 0.
- Added a validation-context-driven score pass that checks coverage, descriptor shape, label distinctness, and canonical consistency of `worldTone` plus `DerivedWorldTendencies`.
- Integrated the score into `buildPhase0ValidationReport()` without rewriting world-tone synthesis and without expanding into reroll advice or downstream adapters.

### PH0-MICRO-31
- Extended `js/worldgen/phase0/validation.js` with deterministic `archipelagoPotential` scoring derived only from `WorldSeedProfile`.
- Added a pure profile-based scoring pass centered on maritime relevance, route fragility, migration pressure, cultural permeability, and collapse support, with a penalty floor for too-low maritime dependence.
- Integrated the score into `buildPhase0ValidationReport()` while keeping geography generation and downstream-usability scoring explicitly out of scope.

### PH0-MICRO-32
- Extended `js/worldgen/phase0/validation.js` with deterministic `downstreamUsability` scoring for later-phase consumption readiness.
- Added a validation-context-driven pass that evaluates profile presence, derived summary coverage, sub-seed-map coverage/distinctness, and canonical consistency without introducing late-phase adapters.
- Integrated downstream diagnostics into `buildPhase0ValidationReport()` warnings and `blockedDownstreamPhases`, while keeping reroll advice explicitly deferred.

### PH0-MICRO-33
- Extended `js/worldgen/phase0/validation.js` with deterministic reroll-advice generation from the current validation context.
- Added canonical advice outputs for `latent_reroll`, `correlation_reroll`, and `full_phase0_reroll`, driven by existing scores plus downstream blocking diagnostics.
- Integrated reroll advice into `buildPhase0ValidationReport()` without triggering any automatic reroll execution or mutating frozen exports.

### PH0-MICRO-34
- Extended `js/worldgen/phase0/debug/index.js` with a human-readable markdown summary export for Phase 0 review/debug usage.
- Upgraded the markdown export from a short list into a structured summary with overview, derived layer, profile highlights, full axis table, validation scores, diagnostics, and downstream seed preview.
- Kept the change inside the debug export layer only, without introducing web UI or auto-writing docs outside debug/export flows.

### PH0-MICRO-35
- Extended `js/worldgen/phase0/debug/index.js` with a machine-readable JSON snapshot export for the full Phase 0 bundle.
- Added deterministic JSON serialization via a stable key-sorting pass and exposed both snapshot-object and serialized-string entry points for debug/export usage.
- Kept the snapshot path separate from validation mutation and did not introduce any graphical debug tooling.

### PH0-MICRO-36
- Added a dedicated deterministic regression-test harness for Phase 0 under `tests/`, isolated from later-phase integration flows.
- Covered same-seed stability for the full Phase 0 output surface, including `WorldSeedProfile`, derived tendencies, sub-seeds, validation report, markdown summary, and serialized JSON snapshot.
- Wired the new harness into the existing Playwright test flow with a separate Phase 0 spec, without adding flaky randomized expectations or late-phase integration tests.

### PH0-MICRO-37
- Extended the existing Phase 0 regression harness with explicit contract-conformance checks against the official runtime contract validators and assertion helpers.
- Added coverage for `WorldSeedProfile`, `DerivedWorldTendencies`, `WorldSubSeedMap`, and `Phase0ValidationReport` so canonical Phase 0 outputs now prove conformance to the shipped contracts.
- Kept the step test-only: no contract rewrites, no generation changes, and no unrelated runtime logic were introduced.

### PH0-MICRO-38
- Added an explicit schema-drift and migration-note discipline to the Phase 0 execution protocol.
- Recorded changelog rules in `docs/progress_log.md` so any future contract-visible drift must state updated docs/contracts plus the drift type.
- Kept the step documentation-only: no refactor automation, no runtime changes, and no silent semantic field changes were introduced.

### PH0-MICRO-39
- Added a deterministic Phase 1-safe summary bundle export in `js/worldgen/phase0/adapters/index.js` that exposes only the upstream Phase 0 truths PHASE 1 is allowed to read plus `macroGeographySeed`.
- Exposed the new adapter through the Phase 0 public API and covered it in the existing Phase 0 regression harness without introducing any Macro Geography logic or Phase 1-side world mutation.
- Migration note: additive runtime-interface drift only. Updated the source-of-truth interface docs in `tasks/worldgen_docs_phase0/world_gen/04_subseed_namespace_and_interfaces.md` and `tasks/worldgen_docs_phase0/world_gen/contracts/phase0_runtime_interfaces.md` for the new `buildPhase1SafeSummaryBundle(...)` export.

### PH0-MICRO-40
- Added deterministic frozen output wrappers in `js/worldgen/phase0/adapters/index.js` for immutable handoff semantics after Phase 0 export.
- Exposed the wrapper builder through the Phase 0 public API and covered it in the existing Phase 0 regression harness without changing any downstream consumers or gameplay bridges.
- Migration note: additive runtime-interface drift only. Updated the source-of-truth interface docs in `tasks/worldgen_docs_phase0/world_gen/04_subseed_namespace_and_interfaces.md` and `tasks/worldgen_docs_phase0/world_gen/contracts/phase0_runtime_interfaces.md` for the new `buildFrozenPhase0OutputWrappers(...)` export.

## 2026-04-12

### PH1-MICRO-01
- Created the initial `js/worldgen/macro/` scaffold for Phase 1 with isolated stub modules and a dedicated `debug/` entry point.
- Added manual script registration in `index.html` so `window.Game.systems.worldgenMacro` and `window.Game.systems.worldgen.macro` are available as inert foundation entry points.
- Kept all new generation-facing functions as explicit `TODO CONTRACTED` stubs without field logic, route logic, climate logic, tectonic logic, or marine logic.

### PH1-MICRO-02
- Implemented a runtime `MacroGeographyPackage` contract/module in `js/worldgen/macro/contracts.js`.
- Added a schema descriptor export, an empty package skeleton factory, and basic structural validation with optional semantic completeness checks.
- Kept generation logic out of the contract step: the package builder and generator remain separate future tasks.

### PH1-MICRO-03
- Implemented `ContinentRecord` contract/schema in `js/worldgen/macro/region-contracts.js`.
- Added a continent skeleton factory, basic validation, assertion helper, and region contract registry export for downstream modules.
- Kept the rest of region-level contracts as explicit `TODO CONTRACTED` placeholders.

### PH1-MICRO-04
- Implemented `SeaRegionRecord` contract/schema in `js/worldgen/macro/region-contracts.js`.
- Added a sea-region skeleton factory, validation, assertion helper, and explicit entry-point metadata for future analyzer modules.
- Kept marine generation and the remaining region-level contracts out of scope for this microstep.

### PH1-MICRO-05
- Implemented `ArchipelagoRegionRecord` contract/schema in `js/worldgen/macro/region-contracts.js`.
- Added an archipelago skeleton factory, validation, assertion helper, and downstream contract metadata for future historical generation.
- Kept archipelago significance calculation and analyzer logic out of scope for this microstep.

### PH1-MICRO-06
- Implemented `ChokepointRecord` contract/schema in `js/worldgen/macro/region-contracts.js`.
- Added a chokepoint skeleton factory, validation, assertion helper, and export metadata for future chokepoint analyzer usage.
- Kept chokepoint detection and route-dependency analysis out of scope for this microstep.

### PH1-MICRO-07
- Implemented `MacroRouteRecord` contract/schema in `js/worldgen/macro/region-contracts.js`.
- Added a macro-route skeleton factory, validation, assertion helper, and export metadata for future route analysis usage.
- Kept route construction and route graph analysis out of scope for this microstep.

### PH1-MICRO-08
- Implemented `StrategicRegionRecord` contract/schema in `js/worldgen/macro/region-contracts.js`.
- Added a strategic-region skeleton factory, base validation including normalized `valueMix`, and assertion/export helpers.
- Kept strategic-region synthesis and downstream strategic analysis out of scope for this microstep.

### PH1-MICRO-09
- Implemented `ValidationReport` contract/schema in `js/worldgen/macro/contracts.js`.
- Added a dedicated validation-report skeleton factory plus contract-level validation and assertion helpers for scoring and diagnostics shape.
- Kept scoring computation and validation-report building logic out of scope for this microstep.

### PH1-MICRO-10
- Added `js/worldgen/macro/macro-types.js` as a unified export layer for Phase 1 contracts, skeleton factories, validators, assertions, and raw registries.
- Exposed a single `getMacroTypesApi()` entry point plus smaller grouped accessors for contracts/factories/validators/assertions.
- Kept the module strictly as an aggregation layer with no generator logic.

### PH1-MICRO-11
- Replaced the `js/worldgen/macro/deterministic-rng.js` stub with a working seed-stable RNG wrapper for Macro Geography.
- Added a convenient draw API (`nextFloat`, `nextRange`, `nextInt`, `nextBool`, `nextIndex`, `pick`, `shuffle`) plus state/snapshot helpers.
- Kept sub-seed derivation out of scope; `createMacroSeedScope()` currently wraps the same seed and is explicitly marked `TODO CONTRACTED` for future sub-seed work.

### PH1-MICRO-12
- Added deterministic sub-seed derivation in `js/worldgen/macro/deterministic-rng.js` from a master seed plus full namespace.
- Fixed namespace conventions through a dedicated API: root `macro`, dot-separated lowerCamelCase segments, and pipeline-oriented namespace examples.
- Added scope helpers for subgenerators (`deriveSubSeed`, `createSubScope`, `createChildRng`) without implementing any generator logic on top.

### PH1-MICRO-13
- Added `js/worldgen/macro/macro-seed-profile.js` with a dedicated `MacroSeedProfile` contract for Phase 1 seed/profile intake.
- Implemented an ingestion layer that normalizes external inputs from flat params or nested `WorldSeedProfile`-style payloads into a deterministic macro seed profile.
- Exposed the new contract/factory/validator/assertion helpers through the shared macro entry points and type aggregator without starting world generation.

### PH1-MICRO-14
- Added explicit default bounds for Phase 1 world-seed constraint axes in `js/worldgen/macro/macro-seed-profile.js`.
- Implemented reusable normalization helpers for constraint values, per-field bounds access, and neutral default constraint snapshots.
- Switched `MacroSeedProfile` numeric ingestion to the new bounds-based normalization layer without mixing it into UI or gameplay options.

### PH1-MICRO-15
- Added deterministic `MacroSeedProfile` serialization for JSON-friendly debug snapshots in `js/worldgen/macro/macro-seed-profile.js`.
- Implemented a dedicated seed-profile debug export artifact with normalized profile data, bounds, constraint summary, and validation payload.
- Exposed the new seed-profile debug export through Phase 1 debug entry points without adding heatmaps or expanding the future debug bundle builder.

### PH1-MICRO-16
- Added `js/worldgen/macro/scalar-field.js` with a base `ScalarField` abstraction for Phase 1 field layers.
- Implemented deterministic field read/write/fill operations plus sampling modes `nearest` and `bilinear` with explicit edge handling.
- Exposed `createScalarField()` and `getScalarFieldDescriptor()` through the top-level macro entry points without introducing multi-channel fields, composers, or heatmap export.

### PH1-MICRO-17
- Added `js/worldgen/macro/directional-field.js` with a base `DirectionalField` abstraction for Phase 1 direction layers.
- Implemented deterministic direction storage as normalized XY vectors with read/write/fill operations plus `nearest` and `bilinear` sampling.
- Exposed `createDirectionalField()` and `getDirectionalFieldDescriptor()` through the top-level macro entry points without introducing masks, composers, or other field-composition logic.

### PH1-MICRO-18
- Added `js/worldgen/macro/mask-field.js` with a base `MaskField` abstraction and `ConstraintField` alias for Phase 1 restriction layers.
- Implemented deterministic read/write/fill operations, explicit `allow`/`block` helpers, and basic sampling with threshold-based `isAllowed` / `isBlocked`.
- Exposed `createMaskField()`, `createConstraintField()`, and matching descriptor helpers through the top-level macro entry points without coupling the mask layer to terrain generation.

### PH1-MICRO-19
- Added `js/worldgen/macro/field-composer.js` with a generic deterministic `FieldComposer` for scalar-compatible field composition.
- Implemented stable compositing rules `sum`, `average`, `min`, `max`, and `multiply` plus per-entry `weight`, `gain`, `bias`, and `sampleOptions`.
- Exposed `createFieldComposer()` and `getFieldComposerDescriptor()` through the top-level macro entry points without adding any domain-specific tectonic or terrain logic.

### PH1-MICRO-20
- Added `js/worldgen/macro/field-normalizer.js` with a generic deterministic `FieldNormalizer` for scalar-compatible field range normalization.
- Implemented a unified API for single values, sampled values, and full-field materialization with `clamp`, `remap`, and `remapClamp` modes.
- Exposed `createFieldNormalizer()`, descriptor helpers, and top-level normalization helpers through the macro entry points without adding debug export or domain-specific field logic.
