# codex_phase2_prompts
## Rebuilt prompt-pack for Codex — Phase 2 after completed Phase 1
**Repository:** `gdrclm/game`  
**Purpose:** this pack is rebuilt on top of the updated Phase 2 documentation stack after completed Phase 1. It is designed to reduce Codex reasoning load by making every prompt narrow, explicit, and contract-aware.

---

# Global instructions for every prompt

Before each prompt, Codex must read:
- `Phase_Map_Document.md`
- `00_master_seed_generator.md`
- `PHASE_INTERACTION_DOCUMENT.md`
- `WORLD_GENERATION_ORCHESTRATION.md`
- `macro_geography_package.md`
- `macro_geography_handoff_package.md`
- `Phase_2_Overview.md`
- `Phase_2_Handoff_From_Phase_1.md`
- `Phase_2_Pipeline.md`
- `Phase_2_Field_Contracts.md`
- `Phase_2_Validation.md`
- `Phase_2_Gameplay_Projection_Contract.md`
- `Phase_2_Codex_Execution_Protocol.md`

Codex must not:
- mix pressure and rhythm;
- weaken recovery / relief;
- duplicate climate generation;
- import forbidden handoff semantics;
- ignore record binding;
- flatten Phase 2 into scalar difficulty.

After each prompt, Codex must:
- list changed files;
- say what was done;
- say what was intentionally not done;
- update `Phase_2_Progress_Log.md`.

---

# Prompt 1
Create the Phase 2 code folder structure and module skeleton only.

Need:
- separate pressure, recovery/rhythm, validation, contracts, debug, export, orchestration folders
- contract-aware stubs only

Do not:
- implement field logic
- touch runtime systems

Acceptance:
- pressure, recovery, and rhythm are physically separated in code layout
- all stubs are marked as contract-first placeholders

---

# Prompt 2
Implement code-level package schemas for `PressureFieldPackage` and `EnvironmentalRhythmPackage`.

Need:
- stable shapes matching docs
- basic schema validators
- no field logic yet

Do not:
- mix burden and timing semantics
- make recovery optional

Acceptance:
- package validators fail on missing mandatory domains
- recovery domain is mandatory in rhythm package

---

# Prompt 3
Implement `Phase2InputBundle`.

Need:
- read completed Phase 1 root package
- allow only explicitly permitted handoff sections
- fail fast on missing required upstream records

Do not:
- scrape arbitrary Phase 1 internals
- invent upstream truth

Acceptance:
- bundle contains only allowed inputs
- forbidden handoff fields are blocked

---

# Prompt 4
Implement `Phase2RecordBindingLayer`.

Need:
- bind canonical record ids from completed Phase 1
- prepare per-record environmental context surfaces
- expose stable record-aware profiles

Do not:
- invent new record ids
- skip record binding in favor of anonymous fields

Acceptance:
- record-binding outputs exist for canonical record families
- summaries can later target real record ids

---

# Prompt 5
Implement normalization and deterministic helpers for Phase 2.

Need:
- normalized scalar handling
- deterministic RNG/sub-seed helpers
- provenance metadata support

Do not:
- erase contrast through over-smoothing

Acceptance:
- normalization and seed helpers are reusable across subgenerators

---

# Prompt 6
Implement climate burden interpretation only.

Need:
- derive burden from completed Phase 1 climate truth
- output climate pressure fields

Do not:
- rebuild climate generation
- add rhythm cadence

Acceptance:
- climate burden is clearly interpretation, not re-generation

---

# Prompt 7
Implement terrain harshness only.

Need:
- derive terrain burden from relief/mountain truth

Do not:
- add route timing
- add climate generation

Acceptance:
- terrain-only semantics remain clean

---

# Prompt 8
Implement hydrology stress only.

Need:
- derive water stress from river-basin and related truth

Do not:
- add scarcity cadence
- add food timing

Acceptance:
- hydrology stress stays pressure-side

---

# Prompt 9
Implement food reliability burden only.

Need:
- derive food support burden from hydrology, terrain, and climate burden

Do not:
- add scarcity timing

Acceptance:
- scarcity baseline remains pressure-side only

---

# Prompt 10
Implement travel exposure only.

Need:
- derive route burden from `macroRoutes`, terrain, and related pressure context

Do not:
- add navigation windows
- add route cadence

Acceptance:
- route burden correlates with completed Phase 1 route truth

---

# Prompt 11
Implement chokepoint pressure only.

Need:
- derive burden from `chokepoints`

Do not:
- add timing semantics
- invent choke meaning beyond environmental burden

