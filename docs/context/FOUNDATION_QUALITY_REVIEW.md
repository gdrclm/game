# F8 technical review — quality beyond a green validator

Review of generator 04f5b5c and evidence commit bd9adae, 2026-11-25.
F1–F7 technical baseline remains passed; F8 is NOT approved and Phase 3 remains out of scope.
No change to canonical generator or validation thresholds in this review.

## Evidence from the 19-world report

- 16 worlds have two continents, three have three; all 19 have exactly one exported archipelago.
- Chain sizes: 3 islands in 9 worlds, 4 in 6, 5 in 1, 6 in 3.
- Route counts: 7 in 1, 10 in 7, 15 in 7, 21 in 1, 28 in 3.
- Center/periphery contrast 0.4546–0.4902; warning on every world.
- History potential 0.6639–0.7021 (proxy, not measured narrative quality).
- Recovery 0.180434–0.3012; one case is close to the validated minimum.

Source review: continental-shoreline.js stops at first percentile yielding >=2 major bodies; this supports the existing minimum, not an error by itself. offshore-elevation.js selects the best hotspot track [0]; coastal-access-topology.js handles a single hotspotChain and islandGroupId. This can constrain the geographical opportunity space. One archipelago is compatible with the V1 target; multiple groups are a design/contract extension to consider only if evidence warrants. Do not force a random count or invent second chains for a histogram.
buildMacroRoutes enumerates endpoint pairs; route totals often correspond to pair counts. More routes need not mean independent routes, different corridors or resilience. Existing validation contract calls for distinct continental profiles, meaningful chokepoints, brittle and redundant corridor families, and noticeable center/periphery contrast.

Potential measurement confound: findIslandPassages closes a radius around the gap. traceWaterPaths returns unreachable when a terminal is itself closed. A null bypass in this case does not establish an independent chokepoint. The current audit accepts null as valid. This is a source-level concern; occurrence on the 19 worlds has not yet been measured.

## F8-Q: next bounded engineering iteration
1. Run the new advisory quality diagnostic:
   node tests/worldgen-v1-quality.cjs docs/context/review/foundation-report.json 42 137 1908874353 2576980379 4286578687
   Repeat over all existing 19 seeds. Keep all failed cases visible. Separate endpoint-confounded closures from real detours/disconnections. If present, repair the obstruction experiment with fixed accessible terminals and a geometrically valid passage closure, then rerun existing canonical gates. Do not count an endpoint closure as proof. Add a negative fixture and report before/after.
2. Quantify independent route networks, shared bottlenecks, alternative corridor cost, reachability and centrality distributions. Investigate why the existing contrast score stays low; inspect per-node/regional distributions and component scores, distinguish aggregation artifact from genuinely uniform opportunity. Do not simply increase scores or reduce targets.
3. Quantify morphology from real masks (component areas, coast complexity, spatial arrangement, island-chain curvature, distance to mainland, distinct physical profile coverage). Determine if the single-chain and shoreline selectors create over-constrained outcomes. If so, propose evidence-backed, bounded physical mechanisms; preserve current required minima and causal provenance. Author decision required for changing scope to multiple archipelagos. Preserve rare valid cases and all canonical seeds.
4. Re-run technical audit and a new predeclared holdout after any generator change. Export maps of extreme cases and explain differences in possible travel, resupply, isolation, recovery and future society. These are narrative opportunities, not fabricated histories. Keep game integration deferred to 17.5.
5. Present actual F8 evidence with clear tradeoffs for author decision. No Phase 3, no merge until F8/F9 explicit acceptance.

The quality diagnostic is advisory. Its historical report aggregation and three synthetic closure classifications were exercised independently; live generation remains to be executed in Codex/Node. Repository image binaries could not be decoded through the current connector, so visual judgments remain pending; inspect the real atlases in review/README.md.

