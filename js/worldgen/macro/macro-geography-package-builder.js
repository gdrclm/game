(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const MODULE_ID = 'macroGeographyPackageBuilder';
    const PIPELINE_STEP_ID = 'exportPackage';
    const STATUS = 'PARTIAL_IMPLEMENTED';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';
    const DEFAULT_WORLD_BOUNDS = Object.freeze({
        width: 256,
        height: 128
    });
    const REQUIRED_KEYS = Object.freeze([
        'macroSeed'
    ]);
    const OPTIONAL_KEYS = Object.freeze([
        'macroSeedProfile',
        'phase1Constraints',
        'worldBounds',
        'tectonicSkeleton',
        'reliefElevation',
        'hydrosphere',
        'riverSystem',
        'climateEnvelope',
        'continentalCohesion',
        'coastalOpportunity',
        'connectivityGraph',
        'chokepoints',
        'isolationPeriphery',
        'archipelagoSignificance',
        'strategicRegionSynthesis',
        'strategicRegionSynthesizer',
        'validationRebalance',
        'records',
        'debugArtifacts',
        'validationReport'
    ]);
    const INTENTIONALLY_ABSENT = Object.freeze([
        'macroGeographyHandoffPackage',
        'physicalWorldDebugBundle',
        'terrainCells',
        'uiOverlays',
        'gameplaySemantics'
    ]);
    const STAGE_RECORD_PATHS = Object.freeze([
        'records',
        'tectonicSkeleton.outputs.records',
        'reliefElevation.outputs.records',
        'hydrosphere.outputs.records',
        'riverSystem.outputs.records',
        'climateEnvelope.outputs.records',
        'chokepoints.outputs.records',
        'archipelagoSignificance.outputs.records',
        'strategicRegionSynthesis.outputs.records',
        'strategicRegionSynthesizer.outputs.records'
    ]);
    const STAGE_INTERMEDIATE_OUTPUT_PATHS = Object.freeze([
        'intermediateOutputs',
        'tectonicSkeleton.outputs.intermediateOutputs',
        'reliefElevation.outputs.intermediateOutputs',
        'hydrosphere.outputs.intermediateOutputs',
        'riverSystem.outputs.intermediateOutputs',
        'climateEnvelope.outputs.intermediateOutputs',
        'continentalCohesion.outputs.intermediateOutputs',
        'coastalOpportunity.outputs.intermediateOutputs',
        'connectivityGraph.outputs.intermediateOutputs',
        'chokepoints.outputs.intermediateOutputs',
        'isolationPeriphery.outputs.intermediateOutputs',
        'archipelagoSignificance.outputs.intermediateOutputs',
        'strategicRegionSynthesis.outputs.intermediateOutputs',
        'strategicRegionSynthesizer.outputs.intermediateOutputs',
        'validationRebalance.outputs.intermediateOutputs'
    ]);

    function deepFreeze(value) {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
            return value;
        }

        Object.freeze(value);
        Object.values(value).forEach((nestedValue) => {
            deepFreeze(nestedValue);
        });

        return value;
    }

    function cloneValue(value) {
        if (Array.isArray(value)) {
            return value.map(cloneValue);
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
            );
        }

        return value;
    }

    function hasOwn(objectValue, key) {
        return Boolean(objectValue) && Object.prototype.hasOwnProperty.call(objectValue, key);
    }

    function isPlainObject(value) {
        if (!value || typeof value !== 'object') {
            return false;
        }

        const prototype = Object.getPrototypeOf(value);
        return prototype === Object.prototype || prototype === null;
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string'
            ? value
            : (typeof fallback === 'string' ? fallback : '');
    }

    function normalizeNumber(value, fallback = 0) {
        const normalizedValue = Number(value);
        return Number.isFinite(normalizedValue) ? normalizedValue : fallback;
    }

    function normalizeInteger(value, fallback = 0) {
        const normalizedValue = Number.parseInt(value, 10);
        return Number.isFinite(normalizedValue) ? normalizedValue : fallback;
    }

    function clampUnitInterval(value, fallback = 0) {
        const normalizedValue = normalizeNumber(value, fallback);
        if (normalizedValue <= 0) {
            return 0;
        }
        if (normalizedValue >= 1) {
            return 1;
        }
        return normalizedValue;
    }

    function uniqueStrings(values = []) {
        return Array.from(new Set(
            (Array.isArray(values) ? values : [])
                .map((value) => normalizeString(value, ''))
                .filter(Boolean)
        ));
    }

    function getNestedValue(source, path, fallback = undefined) {
        if (!source || typeof source !== 'object' || !path) {
            return fallback;
        }

        const pathSegments = Array.isArray(path) ? path : String(path).split('.');
        let currentValue = source;

        for (const segment of pathSegments) {
            if (!segment) {
                continue;
            }

            if (!currentValue || typeof currentValue !== 'object' || !hasOwn(currentValue, segment)) {
                return fallback;
            }

            currentValue = currentValue[segment];
        }

        return currentValue === undefined ? fallback : currentValue;
    }

    function getArrayAtPaths(source, candidatePaths = []) {
        for (const path of Array.isArray(candidatePaths) ? candidatePaths : []) {
            const value = getNestedValue(source, path, undefined);
            if (Array.isArray(value)) {
                return value.slice();
            }
        }

        return [];
    }

    function computeMean(values = [], fallback = 0) {
        const normalizedValues = Array.isArray(values)
            ? values
                .map((value) => normalizeNumber(value, Number.NaN))
                .filter((value) => Number.isFinite(value))
            : [];

        if (!normalizedValues.length) {
            return fallback;
        }

        return normalizedValues.reduce((sum, value) => sum + value, 0) / normalizedValues.length;
    }

    function averageUnit(values = [], fallback = 0) {
        return clampUnitInterval(computeMean(values, fallback), fallback);
    }

    function normalizeWorldBounds(worldBounds = DEFAULT_WORLD_BOUNDS) {
        const normalizedBounds = isPlainObject(worldBounds) ? worldBounds : {};
        return {
            width: Math.max(1, normalizeInteger(normalizedBounds.width, DEFAULT_WORLD_BOUNDS.width)),
            height: Math.max(1, normalizeInteger(normalizedBounds.height, DEFAULT_WORLD_BOUNDS.height))
        };
    }

    function createRecord(recordFactoryName, draft = {}) {
        return typeof macro[recordFactoryName] === 'function'
            ? macro[recordFactoryName](draft)
            : cloneValue(draft);
    }

    function createValidationReport(validationReport = {}) {
        if (typeof macro.createValidationReportSkeleton === 'function') {
            return macro.createValidationReportSkeleton(validationReport);
        }

        return cloneValue(validationReport);
    }

    function createMacroPackage(input = {}) {
        if (typeof macro.createMacroGeographyPackageSkeleton === 'function') {
            return macro.createMacroGeographyPackageSkeleton(input);
        }

        return cloneValue(input);
    }

    function validateMacroPackage(candidate = {}) {
        return typeof macro.validateMacroGeographyPackage === 'function'
            ? macro.validateMacroGeographyPackage(candidate)
            : { isValid: true, errors: [] };
    }

    function findInputRecordArray(input = {}, recordKey = '') {
        const normalizedRecordKey = normalizeString(recordKey, '');
        if (!normalizedRecordKey) {
            return [];
        }

        for (const path of STAGE_RECORD_PATHS) {
            const recordArray = getNestedValue(input, `${path}.${normalizedRecordKey}`, undefined);
            if (Array.isArray(recordArray)) {
                return recordArray.slice();
            }
        }

        return [];
    }

    function findInputIntermediateOutput(input = {}, outputId = '') {
        const normalizedOutputId = normalizeString(outputId, '');
        if (!normalizedOutputId) {
            return null;
        }

        for (const path of STAGE_INTERMEDIATE_OUTPUT_PATHS) {
            const outputGroup = getNestedValue(input, path, undefined);
            if (outputGroup && typeof outputGroup === 'object' && hasOwn(outputGroup, normalizedOutputId)) {
                return outputGroup[normalizedOutputId];
            }
        }

        return null;
    }

    function buildContinentRecords(input = {}, reliefRegions = [], climateBands = []) {
        const existingRecords = findInputRecordArray(input, 'continents');
        if (existingRecords.length) {
            return existingRecords.map((record) => createRecord('createContinentRecordSkeleton', record));
        }

        const continentBodies = findInputIntermediateOutput(input, 'continentBodies') || {};
        const continentalCohesionSummaries = findInputIntermediateOutput(input, 'continentalCohesionSummaries') || {};
        const bodyRows = getArrayAtPaths(continentBodies, ['continentBodies', 'bodies']);
        const summaryRows = getArrayAtPaths(continentalCohesionSummaries, ['continentSummaries']);
        const fallbackRows = bodyRows.length ? bodyRows : summaryRows;

        return fallbackRows.map((row, index) => {
            const continentId = normalizeString(
                row.continentId || row.continentBodyId,
                `continent_${String(index + 1).padStart(3, '0')}`
            );
            const reliefRegionIds = uniqueStrings(
                []
                    .concat(row.reliefRegionIds)
                    .concat(
                        reliefRegions
                            .filter((reliefRegion) => Array.isArray(reliefRegion.continentIds) && reliefRegion.continentIds.includes(continentId))
                            .map((reliefRegion) => reliefRegion.reliefRegionId)
                    )
            );
            const climateBandIds = uniqueStrings(row.climateBandIds);

            return createRecord('createContinentRecordSkeleton', {
                continentId,
                nameSeed: normalizeString(row.nameSeed, continentId),
                macroShape: normalizeString(row.macroShape || row.shapeClass || row.cohesionClass, 'continental_block'),
                plateIds: uniqueStrings(row.plateIds),
                reliefRegionIds,
                climateBandIds,
                primaryReliefRegionId: normalizeString(row.primaryReliefRegionId, reliefRegionIds[0] || ''),
                primaryClimateBandId: normalizeString(row.primaryClimateBandId, climateBandIds[0] || '')
            });
        });
    }

    function buildSeaRegionRecords(input = {}, climateBands = [], archipelagoRegions = []) {
        const existingRecords = findInputRecordArray(input, 'seaRegions');
        if (existingRecords.length) {
            return existingRecords.map((record) => createRecord('createSeaRegionRecordSkeleton', record));
        }

        const seaRegionClusters = findInputIntermediateOutput(input, 'seaRegionClusters') || {};
        const climateSummaries = findInputIntermediateOutput(input, 'regionalClimateSummaries') || {};
        const clusterRows = getArrayAtPaths(seaRegionClusters, ['seaRegionClusters', 'clusters', 'regionClusters']);
        const fallbackSeaIds = uniqueStrings(archipelagoRegions.flatMap((record) => record.seaRegionIds));

        if (!clusterRows.length && fallbackSeaIds.length) {
            return fallbackSeaIds.map((seaRegionId, index) => createRecord('createSeaRegionRecordSkeleton', {
                seaRegionId,
                basinType: index === 0 ? 'open_ocean' : 'semi_enclosed_sea',
                stormPressure: 0.5,
                navigability: 0.5,
                climateBandIds: uniqueStrings(climateBands.map((band) => band.climateBandId)).slice(0, 2),
                primaryClimateBandId: normalizeString((climateBands[0] || {}).climateBandId, '')
            }));
        }

        return clusterRows.map((row, index) => {
            const seaRegionId = normalizeString(
                row.seaRegionId || row.clusterId || row.id,
                `sea_region_${String(index + 1).padStart(3, '0')}`
            );
            const climateBandIds = uniqueStrings(
                []
                    .concat(row.climateBandIds)
                    .concat(
                        getArrayAtPaths(climateSummaries, ['seaSummaries'])
                            .filter((summary) => normalizeString(summary.seaRegionClusterId || summary.seaRegionId, '') === seaRegionId)
                            .flatMap((summary) => uniqueStrings(summary.climateBandIds))
                    )
            );

            return createRecord('createSeaRegionRecordSkeleton', {
                seaRegionId,
                basinType: normalizeString(row.basinType || row.regionType || row.clusterType || row.kind, 'open_ocean'),
                stormPressure: clampUnitInterval(row.stormPressure || row.exposureScore || row.hazardScore, 0.5),
                navigability: clampUnitInterval(row.navigability || row.navigabilityScore || row.openWaterReach, 0.5),
                climateBandIds,
                primaryClimateBandId: normalizeString(row.primaryClimateBandId, climateBandIds[0] || '')
            });
        });
    }

    function buildMountainSystemRecords(input = {}, reliefRegions = []) {
        const existingRecords = findInputRecordArray(input, 'mountainSystems');
        if (existingRecords.length) {
            return existingRecords.map((record) => createRecord('createMountainSystemRecordSkeleton', record));
        }

        const mountainBeltCandidates = findInputIntermediateOutput(input, 'mountainBeltCandidates') || {};
        const candidateRows = getArrayAtPaths(mountainBeltCandidates, ['mountainBeltCandidates', 'candidates']);

        if (!candidateRows.length) {
            return reliefRegions
                .filter((record) => normalizeString(record.reliefType, '') === 'mountain')
                .slice(0, 2)
                .map((record, index) => createRecord('createMountainSystemRecordSkeleton', {
                    mountainSystemId: `mountain_system_${String(index + 1).padStart(3, '0')}`,
                    systemType: 'mountain_belt',
                    plateIds: uniqueStrings(record.plateIds),
                    reliefRegionIds: [normalizeString(record.reliefRegionId, '')],
                    primaryReliefRegionId: normalizeString(record.reliefRegionId, ''),
                    spineOrientation: 'mixed',
                    upliftBias: clampUnitInterval(record.elevationBias, 0.6),
                    ridgeContinuity: clampUnitInterval(record.ruggednessBias, 0.6)
                }));
        }

        return candidateRows.map((row, index) => createRecord('createMountainSystemRecordSkeleton', {
            mountainSystemId: normalizeString(
                row.mountainSystemId || row.candidateId || row.id,
                `mountain_system_${String(index + 1).padStart(3, '0')}`
            ),
            systemType: normalizeString(row.systemType || row.type, 'mountain_belt'),
            plateIds: uniqueStrings(row.plateIds),
            reliefRegionIds: uniqueStrings(row.reliefRegionIds),
            primaryReliefRegionId: normalizeString(row.primaryReliefRegionId, uniqueStrings(row.reliefRegionIds)[0] || ''),
            spineOrientation: normalizeString(row.spineOrientation || row.orientation, 'mixed'),
            upliftBias: clampUnitInterval(row.upliftBias || row.pressureScore, 0.6),
            ridgeContinuity: clampUnitInterval(row.ridgeContinuity || row.continuity, 0.6)
        }));
    }

    function buildVolcanicZoneRecords(input = {}, reliefRegions = [], mountainSystems = []) {
        const existingRecords = findInputRecordArray(input, 'volcanicZones');
        if (existingRecords.length) {
            return existingRecords.map((record) => createRecord('createVolcanicZoneRecordSkeleton', record));
        }

        const arcFormationHelper = findInputIntermediateOutput(input, 'arcFormationHelper') || {};
        const hotspotVolcanicSeedHelper = findInputIntermediateOutput(input, 'hotspotVolcanicSeedHelper') || {};
        const arcRows = getArrayAtPaths(arcFormationHelper, ['arcGuides', 'guides']);
        const hotspotRows = getArrayAtPaths(hotspotVolcanicSeedHelper, ['hotspotSeedRows', 'hotspotSeeds', 'seedRows']);
        const primaryReliefRegionId = normalizeString((reliefRegions[0] || {}).reliefRegionId, '');
        const mountainSystemId = normalizeString((mountainSystems[0] || {}).mountainSystemId, '');

        return []
            .concat(arcRows.map((row, index) => createRecord('createVolcanicZoneRecordSkeleton', {
                volcanicZoneId: normalizeString(row.volcanicZoneId || row.arcId || row.id, `volcanic_zone_arc_${String(index + 1).padStart(3, '0')}`),
                sourceType: 'arc',
                plateIds: uniqueStrings(row.plateIds),
                reliefRegionIds: uniqueStrings(row.reliefRegionIds),
                mountainSystemIds: mountainSystemId ? [mountainSystemId] : [],
                primaryReliefRegionId: normalizeString(row.primaryReliefRegionId, primaryReliefRegionId),
                activityBias: clampUnitInterval(row.activityBias || row.volcanicBias, 0.5),
                zoneContinuity: clampUnitInterval(row.zoneContinuity || row.arcContinuity, 0.5)
            })))
            .concat(hotspotRows.map((row, index) => createRecord('createVolcanicZoneRecordSkeleton', {
                volcanicZoneId: normalizeString(row.volcanicZoneId || row.hotspotId || row.id, `volcanic_zone_hotspot_${String(index + 1).padStart(3, '0')}`),
                sourceType: 'hotspot',
                plateIds: uniqueStrings(row.plateIds),
                reliefRegionIds: uniqueStrings(row.reliefRegionIds),
                mountainSystemIds: [],
                primaryReliefRegionId: normalizeString(row.primaryReliefRegionId, primaryReliefRegionId),
                activityBias: clampUnitInterval(row.activityBias || row.intensity, 0.5),
                zoneContinuity: clampUnitInterval(row.zoneContinuity || row.trailContinuity, 0.5)
            })));
    }

    function buildArchipelagoRegionRecords(input = {}) {
        const existingRecords = findInputRecordArray(input, 'archipelagoRegions');
        if (existingRecords.length) {
            return existingRecords.map((record) => createRecord('createArchipelagoRegionRecordSkeleton', record));
        }

        const archipelagoMacroZones = findInputIntermediateOutput(input, 'archipelagoMacroZones') || {};
        const macroZones = getArrayAtPaths(archipelagoMacroZones, ['macroZones']);

        return macroZones.map((zone, index) => {
            const recordDraftHints = isPlainObject(zone.recordDraftHints) ? zone.recordDraftHints : {};
            return createRecord('createArchipelagoRegionRecordSkeleton', {
                archipelagoId: normalizeString(recordDraftHints.archipelagoId || zone.archipelagoId, `archipelago_${String(index + 1).padStart(3, '0')}`),
                morphologyType: normalizeString(recordDraftHints.morphologyType || zone.morphologyType, 'broken_chain'),
                roleProfile: normalizeString(recordDraftHints.roleProfile || getNestedValue(zone, 'roleSeedHints.primaryRoleSeed', ''), ''),
                seaRegionIds: uniqueStrings(recordDraftHints.seaRegionIds || zone.seaRegionIds),
                climateBandIds: uniqueStrings(recordDraftHints.climateBandIds),
                primarySeaRegionId: normalizeString(recordDraftHints.primarySeaRegionId, uniqueStrings(zone.seaRegionIds)[0] || ''),
                primaryClimateBandId: normalizeString(recordDraftHints.primaryClimateBandId, ''),
                macroRouteIds: uniqueStrings(recordDraftHints.macroRouteIds || zone.macroRouteIds),
                chokepointIds: uniqueStrings(recordDraftHints.chokepointIds || zone.linkedChokepointIds),
                strategicRegionIds: uniqueStrings(recordDraftHints.strategicRegionIds),
                connectiveValue: clampUnitInterval(recordDraftHints.connectiveValue || zone.connectiveValue, 0),
                fragility: clampUnitInterval(recordDraftHints.fragility || zone.fragility, 0),
                colonizationAppeal: clampUnitInterval(recordDraftHints.colonizationAppeal || zone.colonizationAppeal, 0),
                longTermSustainability: clampUnitInterval(recordDraftHints.longTermSustainability, 0),
                historicalVolatility: clampUnitInterval(recordDraftHints.historicalVolatility, 0)
            });
        });
    }

    function buildMacroRouteRecords(input = {}) {
        const existingRecords = findInputRecordArray(input, 'macroRoutes');
        if (existingRecords.length) {
            return existingRecords.map((record) => createRecord('createMacroRouteRecordSkeleton', record));
        }

        const macroRoutes = findInputIntermediateOutput(input, 'macroRoutes') || {};
        const macroCorridors = findInputIntermediateOutput(input, 'macroCorridors') || {};
        const routeRows = getArrayAtPaths(macroRoutes, ['candidateRoutes']);
        const corridorRows = getArrayAtPaths(macroCorridors, ['macroCorridors']);
        const corridorRowsByRouteId = new Map();

        corridorRows.forEach((corridor) => {
            uniqueStrings(corridor.supportingRouteIds).forEach((routeId) => {
                if (!corridorRowsByRouteId.has(routeId)) {
                    corridorRowsByRouteId.set(routeId, []);
                }
                corridorRowsByRouteId.get(routeId).push(corridor);
            });
        });

        return routeRows.map((row, index) => {
            const routeId = normalizeString(row.routeId, `macro_route_${String(index + 1).padStart(3, '0')}`);
            const linkedCorridors = corridorRowsByRouteId.get(routeId) || [];
            return createRecord('createMacroRouteRecordSkeleton', {
                routeId,
                type: normalizeString(row.type || row.routeMode, 'hybrid_route'),
                fromRegion: normalizeString(row.fromRegion || row.fromRegionalSegmentId || row.fromContinentId || row.fromNodeId, ''),
                toRegion: normalizeString(row.toRegion || row.toRegionalSegmentId || row.toContinentId || row.toNodeId, ''),
                through: uniqueStrings(row.through || row.nodePathIds || row.edgePathIds),
                baseCost: clampUnitInterval(row.baseCost || row.meanEdgeRouteCost || row.totalRouteCost, 0.5),
                fragility: clampUnitInterval(
                    row.fragility
                    || averageUnit(linkedCorridors.map((corridor) => corridor.routeDependenceScore || corridor.structureFragilityScore), 0.5),
                    0.5
                ),
                redundancy: clampUnitInterval(
                    row.redundancy
                    || (1 - averageUnit(linkedCorridors.map((corridor) => corridor.routeDependenceScore), 0.5)),
                    0.5
                ),
                historicalImportance: clampUnitInterval(
                    row.historicalImportance
                    || averageUnit(linkedCorridors.map((corridor) => corridor.supportScore), 0.5),
                    0.5
                )
            });
        });
    }

    function buildStrategicRegionRecords(input = {}) {
        const existingRecords = findInputRecordArray(input, 'strategicRegions');
        if (existingRecords.length) {
            return existingRecords.map((record) => createRecord('createStrategicRegionRecordSkeleton', record));
        }

        const strategicRegionCandidates = findInputIntermediateOutput(input, 'strategicRegionCandidates') || {};
        const candidateRows = []
            .concat(getArrayAtPaths(strategicRegionCandidates, ['imperialCoreCandidates']))
            .concat(getArrayAtPaths(strategicRegionCandidates, ['tradeBeltCandidates']))
            .concat(getArrayAtPaths(strategicRegionCandidates, ['fragilePeripheryCandidates']))
            .concat(getArrayAtPaths(strategicRegionCandidates, ['disputedStrategicRegionCandidates']));

        return candidateRows.map((candidate, index) => {
            const recordDraftHints = isPlainObject(candidate.recordDraftHints) ? candidate.recordDraftHints : {};
            const regionId = normalizeString(
                recordDraftHints.regionId || candidate.regionId,
                normalizeString(candidate.strategicCandidateId, `strategic_region_${String(index + 1).padStart(3, '0')}`)
                    .replace(/^candidate_/, 'strategic_region_')
            );

            return createRecord('createStrategicRegionRecordSkeleton', {
                regionId,
                type: normalizeString(recordDraftHints.type || candidate.type, 'strategic_region_candidate'),
                valueMix: isPlainObject(recordDraftHints.valueMix) ? recordDraftHints.valueMix : candidate.valueMix,
                stabilityScore: clampUnitInterval(recordDraftHints.stabilityScore || candidate.stabilityScore || candidate.candidateScore, 0),
                expansionPressure: clampUnitInterval(recordDraftHints.expansionPressure || candidate.expansionPressure || candidate.candidateScore, 0)
            });
        });
    }

    function resolveValidationArtifacts(input = {}) {
        const providedValidationReport = getNestedValue(input, 'validationRebalance.outputs.intermediateOutputs.validationReport', undefined)
            || getNestedValue(input, 'validationReport', undefined);
        const providedValidationDiagnostics = getNestedValue(input, 'validationRebalance.outputs.intermediateOutputs.macroValidationDiagnostics', undefined);
        const providedRebalancePass = getNestedValue(input, 'validationRebalance.outputs.intermediateOutputs.partialRegenerationRebalancePass', undefined);

        if (providedValidationReport) {
            return {
                validationReport: createValidationReport(providedValidationReport),
                macroValidationDiagnostics: cloneValue(providedValidationDiagnostics || {}),
                partialRegenerationRebalancePass: cloneValue(providedRebalancePass || {})
            };
        }

        if (typeof macro.validateAndRebalanceMacroWorld === 'function') {
            const validationBundle = macro.validateAndRebalanceMacroWorld(input);
            const intermediateOutputs = getNestedValue(validationBundle, 'outputs.intermediateOutputs', {});
            return {
                validationReport: createValidationReport(intermediateOutputs.validationReport || {}),
                macroValidationDiagnostics: cloneValue(intermediateOutputs.macroValidationDiagnostics || {}),
                partialRegenerationRebalancePass: cloneValue(intermediateOutputs.partialRegenerationRebalancePass || {})
            };
        }

        return {
            validationReport: createValidationReport({}),
            macroValidationDiagnostics: {},
            partialRegenerationRebalancePass: {}
        };
    }

    function mergePackageValidationReport(validationReport = {}, packageValidationErrors = []) {
        const normalizedValidationReport = createValidationReport(validationReport);
        const normalizedErrors = Array.isArray(packageValidationErrors)
            ? packageValidationErrors.map((value) => `${value}`)
            : [];

        if (!normalizedErrors.length) {
            return normalizedValidationReport;
        }

        return createValidationReport({
            isValid: false,
            scores: normalizedValidationReport.scores,
            failReasons: uniqueStrings(
                []
                    .concat(normalizedValidationReport.failReasons)
                    .concat(normalizedErrors)
            ),
            rebalanceActions: normalizedValidationReport.rebalanceActions,
            diagnostics: {
                warnings: uniqueStrings(
                    []
                        .concat(getArrayAtPaths(normalizedValidationReport, ['diagnostics.warnings']))
                        .concat('Package assembly produced contract diagnostics; downstream export should stay blocked until targeted reroll succeeds.')
                ),
                blockedDownstreamPhases: uniqueStrings(
                    []
                        .concat(getArrayAtPaths(normalizedValidationReport, ['diagnostics.blockedDownstreamPhases']))
                        .concat('exportPackage')
                )
            },
            selectiveRerollRecommendations: normalizedValidationReport.selectiveRerollRecommendations
        });
    }

    function buildCoastalOpportunityPackageLayer(input = {}) {
        const providedLayer = findInputRecordArray(input, 'coastalOpportunityMap');
        if (providedLayer.length) {
            return providedLayer.map(cloneValue);
        }

        const exceptionalCoastalNodes = findInputIntermediateOutput(input, 'exceptionalCoastalNodes') || {};
        return getArrayAtPaths(exceptionalCoastalNodes, ['exceptionalCoastalNodes']).map(cloneValue);
    }

    function buildIsolatedZonePackageLayer(input = {}) {
        const providedZones = findInputRecordArray(input, 'isolatedZones');
        if (providedZones.length) {
            return providedZones.map(cloneValue);
        }

        const isolatedZones = findInputIntermediateOutput(input, 'isolatedZones') || {};
        return getArrayAtPaths(isolatedZones, ['zones']).map(cloneValue);
    }

    function buildMacroGeographyPackage(input = {}) {
        const normalizedSeed = typeof macro.normalizeSeed === 'function'
            ? macro.normalizeSeed(hasOwn(input, 'macroSeed') ? input.macroSeed : input.seed)
            : 0;
        const worldBounds = normalizeWorldBounds(
            hasOwn(input, 'worldBounds')
                ? input.worldBounds
                : getNestedValue(input, 'reliefElevation.worldBounds', DEFAULT_WORLD_BOUNDS)
        );
        const validationArtifacts = resolveValidationArtifacts({
            ...input,
            macroSeed: normalizedSeed,
            worldBounds
        });
        const plates = findInputRecordArray(input, 'plates').map((record) => createRecord('createPlateRecordSkeleton', record));
        const reliefRegions = findInputRecordArray(input, 'reliefRegions').map((record) => createRecord('createReliefRegionRecordSkeleton', record));
        const climateBands = findInputRecordArray(input, 'climateBands').map((record) => createRecord('createClimateBandRecordSkeleton', record));
        const riverBasins = findInputRecordArray(input, 'riverBasins').map((record) => createRecord('createRiverBasinRecordSkeleton', record));
        const chokepoints = findInputRecordArray(input, 'chokepoints').map((record) => createRecord('createChokepointRecordSkeleton', record));
        const continents = buildContinentRecords(input, reliefRegions, climateBands);
        const archipelagoRegions = buildArchipelagoRegionRecords(input);
        const seaRegions = buildSeaRegionRecords(input, climateBands, archipelagoRegions);
        const mountainSystems = buildMountainSystemRecords(input, reliefRegions);
        const volcanicZones = buildVolcanicZoneRecords(input, reliefRegions, mountainSystems);
        const macroRoutes = buildMacroRouteRecords(input);
        const strategicRegions = buildStrategicRegionRecords(input);
        const coastalOpportunityMap = buildCoastalOpportunityPackageLayer(input);
        const isolatedZones = buildIsolatedZonePackageLayer(input);
        const debugArtifacts = isPlainObject(input.debugArtifacts)
            ? cloneValue(input.debugArtifacts)
            : {};

        let macroGeographyPackage = createMacroPackage({
            macroSeed: normalizedSeed,
            version: PHASE_VERSION,
            worldBounds,
            plates,
            continents,
            seaRegions,
            mountainSystems,
            volcanicZones,
            riverBasins,
            climateBands,
            reliefRegions,
            archipelagoRegions,
            coastalOpportunityMap,
            chokepoints,
            macroRoutes,
            isolatedZones,
            strategicRegions,
            debugArtifacts,
            validationReport: validationArtifacts.validationReport
        });

        const packageValidation = validateMacroPackage(macroGeographyPackage);
        if (packageValidation && packageValidation.isValid === false) {
            macroGeographyPackage = createMacroPackage({
                ...macroGeographyPackage,
                validationReport: mergePackageValidationReport(
                    macroGeographyPackage.validationReport,
                    packageValidation.errors
                )
            });
        }

        return deepFreeze(macroGeographyPackage);
    }

    function getMacroGeographyPackageBuilderDescriptor() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            phaseVersion: PHASE_VERSION,
            description: 'Partial export-package builder that assembles MacroGeographyPackage from available Phase 1 records and contract-safe synthesized rows.'
        });
    }

    function getMacroGeographyPackageBuilderInputContract() {
        return deepFreeze({
            requiredKeys: REQUIRED_KEYS.slice(),
            optionalKeys: OPTIONAL_KEYS.slice()
        });
    }

    function getMacroGeographyPackageBuilderOutputContract() {
        return deepFreeze({
            moduleId: MODULE_ID,
            pipelineStepId: PIPELINE_STEP_ID,
            status: STATUS,
            actualOutputs: {
                package: 'MacroGeographyPackage'
            },
            intentionallyAbsent: INTENTIONALLY_ABSENT.slice()
        });
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule(MODULE_ID, {
            entry: 'buildMacroGeographyPackage',
            file: 'js/worldgen/macro/macro-geography-package-builder.js',
            description: 'Partial export-package builder for Phase 1. It reuses implemented records and synthesizes contract-valid package rows from upstream intermediate outputs where final record passes are still deferred.',
            stub: false
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep(PIPELINE_STEP_ID, {
            moduleId: MODULE_ID,
            file: 'js/worldgen/macro/macro-geography-package-builder.js',
            description: 'Export-package assembly for Phase 1 MacroGeographyPackage using available records plus contract-safe synthesized rows.',
            stub: false
        });
    }

    Object.assign(macro, {
        getMacroGeographyPackageBuilderDescriptor,
        getMacroGeographyPackageBuilderInputContract,
        getMacroGeographyPackageBuilderOutputContract,
        buildMacroGeographyPackage
    });
})();