Acceptance:
- chokepoint pressure is clearly tied to canonical chokepoint records

---

# Prompt 12
Implement isolation burden only.

Need:
- derive burden from `isolatedZones` and related route/access truth

Do not:
- add political or cultural periphery meaning

Acceptance:
- isolation stays environmental

---

# Prompt 13
Implement ecological fragility only.

Need:
- derive brittleness from support logic and physical context

Do not:
- add post-history collapse narrative

Acceptance:
- fragility stays environmental support logic

---

# Prompt 14
Implement catastrophe susceptibility only.

Need:
- derive severe-break susceptibility from canonical physical truth

Do not:
- generate actual catastrophe history
- add cadence yet

Acceptance:
- cause-specific risks stay separate

---

# Prompt 15
Implement pressure synthesis only.

Need:
- build synthesized burden layer while preserving domains

Do not:
- flatten to scalar difficulty

Acceptance:
- synthesized layer exists without replacing domains

---

# Prompt 16
Implement recovery / relief synthesis before the rest of rhythm work.

Need:
- recovery tempo
- stabilization interval
- relief persistence
- environmental forgiveness

Do not:
- leave recovery as summary-only output

Acceptance:
- relief becomes explicit field truth

---

# Prompt 17
Implement seasonality interpretation only.

Need:
- derive seasonal structure from completed climate truth

Do not:
- re-create climate bands

Acceptance:
- seasonality stays timing-only

---

# Prompt 18
Implement storm cadence interpretation only.

Need:
- derive cadence from climate/sea context

Do not:
- convert cadence into burden scalar

Acceptance:
- timing semantics remain readable

---

# Prompt 19
Implement navigation windows only.

Need:
- derive route-window timing from storm cadence + route context

Do not:
- overwrite travel burden

Acceptance:
- route timing and route burden remain distinct

---

# Prompt 20
Implement scarcity cadence only.

Need:
- derive shortage timing from support burden + seasonal timing

Do not:
- modify scarcity baseline

Acceptance:
- cadence remains rhythm-side

---

# Prompt 21
Implement predictability / rupture only.

Need:
- derive timing trust and break frequency

Do not:
- collapse it into low/high pressure

Acceptance:
- predictability and rupture remain separate

---

# Prompt 22
Implement rhythm synthesis only.

Need:
- build synthesized rhythm layer while preserving timing meaning

Do not:
- flatten to one volatility score

Acceptance:
- synthesized rhythm remains timing-aware and recovery-aware

---

# Prompt 23
Implement summary generation.

Need:
- pressure summaries
- rhythm summaries
- record-bound summaries

Do not:
- invent ideology or narrative

Acceptance:
- summaries are field-backed and useful

---

# Prompt 24
Implement structural, causal, and boundary validation.

Need:
- package integrity
- root-package causality
- anti-climate-duplication
- anti-handoff-leakage

Do not:
- reduce validation to booleans only

Acceptance:
- validation report shows explicit failure families

---

# Prompt 25
Implement distribution, design, and gameplay validation.

Need:
- contrast
- relief presence
- planning-style differentiation
- gameplay projection sufficiency

Do not:
- patch gameplay relevance with text-only summaries

Acceptance:
- punishment-only or gameplay-detached outputs can fail validation

---

# Prompt 26
Implement selective rebalance paths.

Need:
- triggers A–F from rebalance rules
- strictly local reruns only

Do not:
- reroll completed Phase 1
- mutate Phase 1 records

Acceptance:
- rebalance remains scoped and explicit

---

# Prompt 27
Implement Phase 2 orchestration engine and export.

Need:
- official execution order
- validation gate before export
- package export helpers

Do not:
- export invalid packages

Acceptance:
- execution order matches pipeline docs exactly

---

# Prompt 28
Implement smoke tests, regression tests, and representative profile snapshots.

Need:
- anti-scalar-collapse
- anti-recovery-loss
- anti-pressure-rhythm-collapse
- anti-climate-duplication
- anti-handoff-leakage
- anti-record-binding-loss
- representative profile seeds

Do not:
- rely only on manual inspection

Acceptance:
- semantic drift becomes test-detectable

---

# Prompt 29
Run docs/code sync pass.

Need:
- align implementation with updated docs
- update migration notes
- update progress log

Do not:
- silently drift contracts

Acceptance:
- docs and code agree on package meaning

---

# Prompt 30
Write final readiness note for downstream integration.

Need:
- what is production-like
- what is still foundation only
- what Phase 17.5 can safely consume later

Do not:
- begin later-phase implementation here

Acceptance:
- downstream work can continue without guessing Phase 2 maturity
