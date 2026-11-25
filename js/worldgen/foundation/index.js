(() => {
    const systems = window.Game.systems;
    const { worldgenPhase0: phase0, worldgenMacro: phase1, worldgenPhase2: phase2 } = systems;

    class FoundationGenerationError extends Error {
        constructor(phase, message, { cause, evidence } = {}) {
            super(`[worldgen/foundation] ${phase}: ${message}`, { cause });
            this.name = 'FoundationGenerationError';
            this.phase = phase;
            this.evidence = evidence;
        }
    }

    function runWorldGenFoundation(input, { includeDebugArtifacts = false, includeCausalDiagnostics = false } = {}) {
        let currentPhase = 'phase0';
        let evidence;
        try {
            const frozen = phase0.createPhase0OrchestrationAdapter().run(input);
            const { phase0Bundle, phase1SafeSummaryBundle } = frozen.outputs;
            const { macroGeographySeed, pressureSeed, rhythmSeed } = phase0Bundle.worldSubSeedMap;
            if (phase0Bundle.validationReport.isValid !== true) throw new Error('Invalid Phase 0 export.');

            currentPhase = 'phase1';
            const macroSeedProfile = phase1.intakeMasterConstraints(phase1SafeSummaryBundle);
            const geography = phase1.generateMacroGeographyEndToEnd({
                macroSeed: macroGeographySeed,
                macroSeedProfile,
                phase1Constraints: phase1.normalizePhase1SeedConstraints(macroSeedProfile),
                includeDebugArtifacts,
                attachDebugToPackage: false,
                includeCausalDiagnostics
            });
            const { macroGeographyPackage, macroGeographyHandoffPackage, causalDiagnostics, endToEndDebugExport } = geography;
            evidence = Object.freeze({
                phase1Report: macroGeographyPackage.validationReport,
                ...(includeDebugArtifacts && { physicalWorldDebugBundle: endToEndDebugExport }),
                ...(includeCausalDiagnostics && { maritime: causalDiagnostics })
            });
            phase1.assertMacroGeographyPackage(macroGeographyPackage, { requireSemanticCompleteness: true });
            if (macroGeographyPackage.macroSeed !== macroGeographySeed
                || macroGeographyPackage.validationReport.isValid !== true
                || macroGeographyHandoffPackage.validationSummary.isUsableDownstream !== true) {
                throw new Error('Invalid Phase 1 handoff.');
            }
            phase1.assertFoundationRecordReferences(macroGeographyPackage);

            currentPhase = 'phase2';
            const result = phase2.createPhase2Engine().run({
                macroGeographyPackage,
                macroGeographyHandoffPackage,
                pressureSeed,
                rhythmSeed
            });
            if (!result.output.exportResult.exported || result.output.validationReport.finalStatus !== 'pass') {
                evidence = Object.freeze({ ...evidence, phase2Report: result.output.validationReport, stageResults: result.stageResults });
                throw new Error('Phase 2 export blocked by validation.');
            }

            return Object.freeze({
                phase0: frozen,
                phase1: Object.freeze({ macroGeographyPackage, macroGeographyHandoffPackage }),
                phase2: result.output.exportResult.bundle,
                ...(includeDebugArtifacts || includeCausalDiagnostics ? {
                    diagnostics: Object.freeze({
                        ...evidence,
                        stageResults: result.stageResults,
                        recordBinding: result.output.phase2RecordBindingLayer
                    })
                } : {})
            });
        } catch (error) {
            throw new FoundationGenerationError(currentPhase, error.message, { cause: error, evidence });
        }
    }

    systems.worldgenFoundation = Object.freeze({ runWorldGenFoundation });
})();
