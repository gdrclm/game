# Project state — Codex handoff, 2026-11-25

Scope: WorldGen V1 Foundation Closure on worldgen/v1-foundation-closure. Prior code HEAD afc59830bb4e40ea953572e80f6dbf625faddcab; handoff commit adds documentation only. Main not merged. Verify actual HEAD before working.

## What exists
- Browser runtime uses window.Game; expedition generation currently separate from causal worldgen (js/expedition/progression.js, island-layout.js). No Phase 17.5 integration yet.
- Phase 0 actual canonical entry, export validator, freeze adapter, Phase 1 intake implemented. Two 256-seed cohorts passed deterministic Phase 0 generation/validation; boundary and tampered sub-seed tests passed. Sequential seed sample had narrow conflictPressure, spread sample did not. Broader statistical quality not proved.
- Phase 1 coastJaggedness missing constructor field fixed; watershed record ID kept intact while RNG namespace converted to lowerCamelCase. Phase 1 now reaches package assembly.
- Phase 2 orchestration status aggregation fixed. Built-in fixture harness passes. Full real Phase 1→2 intake is BLOCKED.
- First maritime demand channel implemented in archipelago-significance-generator.js, controlled unit test passed. Real world counterfactuals NOT EXERCISED because no supported archipelago zones.
- Read-only standalone Observatory HTML prototype exists as a chat attachment, not confirmed in repo. CI now exports real debug JSON; no author visual acceptance yet.
- Phase 3+ not verified as implemented. Do not start them before the current gate.

## Latest verified CI evidence
Run 45653210495 (afc5983): https://github.com/gdrclm/game/actions/runs/45653210495
Artifact 15040214691 (~4.5 MB): https://github.com/gdrclm/game/actions/runs/45653210495/artifacts/15040214691
All 7 targeted checks passed; whole workflow FAILED. Three real seeds repeated with matching Phase 0 and Phase 1 hashes.

| Master seed | Macro seed | continents | sea regions | mountains | river basins | archipelago regions | routes | chokepoints |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 42 | 363947094 | 1 | 5 | 5 | 5 | 0 | 0 | 0 |
| 137 | 3879670900 | 1 | 5 | 4 | 5 | 0 | 0 | 0 |
| 2026 | 2713179311 | 1 | 8 | 4 | 8 | 0 | 0 | 0 |

Phase 1 validation false; blocked exportPackage and MacroGeographyPackageAssembly. Warnings: macro diversity 0.41, center/periphery contrast 0.32–0.34, no official chokepoints. Phase 2 rejects invalid validationReport and insufficient required root records (continents, archipelagoRegions, chokepoints, macroRoutes; seed 137 also coastalOpportunityMap). These are observed symptoms, not yet diagnosed root cause. Causal diagnostics status not_exercised for all three. Phase 2 determinism on real worlds unknown.

## Reproduction
From repo root, Node 22:
    node tests/worldgen-v1-foundation-audit.cjs 42
Full baseline:
    node tests/worldgen-v1-foundation-audit.cjs 42 137 2026 > worldgen-foundation-report.json
CI workflow .github/workflows/worldgen-v1-foundation.yml uploads report and worldgen-observatory-data/. Baseline may take minutes; start with one seed and focused stage-level tests. Keep raw debug snapshots outside source control unless explicitly curated.

## F1 reproduced locally

The [execution plan and baseline trace](FOUNDATION_EXECUTION_PLAN.md#исходная-трассировка-f1) record masks, segment counts and actual graph sizes. The coast selector rejected every candidate in seed 137; each world supplied just one inland route endpoint and no axis-aligned fragmentation run or strait. Empty roots matched empty sources.

## Next safe action

Continue F2 with bounded physical shoreline selection, measured open-water landfalls and verified passages before re-running package validation and Phase 2.
