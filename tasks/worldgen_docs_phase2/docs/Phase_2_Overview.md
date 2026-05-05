# Phase_2_Overview
## ФАЗА 2 — PRESSURE & ENVIRONMENTAL RHYTHM GENERATOR
**Repository:** `gdrclm/game`  
**Status:** Draft source-of-truth overview after completed Phase 1  
**Audience:** design, engineering, Codex implementation passes  
**Scope:** defines the role, boundaries, inputs, outputs, and strategic purpose of Phase 2 after finalized Phase 1 physical + macro export

---

# 1. Назначение

Phase 2 существует для того, чтобы превратить уже завершённый **physical + macro world output** из Phase 1 в **experienced environmental logic** мира.

Фаза отвечает не на вопрос:
- что за континенты существуют;
- где проходят проливы;
- где лежат горные системы;
- где стратегически важен архипелаг;

а на вопрос:

> как этот мир ощущается для жизни, передвижения, риска, дефицита, восстановления и временной структуры ещё до того, как общества объяснили его через идеологию, религию и историческую память.

Именно поэтому Phase 2 должна стоять **между**:
- завершённой Phase 1;
- Proto-Cosmology / Religion / Mental Models;
- будущей gameplay projection composition.

---

# 2. Что изменилось после завершения Phase 1

Phase 2 больше не проектируется над абстрактным “macro geography someday”.

Теперь upstream truth уже существует.

Phase 1 завершена и экспортирует:
- contract-valid `MacroGeographyPackage`
- explicit `MacroGeographyHandoffPackage`

Это значит, что Phase 2 теперь должна работать как **официальный downstream consumer**, а не как speculative layer.

---

# 3. Что теперь считается upstream truth

## 3.1 Root package truth
Из `MacroGeographyPackage` Phase 2 получает:
- `continents`
- `seaRegions`
- `mountainSystems`
- `volcanicZones`
- `riverBasins`
- `climateBands`
- `reliefRegions`
- `archipelagoRegions`
- `coastalOpportunityMap`
- `chokepoints`
- `macroRoutes`
- `isolatedZones`
- `strategicRegions`
- `validationReport`
- optional `debugArtifacts.physicalWorldDebugBundle`

## 3.2 Handoff truth
Из `MacroGeographyHandoffPackage` Phase 2 может читать только ограниченный набор derived structural hints, если это явно разрешено отдельным handoff-doc.

Handoff package нельзя трактовать как:
- историю;
- политику;
- named-world truth;
- готовую интерпретацию мира.

---

# 4. Главная функция фазы

Phase 2 должна превратить structural world truth в две официальные сущности:

- `PressureFieldPackage`
- `EnvironmentalRhythmPackage`

## Pressure отвечает за:
- burden
- exposure
- reliability loss
- fragility
- catastrophe susceptibility
- persistence of strain

## Rhythm отвечает за:
- cadence
- timing
- windows
- predictability
- rupture
- recovery tempo
- relief structure

### Ключевое правило
`pressure` и `rhythm` не имеют права схлопываться в один scalar difficulty layer.

---

# 5. Что Phase 2 обязана создать

## 5.1 Environmental burden truth
- climate hostility as lived burden
- terrain harshness as lived burden
- hydrology stress
- food stress
- travel exposure
- chokepoint pressure
- isolation burden
- ecological fragility
- catastrophe susceptibility

## 5.2 Environmental timing truth
- seasonality
- storm cadence
- navigation windows
- scarcity cadence
- predictability
- rupture profile
- recovery tempo

## 5.3 Environmental relief truth
Обязательная часть, а не nice-to-have:
- recovery windows
- stabilization intervals
- relief persistence
- environmental forgiveness
- usable calm / safe timing structures

---

# 6. Что фаза делать не имеет права

Phase 2 **не** генерирует:
- ideology
- religion
- social norms
- dynastic behavior
- faction logic
- named historical conflicts
- island history
- final settlement meaning
- NPC motives
- final runtime scenario truth

---

# 7. Что теперь особенно важно после завершения Phase 1

## 7.1 Не дублировать climate creation
Phase 1 уже создала climate envelope truth.

Значит Phase 2 не строит климат заново.  
Она переводит climate truth в:
- burden
- timing
- exposure
- recoverability
- planning relevance

## 7.2 Быть record-aware
Теперь upstream экспортирует богатые records, а не только поля.

Значит Phase 2 должна работать не только с scalar fields, но и с:
- region ids
- record linkage
- record-bound summaries
- environment profiles by record clusters

## 7.3 Быть runtime-aware, но не runtime-owned
Проект уже имеет:
- expedition progression
- island layout
- world spawn runtime
- map UI

Phase 2 не должна внедряться туда напрямую, но обязана иметь outputs, которые потом можно осмысленно адаптировать туда downstream.

---

# 8. Основные подсистемы Phase 2

Официальная структура фазы после завершения Phase 1:

1. `Phase2InputBundle`
2. `Phase2RecordBindingLayer`
3. `PressureSynthesis`
4. `RecoveryReliefSynthesis`
5. `RhythmSynthesis`
6. `SummaryGeneration`
7. `Validation`
8. `GameplayProjectionCompatibility`
9. `SelectiveRebalance`
10. `Export`

---

# 9. Главные риски фазы

Phase 2 считается архитектурно уязвимой, если она деградирует в одно из следующих состояний:
- scalar difficulty layer;
- punishment-only world;
- pressure/rhythm collapse;
- recovery-loss;
- climate duplication;
- semantic leakage from Phase 1 handoff;
- detached math with no gameplay-facing meaning;
- record-blind field sandbox;
- identical planning style everywhere.

---

# 10. Минимальный обязательный output

```json
{
  "pressureFieldPackage": {},
  "environmentalRhythmPackage": {},
  "regionalEnvironmentalProfiles": [],
  "validationReport": {},
  "phase2Summaries": {}
}
```

---

# 11. Acceptance criteria

Phase 2 считается концептуально годной только если:

1. Она использует завершённую Phase 1 как официальный upstream.
2. Она не invent-ит missing physical truth.
3. Она не дублирует climate creation.
4. Она держит `pressure` и `rhythm` отдельно.
5. Она делает `recovery / relief` обязательной системой.
6. Она остаётся pre-ideological.
7. Она может быть осмысленно спроецирована в gameplay позже.
8. Она record-aware и не существует как чисто безадресная математика.
9. Она не заставляет downstream runtime заново выдумывать environmental truth.
