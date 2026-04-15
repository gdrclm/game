# DATA CONTRACT — PHASE 0 VALIDATION REPORT

## Root contract

```json
{
  "isValid": true,
  "warnings": [],
  "scores": {
    "expressiveness": 0.0,
    "controlledExtremeness": 0.0,
    "derivedReadability": 0.0,
    "archipelagoPotential": 0.0,
    "downstreamUsability": 0.0
  },
  "rerollAdvice": [],
  "blockedDownstreamPhases": []
}
```

## Rules
1. validation report must always exist;
2. even on failure, scores and reroll advice should be returned;
3. blocked downstream phases must be explicit, not implied.
