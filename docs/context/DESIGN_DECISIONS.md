# Design decisions and rejected shortcuts

Labels: AUTHOR = explicit author direction in available discussion; CONTRACT = repository specification; WORKING = agent's provisional implementation or workflow; OPEN = needs further evidence/author decision. No claim that this captures all prior chat decisions.

| Status | Keep | Reject |
|---|---|---|
| AUTHOR | Emergent contextual facts from probabilities and prior culture/environment/history | Selecting prewritten NPC grave stories as canonical facts |
| AUTHOR | No combat; non-combat survival, crafting, exploration and investigation | Combat RPG or loot primarily for fighting |
| AUTHOR | Settlements and populations can move by physically possible maritime routes, remain, divide, perish or adapt; later occupation and territorial transfer arise from context and history | Fixed settlement-to-land identity, automatic flight/death, unconditional takeover, scripted wars or migration stories |
| AUTHOR | Distinct personal, elite, institutional and population trajectories; small individual circumstances emerge from earlier physical and historical causes | Copy collective fate to all actors, preset cowardly ruler, invent personal lore at NPC realization |
| AUTHOR | Independent detective pillar; separate early test slice | Reducing detective to survival modifiers or a collect-and-click quest |
| AUTHOR | Any earlier phase remains extensible or correctable when later features reveal new requirements; closure is a verified baseline | Treat accepted phases as permanently untouchable; fabricate missing upstream facts in late consumers |
| AUTHOR | After islands are ready, allow underwater exploration, mysteries and consequences to extend the same causal world through existing phases | Separate underwater history/geography with conflicting facts; require the entire underwater feature before current island completion |
| CONTRACT | Full causal sequence 0–26 with bridge 17.5; reduce density in V1 | Skip religion, mentality, memory or history to get playable islands faster |
| CONTRACT | Phase 17.5 translates established history into gameplay-facing biases | Late runtime invents why island/merchant/ruin exists |
| CONTRACT | Social states via existing/scoped narrative channels, debug separately | Automatic liar/trust icons, hover overlays, new UX without approval |
| AUTHOR | Ordinary/ironic dialogue, autonomy, cultural contradiction | All dialogue is functional exposition; all events tragic; effects-only humor |
| AUTHOR | Offline instantaneous NPC text target | Online per-turn model dependency as default |
| AUTHOR | Flat ornamental readable isometry, modularity, visual rhythm | Full-field small detail noise, generic dark fantasy or photorealism |
| WORKING | Causal counterfactuals with fixed local randomness, negative controls | Different random seeds as sole proof of causality |
| WORKING | Maritime demand modifies value of existing supported routes; provisional 0.20 coefficient | Arbitrarily changing physical coastline because maritime dependence increases |
| WORKING | Preserve coastJaggedness default 0.5 from existing bounds | Inventing an undocumented global control or declaring it approved art/design |
| WORKING | Separate author and technical gates | Declaring product ready from fixture tests |
| OPEN | Actual strength/distribution of strategic influences, additional channels | Premature tuning before real seed evidence |
| OPEN | Exact production blocks 3–5, NPC model and detailed visual refs | Filling gaps with invented decisions |

## Feedback protocol
Record new author decisions with date, source (chat excerpt or approved summary), scope, invariant, affected files/contracts, proposed regression and approval state. If rejected, record reason and what would justify reopening. Keep current decision rather than endless duplicate logs. Refer to detailed source docs in CONTEXT_MAP.md.

## Author decision — historical settlement continuity (2026-11-27)

Source: current project discussion; author explicitly requested that communities may migrate by sea, remain and perish, and that other communities may later occupy their land, through conflict, partition, responsible relocation or culturally/religiously/everyday motivated circumstances. This is an approved historical-generation principle, not approval of a particular algorithm or story. [Detailed direction and proposed acceptance checks](SETTLEMENT_MIGRATION_AND_TERRITORIAL_CONTINUITY.md). Scope: Phase 3–17 causal history, 17.5 evidence projection, 18–25 materialization; Phase 0–2 remain physical inputs. Historical wars are possible, not player combat. Specific event schema, rates, population resolution and ownership law remain design/contract work for their phases.

Author clarification (2026-11-27): a leader may abandon a population that later perishes and live on an allied continent. Keep individual and collective outcomes causally separate. This is an illustrative possible outcome, not a mandatory scenario. [Actor continuity and proposed checks](SETTLEMENT_MIGRATION_AND_TERRITORIAL_CONTINUITY.md#5-расхождение-коллективной-и-личной-судьбы-дополнение-автора-2026-11-27).

## Author decision — reversible phase development (2026-11-28)

Source: current project discussion. The author requires the ability to improve earlier phases while developing later phases and adding new features. This is a permanent development principle across 0–26, not permission to reverse generation causality or mutate a frozen world instance. [Phase evolution protocol](WORLDGEN_PHASE_EVOLUTION_PROTOCOL.md) records the proposed engineering workflow and compatibility requirements. No specific versioning system, cache invalidation engine or save migration implementation is approved or claimed implemented by this decision.

## Author direction — underwater extension (2026-11-28)

The author identifies future underwater content, mysteries and consequences as a concrete test of reversible phase development after islands are ready. Preserve a path to extend existing causal owners without replacing the concept. [Underwater extension direction](WORLDGEN_UNDERWATER_EXTENSION_DIRECTION.md). Specific gameplay, simulation and rendering scope remain open; this does not add implementation to 05-B.
