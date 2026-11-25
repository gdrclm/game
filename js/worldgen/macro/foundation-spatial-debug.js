(() => {
    const macro = window.Game.systems.worldgenMacro;

    const fields = [
        ['tectonicSkeleton', 'platePressureField'],
        ['marineCarving', 'marineInvasionField'],
        ['marineCarving', 'coastJaggednessControlledLandWaterMaskField'],
        ['continentalCohesion', 'continentalCohesionField'],
        ['coastalOpportunity', 'coastalOpportunityMap']
    ];
    const intermediate = [
        ['tectonicSkeleton', 'plateSeedDistribution'],
        ['tectonicSkeleton', 'plateBoundaryClassification'],
        ['reliefElevation', 'continentBodies'],
        ['reliefElevation', 'reliefRegionExtraction'],
        ['hydrosphere', 'seaRegionClusters'],
        ['hydrosphere', 'watershedSegmentation'],
        ['riverSystem', 'majorRiverCandidates'],
        ['climateEnvelope', 'climateZoneClassification'],
        ['marineCarving', 'archipelagoFragmentationSummary'],
        ['marineCarving', 'straitCarvingSummary'],
        ['continentalCohesion', 'regionalSegmentationAnalysis'],
        ['continentalCohesion', 'corePotentialAnalysis'],
        ['continentalCohesion', 'continentalCohesionSummaries'],
        ['continentalCohesion', 'fracturedPeripheryAnalysis'],
        ['connectivityGraph', 'coastalAccessTopology'],
        ['connectivityGraph', 'macroRoutes'],
        ['connectivityGraph', 'macroCorridors'],
        ['chokepoints', 'chokepointRecords'],
        ['isolationPeriphery', 'isolationAnalysis'],
        ['isolationPeriphery', 'peripheryClusters'],
        ['archipelagoSignificance', 'archipelagoMacroZones'],
        ['strategicRegionSynthesis', 'strategicRegionCandidates'],
        ['validationRebalance', 'macroValidationDiagnostics']
    ];

    function buildFoundationSpatialDebug(input, makeEntry, categories) {
        for (const [stageId, fieldId] of fields) {
            const field = input[stageId]?.outputs?.fields?.[fieldId];
            if (!field?.values?.length) continue;
            const { width, height, values, range, threshold } = field;
            categories.fieldSnapshots.push(makeEntry({
                artifactId: `foundation_field_${fieldId}`,
                artifactKind: 'fieldSnapshot',
                stageId,
                sourceLayerId: fieldId,
                payload: { fieldId, width, height, values, range, threshold }
            }, 'fieldSnapshots'));
        }
        for (const [stageId, outputId] of intermediate) {
            const payload = input[stageId]?.outputs?.intermediateOutputs?.[outputId];
            if (!payload) continue;
            categories.intermediateOutputs.push(makeEntry({
                artifactId: `foundation_geometry_${outputId}`,
                artifactKind: 'intermediateOutput',
                stageId,
                sourceLayerId: outputId,
                payload
            }, 'intermediateOutputs'));
        }
        const payload = input.reliefElevation?.outputs?.fields?.seaLevelAppliedElevationField?.seaLevelModel;
        if (payload) {
            categories.intermediateOutputs.push(makeEntry({
                artifactId: 'foundation_geometry_seaLevelModel',
                artifactKind: 'intermediateOutput',
                stageId: 'reliefElevation',
                sourceLayerId: 'seaLevelAppliedElevationField',
                payload
            }, 'intermediateOutputs'));
        }
    }

    macro.buildFoundationSpatialDebug = buildFoundationSpatialDebug;
})();
