# MACRO GEOGRAPHY — FIELD SYSTEM

## Назначение
Этот документ фиксирует, какие поля существуют в Phase 1 и что они значат.

Поле — это не gameplay entity, а распределённый слой значений на world-scale grid.

---

## 1. PlatePressureField

### Смысл
Определяет фундаментальный каркас мира:
- где суша поднимается;
- где она ломается;
- где возникают дуги и массивы;
- где будет скелет континентов.

### Подметрики
- `uplift`
- `fracture`
- `compression`
- `driftBias`
- `arcFormation`

### Использование
Используется для построения первичного land tendency map.

---

## 2. MarineInvasionField

### Смысл
Показывает, где море может глубоко врезаться в сушу и раздробить её.

### Подметрики
- `incisionDepth`
- `coastalBreakup`
- `bayFormation`
- `straitLikelihood`
- `islandFragmentation`

### Использование
Из него рождаются:
- заливы
- проливы
- внутренние моря
- архипелажные коридоры
- ломанные побережья

---

## 3. ContinentalCohesionField

### Смысл
Оценивает, насколько материк или регион годится для единой долгой политической связности.

### Подметрики
- `interiorPassability`
- `basinConnectivity`
- `ridgeBarrier`
- `regionalSegmentation`
- `stateScalePotential`

### Использование
Нужен для будущих фаз:
- imperial core formation
- fractured polities
- regional houses

---

## 4. ClimateStressField

### Смысл
Это не картинка погоды, а историческое давление среды.

### Подметрики
- `stormPressure`
- `wetDecay`
- `coldDrag`
- `harvestRisk`
- `maritimeSeasonality`

### Использование
Влияет на:
- долговечность портов
- надёжность морских путей
- устойчивость колоний
- collapse vulnerability

---

## 5. CoastalOpportunityField

### Смысл
Показывает, какие берега создают исторический шанс.

### Подметрики
- `harborQuality`
- `fishingPotential`
- `landingEase`
- `shoreDefense`
- `inlandLinkBonus`

### Использование
Будущие фазы используют это для:
- портовых культур
- морской экспансии
- торговых узлов
- рыбацких экономик

---

## 6. IsolationField

### Смысл
Показывает не просто расстояние, а трудность удержания и снабжения региона.

### Подметрики
- `distanceFromCore`
- `resupplyCost`
- `weatherIsolation`
- `chokepointDependence`
- `culturalDriftPotential`

### Использование
Нужен для:
- будущих периферий
- автономных зон
- поздних осколков мира

---

## 7. StrategicFrictionField

### Смысл
Показывает, где интересы держав будут неизбежно сталкиваться.

### Подметрики
- `overlapOfRouteInterests`
- `controlDifficulty`
- `multiAccessPressure`
- `prestigeValue`
- `contestProbability`

### Использование
Будет фундаментом для:
- choke wars
- coalition logic
- contested archipelagos
- imperial frontiers

---

## Field constraints

### Общие правила
1. Все поля должны быть seed-stable.
2. Все поля должны экспортироваться в debug snapshots.
3. Ни одно поле не должно иметь смысл только в рамках одного модуля.
4. Все поля обязаны иметь нормализованный диапазон 0..1 либо чётко описанный signed range.
5. Комбинация полей должна быть прозрачной и документированной.

---

## Требования к Codex
Codex при реализации не должен:
- вводить поля без записи в contracts;
- использовать ad-hoc random modifiers без имени и схемы;
- склеивать field generation и final region synthesis в один модуль.
