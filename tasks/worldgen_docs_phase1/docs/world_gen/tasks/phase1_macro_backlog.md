# PHASE 1 — MACRO GEOGRAPHY BACKLOG

## Принципы
- задачи идут сверху вниз по pipeline;
- каждая задача должна иметь deterministic seed behavior;
- каждая major task обязана иметь debug export;
- при изменении схемы обновляются contracts и docs.

---

## A. Foundation
1. Создать `js/worldgen/macro/` модульную папку.
2. Создать `index.js` и общий export layer для Phase 1.
3. Создать `contracts.js` для runtime-side валидации схем.
4. Создать deterministic RNG wrapper для phase-local sub-seeds.
5. Создать `debug/` экспорт слоёв в JSON-friendly form.
6. Создать общий `MacroGeographyPackageBuilder`.
7. Создать `validation-report-builder`.
8. Создать unit contract checks на обязательные ключи package.

## B. Field abstractions
9. Создать scalar field abstraction.
10. Создать multi-channel field abstraction.
11. Создать field sampling helpers.
12. Создать field normalization helpers.
13. Создать field compositing helpers.
14. Создать region mask abstraction.
15. Создать heatmap export format.
16. Создать deterministic field snapshot tests.

## C. Tectonic skeleton
17. Реализовать uplift generation.
18. Реализовать fracture generation.
19. Реализовать ridge line generation.
20. Реализовать arc formation pass.
21. Реализовать basin tendency pass.
22. Реализовать primary landmass synthesis.
23. Реализовать cleanup pass для непригодных land blobs.
24. Реализовать continent extraction.
25. Реализовать dominant relief tagging.
26. Реализовать shape-interest scoring.
27. Добавить debug export для tectonic layers.

## D. Marine carving
28. Реализовать marine penetration pass.
29. Реализовать bay formation.
30. Реализовать coastal breakup pass.
31. Реализовать strait candidate carving.
32. Реализовать internal sea candidate formation.
33. Реализовать archipelago corridor fragmentation.
34. Реализовать sea-region clustering.
35. Реализовать navigability preliminary scoring.
36. Добавить debug export для marine layers.

## E. Climate pressure
37. Реализовать wetness macro bands.
38. Реализовать cold load macro bands.
39. Реализовать storm corridor generation.
40. Реализовать wet decay overlays.
41. Реализовать maritime seasonality scoring.
42. Реализовать climate synthesis into region summaries.
43. Добавить climate debug heatmaps.

## F. Cohesion and segmentation
44. Реализовать land passability map.
45. Реализовать basin connectivity scoring.
46. Реализовать ridge barrier scoring.
47. Реализовать regional segmentation scoring.
48. Реализовать state scale potential scoring.
49. Реализовать continent summary metrics.
50. Реализовать core-candidate extraction.
51. Реализовать fragmented-zone extraction.

## G. Coastal opportunity
52. Реализовать harbor quality scoring.
53. Реализовать fishing potential scoring.
54. Реализовать landing ease scoring.
55. Реализовать shore defense scoring.
56. Реализовать inland-link bonus scoring.
57. Реализовать coastline clustering into opportunity zones.
58. Реализовать elite port candidate extraction.
59. Реализовать deceptive coast tagging.
60. Добавить debug export для coast opportunity.

## H. Routes and flows
61. Построить hybrid land/sea graph.
62. Ввести route cost model по climate + sea + cohesion.
63. Реализовать macro corridor probing.
64. Реализовать dependency counts для рёбер и узлов.
65. Реализовать route redundancy scoring.
66. Реализовать route fragility scoring.
67. Реализовать mandatory corridor extraction.
68. Реализовать archipelago route-through detection.
69. Добавить graph snapshot export.

## I. Chokepoints
70. Реализовать narrow strait detector.
71. Реализовать island chain lock detector.
72. Реализовать inland bottleneck detector.
73. Реализовать bypass difficulty scoring.
74. Реализовать control value scoring.
75. Реализовать trade dependency scoring.
76. Реализовать collapse sensitivity scoring.
77. Реализовать choke classification.
78. Добавить choke overlay export.

## J. Isolation/periphery
79. Реализовать distance-from-core scoring.
80. Реализовать resupply difficulty scoring.
81. Реализовать weather isolation scoring.
82. Реализовать chokepoint dependence scoring.
83. Реализовать cultural drift potential scoring.
84. Реализовать autonomous survival score.
85. Реализовать lost-in-collapse likelihood.
86. Реализовать peripheral cluster extraction.

## K. Archipelago significance
87. Реализовать archipelago candidate detection.
88. Реализовать connective value scoring.
89. Реализовать fragility scoring.
90. Реализовать colonization appeal scoring.
91. Реализовать contest value scoring.
92. Реализовать collapse susceptibility scoring.
93. Реализовать role seed generation for history phase.
94. Реализовать archipelago region contract export.

## L. Validation and rebalance
95. Реализовать diversity scoring.
96. Реализовать route richness scoring.
97. Реализовать choke usefulness scoring.
98. Реализовать center-periphery contrast scoring.
99. Реализовать archipelago significance scoring.
100. Реализовать history potential scoring.
101. Реализовать fail reason diagnostics.
102. Реализовать partial reroll policies.
103. Реализовать world reject policy.
104. Реализовать human-readable validation markdown export.

## M. Bridge to next phases
105. Экспортировать `summaryForHistoryPhase`.
106. Экспортировать `colonizationHints`.
107. Экспортировать `strategicHintsForPolitics`.
108. Экспортировать `collapsePressureSeeds`.
109. Экспортировать `archipelagoRoleSeeds`.
110. Подготовить placeholder adapter для future archipelago role generator.
