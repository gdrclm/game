# Disease Diagnosis Island Experience Rules

## Purpose

This document fixes the island-level experience rules for the disease-diagnosis layer of the archipelago survival game.

The disease investigation must not become a detached detective minigame. It must be experienced through survival pressure, island traversal, resource scarcity, social access, moral cost, and the changing medical goals given by the friend.

## Core Experience Rule

Each island must create a conflict between:

1. the friend's current objective;
2. the island's survival pressure;
3. the player's available resources, trust, route options, and inventory space.

The friend must not give a goal that can be completed as a clean checklist. The goal should force the player to pay a survival, social, moral, temporal, or logistical price.

Bad pattern:

```text
Friend asks for a sample.
Player walks to object.
Player clicks collect.
Player leaves.
```

Correct pattern:

```text
Friend asks for a sample.
The sample is behind a damaged bridge, guarded storehouse, hostile settlement, moral dilemma, or resource tradeoff.
The player must decide what to sacrifice: food, time, trust, safety, route stability, social relations, or future access.
```

## Mandatory Island Design Contract

Every major island must define the following fields:

```text
IslandId
SurvivalTheme
MiniQuestType
FriendObjective
DiseaseFragment
ConflictType
RequiredResourceOrAction
MoralOrSocialCost
CorrectConclusion
FalseReading
TransitionRequirement
NextIslandHook
```

If an island has no clear conflict between the friend's objective and the survival/social situation, the island is not ready for production.

## Anti-Repetition Rule

Two neighboring islands must not use the same dominant pattern.

Do not repeat this structure several times in a row:

```text
arrive -> read letter -> collect sample -> repair bridge -> leave
```

Instead, rotate the dominant pressure type.

Allowed pressure families:

```text
resource scarcity
route obstruction
inventory pressure
time-of-day pressure
weather/cold pressure
NPC trust gate
trade/economy gate
access/locked-place gate
moral dilemma
false-causality trap
medical urgency
systemic repair
social consequence
```

Each island may contain several pressures, but one must be dominant.

## Thematic Island Rule

Each island must have one thematic sentence.

Example:

```text
Island 05: Poverty decides who receives contaminated salt.
Island 11: Ritual law preserves an old mistake.
Island 15: The medicine can progress only if the hero breaks trust with the local elder.
Island 22: A repaired route can save patients, but it also reopens the trade chain that spread the disease.
```

If the island cannot be summarized in one strong sentence, its narrative role is unclear.

## Moral Dilemma Rule

At least some key islands must make the player choose between social harmony and medical progress.

The player should sometimes need to damage a relationship, expose a local secret, break a taboo, take a protected sample, or side against a respected local figure to advance the medicine or diagnosis.

This must not be random cruelty. The moral cost must be tied to the disease chain.

Example for Island 15:

```text
FriendObjective:
Obtain proof that the elder's storehouse contains old contaminated salt records.

SurvivalTheme:
The island is short on food and safe rest. The elder controls shelter access.

ConflictType:
Moral/social dilemma.

Player Choice:
- Keep relations with the elder: receive shelter and local trust, but lose access to the records.
- Expose the elder: gain evidence for the medicine and diagnosis, but damage trust with part of the settlement.
- Find a third path: spend more resources and time to obtain an independent witness or hidden archive entry.

DiseaseFragment:
The disease spread was not only natural. Local authority preserved the dangerous system because admitting the mistake would destroy social order.

CorrectConclusion:
Some communities protected themselves from panic by hiding the truth, and that concealment helped the disease persist.

FalseReading:
The elder is simply evil or the settlement is simply corrupt.
```

## Friend Objective Rule

The friend's letter must always do three things:

1. define a concrete island objective;
2. expose the friend's current medical hypothesis;
3. create a reason why the current island matters to the larger disease chain.

A letter is weak if it only adds mood or backstory.

Strong letter pattern:

```text
The last sample contradicts my water hypothesis.
If this island also shows burns on workers who never touched the marsh water, then the source is not the marsh itself.
Find a storage worker, inspect the lower storehouse, and bring back salt residue if you can do it without ruining the sample.
```

## Progression Rule

The islands should gradually shift the player's understanding:

```text
symptom -> local cause -> contradiction -> infrastructure link -> economic link -> social concealment -> medical correction -> systemic repair -> final synthesis
```

The player should not feel that each island is a separate case. The islands are chapters of one growing diagnosis.

## Acceptance Criteria

An island passes narrative-experience review only if all checks are true:

```text
[ ] The island teaches or tests one mini-quest type.
[ ] The island has a distinct survival theme.
[ ] The friend's objective is concrete and actionable.
[ ] The objective conflicts with survival, trust, time, route, inventory, or morality.
[ ] The island reveals one disease fragment.
[ ] The island has one correct conclusion and one plausible false reading.
[ ] The island has a transition requirement that makes sense in survival terms.
[ ] The island does not repeat the dominant structure of the previous island.
[ ] The island has one thematic sentence.
[ ] The island creates a hook for the next island.
```

## Production Warning

Do not design islands as identical algorithms with different props.

The disease system exists to make the player want to continue across the archipelago because each island changes what the hero believes, what the friend needs, what the medicine requires, and what social price must be paid.
