(() => {
    const macro = window.Game.systems.worldgenMacro;

    const fields = [
        ['tectonicSkeleton', 'platePressureField'],
        ['tectonicSkeleton', 'upliftField'],
        ['tectonicSkeleton', 'subsidenceField'],
        ['tectonicSkeleton', 'fractureMaskField'],
        ['tectonicSkeleton', 'ridgeDirectionField'],
        ['hydrosphere', 'coastalShelfDepthField'],
        ['hydrosphere', 'oceanConnectivityMaskField'],
        ['marineCarving', 'marineInvasionField'],
        ['marineCarving', 'coastJaggednessControlledLandWaterMaskField'],
        ['marineCarving', 'preMarineRelativeElevationField'],
        ['marineCarving', 'offshoreHotspotUpliftField'],
        ['marineCarving', 'finalRelativeElevationField'],
        ['marineCarving', 'finalSurfaceOriginField'],
        ['marineCarving', 'finalSurfaceSlopeField'],
        ['marineCarving', 'finalLocalReliefField'],
        ['marineCarving', 'macroLandformField'],
        ['marineCarving', 'macroSeafloorFormField'],
        ['continentalCohesion', 'continentalCohesionField'],
        ['coastalOpportunity', 'coastalOpportunityMap']
    ];
    const intermediate = [
        ['tectonicSkeleton', 'plateSeedDistribution'],
        ['tectonicSkeleton', 'plateBoundaryClassification'],
        ['tectonicSkeleton', 'arcFormationHelper'],
        ['tectonicSkeleton', 'hotspotVolcanicSeedHelper'],
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
            if (!field?.values?.length && !field?.xValues?.length) continue;
            const { width, height, values, range, threshold, valueEncoding, sourceFieldIds,
                xValues, yValues, vectorEncoding } = field;
            categories.fieldSnapshots.push(makeEntry({
                artifactId: `foundation_field_${fieldId}`,
                artifactKind: 'fieldSnapshot',
                stageId,
                sourceLayerId: fieldId,
                payload: { fieldId, width, height, values, range, threshold, valueEncoding, sourceFieldIds,
                    xValues, yValues, vectorEncoding }
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
        const finalFields = input.marineCarving?.outputs?.fields;
        if (finalFields?.finalRelativeElevationField) {
            categories.intermediateOutputs.push(makeEntry({
                artifactId: 'foundation_geometry_finalDrainage',
                artifactKind: 'intermediateOutput',
                stageId: 'marineCarving',
                sourceLayerId: 'finalDrainage',
                payload: macro.buildFinalDrainage(
                    finalFields.finalRelativeElevationField,
                    finalFields.macroSeafloorFormField,
                    input.climateEnvelope?.outputs?.fields?.wetnessField?.values
                )
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
