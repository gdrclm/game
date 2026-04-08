# MACRO GEOGRAPHY — VALIDATION, DEBUG, ANTI-HALLUCINATION

## Назначение
Этот документ нужен, чтобы Codex не считал Phase 1 завершённой после генерации “какой-то карты”.

Фаза считается готовой только если мир пригоден для следующих исторических генераторов.

---

## 1. Validation targets

### 1.1. Diversity target
В мире должны быть:
- минимум 2 разных continent strategic profiles;
- минимум 2 разных sea region historical roles;
- заметный contrast между ядром и периферией.

### 1.2. Route target
В мире должны существовать:
- важные macro corridors;
- хотя бы 1 brittle corridor;
- хотя бы 1 redundant route family.

### 1.3. Chokepoint target
Должны быть:
- минимум 2 meaningful choke points;
- хотя бы 1 морской choke point, связанный с archipelago role;
- choke points должны иметь высокий dependency score.

### 1.4. Archipelago target
Архипелаг должен быть:
- не случайной группой островов;
- не тупиковой зоной без исторического веса;
- зоной с высокой connective value и высокой fragility.

### 1.5. History potential target
Мир должен допускать:
- морские державы или их аналоги;
- спорные периферии;
- колонизацию или контроль архипелага;
- кризис маршрутов;
- исторический распад.

---

## 2. Debug exports
Для каждого seed должны экспортироваться:
- plate pressure heatmap
- marine invasion heatmap
- cohesion map
- climate stress map
- coastal opportunity map
- route graph snapshot
- chokepoint overlay
- archipelago significance summary
- validation markdown/json report

---

## 3. Validation report structure

```json
{
  "isValid": true,
  "scores": {
    "diversity": 0.0,
    "routeRichness": 0.0,
    "chokeValue": 0.0,
    "archipelagoSignificance": 0.0,
    "centerPeripheryContrast": 0.0,
    "historyPotential": 0.0
  },
  "failReasons": [],
  "rebalanceActions": []
}
```

---

## 4. Anti-hallucination protocol for Codex

### Codex обязан:
1. Добавлять новый output field только после обновления contracts.
2. Обновлять docs при изменении схем данных.
3. Делать deterministic generation under fixed seed.
4. Добавлять debug export для новых major layers.
5. Обновлять validation if new strategic layer changes world quality.

### Codex запрещено:
1. Вводить `magicValue`, `specialBias`, `deepnessScore` без документации.
2. Делать hidden dependencies between modules.
3. Менять semantic meaning существующих полей без migration note.
4. Подменять validation ручным “looks interesting enough”.

---

## 5. Manual review checklist
Перед тем как считать implementation готовой, человек должен проверить:
- seed reproducibility;
- реально разные worlds на 5–10 seeds;
- choke points выглядят логично;
- архипелаг почти всегда исторически важен;
- нет world outputs, которые бесполезны следующим фазам.
