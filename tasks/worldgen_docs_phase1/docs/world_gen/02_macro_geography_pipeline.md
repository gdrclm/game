# MACRO GEOGRAPHY GENERATOR — PIPELINE

## Общая структура
Фаза должна быть разбита на подгенераторы, чтобы Codex не смешивал понятия и не строил всё внутри одного файла.

---

## Pipeline

### 1. Master Constraints Intake
Получает глобальные параметры мира:
- maritimeDependence
- conflictPressure
- environmentalVolatility
- collapseIntensity
- worldTone

### 2. Tectonic Skeleton Generator
Строит:
- массивы суши
- линии разломов
- зоны подъёма и провалов
- дуги и хребты

### 3. Marine Carving Generator
Строит:
- заливы
- проливы
- внутренние моря
- archipelago corridors
- побережья

### 4. Climate Pressure Generator
Накладывает:
- влажность
- холод
- штормовость
- сезонную нестабильность
- coastal decay burden

### 5. Continental Cohesion Analyzer
Считает:
- насколько материки связны;
- где есть ядра;
- где регионы распадаются на отдельные блоки.

### 6. Coastal Opportunity Analyzer
Считает:
- harbor quality
- landing ease
- fishing potential
- shore defense
- inland link bonus

### 7. Flow and Route Analyzer
Строит:
- macro routes
- естественные коридоры
- зависимые маршруты
- route fragility and redundancy

### 8. Chokepoint Analyzer
Выделяет:
- узкие проливы
- обязательные островные цепи
- перешейки
- choke dependencies

### 9. Isolation and Periphery Analyzer
Выделяет:
- удалённые окраины
- культурно дрифтующие регионы
- легко теряемые зоны
- автономные периферии

### 10. Archipelago Significance Generator
Считает:
- connective value
- fragility
- colonization appeal
- contest score
- collapse susceptibility

### 11. Macro Validation and Rebalance
Проверяет:
- разнообразие;
- глубину;
- историческую пригодность;
- осмысленность архипелага.

### 12. Export Package
Собирает `MacroGeographyPackage`.

---

## Важный принцип интеграции
Каждый подгенератор:
- принимает только контрактные данные;
- не имеет права генерировать поля “по ходу” без схемы;
- экспортирует промежуточный слой в debug form;
- должен быть детерминирован по seed.

---

## Execution order
```text
master constraints
  -> tectonic skeleton
  -> marine carving
  -> climate pressure
  -> cohesion analysis
  -> coastal opportunity
  -> route graph
  -> chokepoints
  -> isolation/periphery
  -> archipelago significance
  -> validation
  -> export
```

---

## Возможные feedback loops
Разрешены только контролируемые loops:

### Loop A. Validation -> Marine Carving
Если архипелаг незначим, можно перегенерировать только marine carving.

### Loop B. Validation -> Chokepoint weighting
Если choke regions недостаточно интересны, можно изменить weighting и пересчитать только route/choke слои.

### Loop C. Validation -> Coastal Opportunity
Если мир не даёт морской исторической глубины, можно частично пересчитать coast opportunity без слома тектоники.

---

## Что запрещено
1. Полный reroll мира при каждой локальной неудаче.
2. Прямое изменение уже экспортированных downstream контрактов без пересчёта validation.
3. Смешивание climate и political logic в этой фазе.
4. Использование local island data до завершения macro package.
