# WORLDGEN V1 VISUAL UI BOUNDARY AND SOCIAL MARKERS CORRECTION

## Status
Correction document for V1 visual asset planning.

## Purpose

This document corrects an overreach in the V1 visual asset discussion around social / trust / moral markers.

The project must not introduce new UI functionality merely because the visual register mentions markers, icons, or overlays.

Social, trust, access, and moral states must be treated first as worldgen/runtime data tags and narrative content, not as automatically visible hover markers or new interactive UI systems.

---

# Hard Boundary

Do not add new player-facing UI modes unless explicitly approved in a separate UX/runtime task.

Forbidden assumptions:

```text
no automatic hover popups;
no new cursor tooltip system;
no new always-visible social markers over NPCs;
no new morality icons floating over the map;
no new investigation overlay mode unless separately specified;
no new journal/diary layout beyond already planned channels;
no new diagnosis board UI unless separately scoped;
no new map marker behavior unless runtime/map systems already support it;
```

The visual register must not imply that these systems already exist.

---

# Allowed Channels In V1

Social/trust/moral information may appear only through already intended or explicitly scoped channels:

```text
friend letters;
hero notes / notebook / diary entries;
analysis text window;
inspection result text;
dialogue text;
quest/objective text;
debug exports;
manual visual test tables;
validation reports.
```

If a channel is not implemented yet, the data can exist in debug/export form only.

---

# Correct Meaning Of Social / Trust / Moral Visuals

These are not physical terrain tiles.

They are not automatic player-facing overlays.

They are data categories that may later receive visual support if UX explicitly requires it.

Correct V1 interpretation:

```text
socialAccessGate
trustRequirement
moralCost
authorityControl
religiousRestriction
factionControl
witnessRole
concealerRole
repairHelperRole
consequenceTrustLoss
consequenceAccessGain
friendObjectiveConflict
```

These are worldgen/runtime tags first.
They are visual assets only if a specific UI or world-object carrier exists.

---

# Correct Usage By Channel

## 1. Friend letter

Allowed:

```text
The letter states the goal and the conflict.
Example: The friend asks for a storage record, but the record is controlled by the elder.
```

Not allowed by default:

```text
floating icon over the elder;
automatic tooltip over the storehouse;
new map marker unless map marker system explicitly supports it.
```

## 2. Notebook / diary / notes

Allowed:

```text
A note records that the elder controls access to the storehouse.
A note records that exposing the elder may damage settlement trust.
```

Not allowed by default:

```text
new separate morality panel;
new social graph UI;
new relationship overlay.
```

## 3. Analysis window / inspection text

Allowed:

```text
The analysis text says that the seal on the door belongs to the local authority.
The analysis text says the restriction is social, not physical.
```

Not allowed by default:

```text
cursor hover popup;
automatic per-tile tooltip;
new analysis overlay mode.
```

## 4. Dialogue text

Allowed:

```text
NPC dialogue reveals, hides, contradicts, or conditions access.
```

Not allowed by default:

```text
visible liar icon;
visible trust meter over the NPC;
automatic social state badge.
```

## 5. Debug export / validation report

Allowed:

```text
Debug table: island15.socialAccessGate = elder_controlled_storehouse.
Validation: friend objective conflicts with social access.
Validation: third path exists / missing.
```

Debug output can be explicit because it is not player-facing UX.

---

# Correct Replacement For The Word "Marker"

In V1 docs, use these terms instead:

```text
data tag
state tag
debug tag
notebook entry type
friend-letter objective type
analysis text category
validation category
```

Use "marker" only when there is a concrete existing visual carrier:

```text
physical sign prop;
seal on a door;
ledger object;
forbidden boundary object;
debug map symbol;
manual test export icon.
```

---

# Examples

## Bad V1 wording

```text
Show a trust gate marker on the storehouse when the player hovers it.
```

Why bad:

```text
Hover system was not scoped.
Storehouse social state display was not scoped.
It invents UI behavior.
```

## Correct V1 wording

```text
Storehouse has socialAccessGate: elder_controlled.
The friend letter explains that the record is controlled by the elder.
The analysis text may mention the elder seal if the player inspects the door.
The debug export shows the gate and its downstream consequences.
```

---

## Bad V1 wording

```text
Put a moral dilemma icon on island 15.
```

Why bad:

```text
No player-facing moral icon system exists.
```

## Correct V1 wording

```text
Island 15 has moralCostProfile: expose_elder_vs_keep_shelter.
The friend letter frames the goal.
The diary records the dilemma after discovery.
The validation report confirms that the friend objective conflicts with social trust/access.
```

---

## Bad V1 wording

```text
Show a liar marker over the NPC.
```

Why bad:

```text
It destroys investigation and invents player-facing UI.
```

## Correct V1 wording

```text
NPC has diseaseRole: concealer.
Dialogue and evidence can reveal contradictions.
Debug export may show npcRole = concealer for developer review.
The player-facing layer should reveal this through text, not icon labels.
```

---

# Correct Island 15 Usage

Data:

```text
island15.friendObjective = obtain_storage_record
island15.socialAccessGate = elder_controlled_storehouse
island15.moralCostProfile = expose_elder_vs_keep_shelter
island15.thirdPath = worker_witness_through_hazard_route
```

Player-facing content:

```text
Friend letter:
The friend asks for the storage record and warns that the sample chain is incomplete without it.

Analysis text:
The door seal shows this is not an abandoned building. Someone still claims authority over it.

Diary/note:
The elder controls the record. Direct exposure may cost shelter and trust.

Dialogue:
The elder avoids explaining why the old storage records are sealed.
```

Debug-only content:

```text
socialAccessGate: elder_controlled_storehouse
moralCostProfile: expose_elder_vs_keep_shelter
thirdPathExists: true
friendObjectiveConflictValid: true
```

No automatic hover UI is required.
No floating morality/trust icon is required.
No new player-facing overlay mode is required.

---

# Visual Asset Consequence

For V1 asset planning, social/trust/moral categories require only concrete carriers that already make sense in the world:

```text
elder seal prop;
sealed door prop;
old ledger prop;
forbidden notice prop;
authority house sign;
religious boundary sign;
archive shelf;
dialogue portrait / NPC sprite only if NPC already exists;
notebook/friend-letter text formatting if those screens exist;
debug export symbols for developer review.
```

Do not create abstract social icons as gameplay requirements unless a future UX task explicitly asks for them.

---

# Required Correction To Visual Register Interpretation

Any entry in the broader visual asset register that says:

```text
trust gate marker
moral dilemma marker
social consequence marker
NPC liar marker
NPC concealer marker
```

must be interpreted as:

```text
data/debug category first;
player-facing text through existing narrative channels second;
visual world prop only if there is a concrete in-world carrier;
no automatic UI marker by default.
```

---

# Final Rule

Do not invent functionality to satisfy the visual register.

The register describes what must be visually or textually represented somewhere in the existing design pipeline, not a command to add new hover UI, new overlay modes, new morality icons, or new tooltip behavior.

V1 should stay within the existing interaction model unless a separate UX/runtime document explicitly changes that model.
