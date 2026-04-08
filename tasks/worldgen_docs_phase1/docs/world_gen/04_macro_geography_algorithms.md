# MACRO GEOGRAPHY — ALGORITHMS AND DECISION LOGIC

## Задача документа
Этот файл фиксирует, **какие типы алгоритмов допустимы**, где использовать вероятности, где анализ графов, а где нужны более строгие процедурные шаги.

---

## 1. Не использовать систему “таблица пресетов” как основу
Пресеты допустимы только как:
- стартовые bias-профили;
- веса для параметров;
- validation targets.

Они не должны быть главной логикой формы мира.

---

## 2. Базовый стек алгоритмов

### A. Multi-field synthesis
Основа всей фазы.
Используется для:
- tectonic skeleton
- marine invasion
- climate pressure

### B. Graph extraction and analysis
Основа для:
- routes
- chokepoints
- isolation
- strategic dependency

### C. Utility scoring
Используется для:
- coastal opportunity
- core candidate scoring
- archipelago significance

### D. Constraint resolution
Используется для:
- validation
- targeted rebalance
- partial rerolls

---

## 3. Алгоритмы по подгенераторам

### 3.1. TectonicSkeletonGenerator
Рекомендуемые техники:
- ridge noise
- directional bias fields
- fracture masks
- Voronoi macro partitions
- multi-scale smoothing

### 3.2. MarineCarvingGenerator
Рекомендуемые техники:
- coastline carve masks
- marine penetration iterators
- bay candidate growth
- strait forcing under fracture lines
- archipelago fragmentation pass

### 3.3. ClimatePressureGenerator
Рекомендуемые техники:
- latitude-style gradient bias
- sea proximity modifiers
- storm corridor masks
- humidity overlays
- region-scale diffusion

### 3.4. Route / Flow Analyzer
Рекомендуемые техники:
- weighted hybrid graph
- Dijkstra / A* families
- all-pairs strategic probing on reduced graph
- route redundancy analysis
- edge betweenness-like scoring

### 3.5. Chokepoint Analyzer
Рекомендуемые техники:
- edge criticality
- articulation region detection
- bypass penalty scoring
- route dependency overlap

### 3.6. Isolation Analyzer
Рекомендуемые техники:
- distance from top strategic cores
- multi-factor path cost
- climatic penalty injection
- route collapse sensitivity

---

## 4. Где вероятности, а где нет

### Вероятности нужны там, где есть вариативность
- число континентальных масс
- степень marine carving
- плотность заливов
- coastal richness variance
- archipelago fragmentation intensity

### Вероятности не должны заменять логику там, где нужна причинность
Например, нельзя делать:
- “randomly create strategic strait”

Нужно делать:
- сначала route graph;
- потом dependency analysis;
- потом choke classification.

---

## 5. Где допустим minimax-like / foresight logic
В этой фазе чистый minimax почти не нужен.

Но допустимы **ограниченные прогнозные оценки**:
- как изменение одного пролива влияет на route dependency;
- как потеря archipelago corridor повлияет на связность мира;
- как перекос core/periphery влияет на исторический потенциал.

То есть здесь используется не adversarial game AI, а **forecast scoring under structural change**.

---

## 6. Validation as algorithm, not afterthought
Validation — часть алгоритма, а не финальная проверка.

### Что проверяется
- разнообразие континентов;
- значимость морей;
- наличие choke regions;
- значимость архипелага;
- наличие strong core / fragile periphery contrast;
- наличие условий для колонизации и распада.

### Что делать при провале
- reroll only marine layer;
- recalc coast opportunity;
- recompute route/choke fields;
- if critical fail, rebuild tectonic skeleton.

---

## 7. Что Codex не должен делать
1. Подменять field synthesis набором ручных if/else картинок.
2. Создавать “интересность” вручную через hard-coded hotspots.
3. Смешивать validation logic с UI/debug logic.
4. Зашивать значения в одном модуле без contracts и docs.
