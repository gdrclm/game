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
        const climateSummaries = findInputIntermediateOutput(input, 'regionalClimateSummaries') || {};
        const fallbackRows = bodyRows.length ? bodyRows : summaryRows;

        return fallbackRows.map((row, index) => {
            const draft = row.recordDraft || row;
            const continentId = normalizeString(
                draft.continentId || row.continentBodyId,
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
            const climateBandIds = uniqueStrings((draft.climateBandIds || []).concat(
                getArrayAtPaths(climateSummaries, ['continentSummaries'])
                    .filter(summary => summary.continentId === continentId)
                    .flatMap(summary => summary.climateBandIds || [])
            ));

            return createRecord('createContinentRecordSkeleton', {
                continentId,
                nameSeed: normalizeString(draft.nameSeed, continentId),
                macroShape: normalizeString(row.macroShape || row.shapeClass || row.cohesionClass, 'continental_block'),
                plateIds: uniqueStrings(row.plateIds),
                reliefRegionIds,
                climateBandIds,
                primaryReliefRegionId: normalizeString(row.primaryReliefRegionId, reliefRegionIds[0] || ''),
                primaryClimateBandId: normalizeString(row.primaryClimateBandId, climateBandIds[0] || '')
            });
        });
    }

    function buildReliefRegionRecords(input, worldBounds) {
        const { width, height } = worldBounds;
        const seaByCell = [];
        const seaClusters = findInputIntermediateOutput(input, 'seaRegionClusters')?.seaRegionClusters || [];
        for (const region of seaClusters) {
            for (const cell of region.cellIndices) seaByCell[cell] = region.recordDraft.seaRegionId;
        }
        const bodies = findInputIntermediateOutput(input, 'reliefRegionExtraction')?.reliefRegionBodies || [];
        const topology = findInputIntermediateOutput(input, 'coastalAccessTopology');
        const portsByRelief = new Map();
        for (const port of topology?.ports || []) {
            if (port.reliefRegionId) portsByRelief.set(port.reliefRegionId, port.seaRegionId);
        }
        const cellsById = new Map(bodies.map(body => [body.reliefRegionId, body.cellIndices]));
        return findInputRecordArray(input, 'reliefRegions').map(record => {
            const adjacentSeaRegionIds = new Set(record.adjacentSeaRegionIds || []);
            for (const cell of cellsById.get(record.reliefRegionId) || []) {
                macro.forEachCardinalNeighbor(cell, width, width * height, neighbor => {
                    if (seaByCell[neighbor]) adjacentSeaRegionIds.add(seaByCell[neighbor]);
                });
            }
            if (portsByRelief.has(record.reliefRegionId)) adjacentSeaRegionIds.add(portsByRelief.get(record.reliefRegionId));
            return createRecord('createReliefRegionRecordSkeleton', { ...record, adjacentSeaRegionIds: [...adjacentSeaRegionIds] });
        });
    }

    function buildSeaRegionRecords(input = {}) {
        const existingRecords = findInputRecordArray(input, 'seaRegions');
        if (existingRecords.length) {
            return existingRecords.map((record) => createRecord('createSeaRegionRecordSkeleton', record));
        }

        const seaRegionClusters = findInputIntermediateOutput(input, 'seaRegionClusters') || {};
        const seaNavigability = findInputIntermediateOutput(input, 'seaNavigabilityTagging') || {};
        const climateSummaries = findInputIntermediateOutput(input, 'regionalClimateSummaries') || {};
        const stormValues = getNestedValue(input, 'climateEnvelope.outputs.fields.stormCorridorField.values');
        const tagged = getArrayAtPaths(seaNavigability, ['taggedSeaRegionClusters']);
        const clusterRows = tagged.length ? tagged : getArrayAtPaths(seaRegionClusters, ['seaRegionClusters', 'clusters', 'regionClusters']);
        return clusterRows.map((row, index) => {
            const draft = row.recordDraft || row;
            const seaRegionId = normalizeString(draft.seaRegionId || row.clusterId || row.id,
                `sea_region_${String(index + 1).padStart(3, '0')}`);
            const climateBandIds = uniqueStrings((draft.climateBandIds || []).concat(
                getArrayAtPaths(climateSummaries, ['seaSummaries'])
                    .filter(summary => summary.seaRegionId === seaRegionId)
                    .flatMap(summary => summary.climateBandIds || [])
            ));
            const inheritedHazard = clampUnitInterval(draft.stormPressure ?? row.exposureScore ?? row.hazardScore, 0.5);
            const stormPressure = stormValues?.length && row.cellIndices?.length
                ? 0.7 * computeMean(row.cellIndices.map(cellIndex => stormValues[cellIndex])) + 0.3 * inheritedHazard
                : inheritedHazard;
            return createRecord('createSeaRegionRecordSkeleton', {
                seaRegionId,
                basinType: normalizeString(draft.basinType || row.regionType || row.clusterType || row.kind, 'open_ocean'),
                stormPressure,
                navigability: clampUnitInterval(draft.navigability ?? row.navigabilityScore ?? row.openWaterReach, 0.5),
                climateBandIds,
                primaryClimateBandId: normalizeString(draft.primaryClimateBandId || climateBandIds[0], '')
            });
        });
    }

    function buildFeatureReliefLookup(input) {
        const extraction = findInputIntermediateOutput(input, 'reliefRegionExtraction');
        const { width, height } = extraction?.worldBounds || {};
        const reliefByCell = [];
        for (const region of extraction?.reliefRegionBodies || []) {
            for (const cell of region.cellIndices) reliefByCell[cell] = region.reliefRegionId;
        }
        return function findIntersectedRelief(points, radius) {
            const counts = new Map();
            const visited = new Set();
            for (const { x, y } of points.filter(Boolean)) {
                for (let row = Math.max(0, Math.ceil(y - radius)); row <= Math.min(height - 1, y + radius); row += 1) {
                    for (let column = Math.max(0, Math.ceil(x - radius)); column <= Math.min(width - 1, x + radius); column += 1) {
                        if (Math.hypot(column - x, row - y) > radius) continue;
                        const key = row * width + column;
                        const id = reliefByCell[key];
                        if (!id || visited.has(key)) continue;
                        visited.add(key);
                        counts.set(id, (counts.get(id) || 0) + 1);
                    }
                }
            }
            return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([id]) => id);
        };
    }

    function buildMountainSystemRecords(input = {}, reliefRegions = []) {
        const existing = findInputRecordArray(input, 'mountainSystems');
        if (existing.length) return existing.map(record => createRecord('createMountainSystemRecordSkeleton', record));
        const candidates = getArrayAtPaths(findInputIntermediateOutput(input, 'mountainBeltCandidates') || {}, ['mountainBeltCandidates', 'candidates']);
        const findRelief = buildFeatureReliefLookup(input);
        if (!candidates.length) {
            return reliefRegions.filter(record => record.reliefType === 'mountain').slice(0, 2).map((record, index) =>
                createRecord('createMountainSystemRecordSkeleton', {
                    mountainSystemId: `mountain_system_${String(index + 1).padStart(3, '0')}`,
                    systemType: 'mountain_belt',
                    plateIds: record.plateIds,
                    reliefRegionIds: [record.reliefRegionId],
                    primaryReliefRegionId: record.reliefRegionId,
                    spineOrientation: 'mixed',
                    upliftBias: record.elevationBias,
                    ridgeContinuity: record.ruggednessBias
                }));
        }
        return candidates.flatMap(row => {
            const draft = row.recordDraft;
            if (!draft || !row.spineStartPoint || !row.spineEndPoint) return [];
            const start = row.spineStartPoint;
            const end = row.spineEndPoint;
            const steps = Math.max(1, Math.ceil(row.spineLength / 3));
            const points = Array.from({ length: steps + 1 }, (_, step) => ({
                x: start.x + (end.x - start.x) * step / steps,
                y: start.y + (end.y - start.y) * step / steps
            }));
            const reliefRegionIds = findRelief(points, Math.max(3, Math.min(row.candidateArea.radiusX, row.candidateArea.radiusY)));
            return reliefRegionIds.length ? [createRecord('createMountainSystemRecordSkeleton', {
                ...draft, reliefRegionIds, primaryReliefRegionId: reliefRegionIds[0]
            })] : [];
        });
    }

    function buildVolcanicZoneRecords(input = {}, mountainSystems = []) {
        const existing = findInputRecordArray(input, 'volcanicZones');
        if (existing.length) return existing.map(record => createRecord('createVolcanicZoneRecordSkeleton', record));
        const arcs = getArrayAtPaths(findInputIntermediateOutput(input, 'arcFormationHelper') || {}, ['arcGuides']);
        const hotspots = getArrayAtPaths(findInputIntermediateOutput(input, 'hotspotVolcanicSeedHelper') || {}, ['hotspotSeeds']);
        const emerged = getNestedValue(input, 'reliefElevation.outputs.fields.seaLevelAppliedElevationField.seaLevelModel.hotspotChain');
        const findRelief = buildFeatureReliefLookup(input);
        return arcs.concat(hotspots).flatMap(source => {
            const hotspot = Boolean(source.hotspotSeedId);
            const points = hotspot ? [source.seedPoint, ...source.trailSamples] : source.curveSamples;
            if (hotspot && source.hotspotSeedId === emerged?.hotspotSeedId) points.push(...emerged.peaks);
            const reliefRegionIds = findRelief(points, hotspot ? source.seedArea.influenceRadius : source.guideArea.influenceRadius / 2);
            if (!reliefRegionIds.length) return [];
            const sourceType = hotspot ? 'hotspot' : 'arc';
            const plateIds = hotspot ? [source.sourcePlateId] : source.sourcePlateIds;
            const mountainSystemIds = hotspot ? [] : mountainSystems.filter(mountain =>
                mountain.plateIds.some(id => plateIds.includes(id))
                && mountain.reliefRegionIds.some(id => reliefRegionIds.includes(id))
            ).map(mountain => mountain.mountainSystemId);
            return [createRecord('createVolcanicZoneRecordSkeleton', {
                volcanicZoneId: `volc_${source.arcGuideId || source.hotspotSeedId}`,
                sourceType,
                plateIds,
                reliefRegionIds,
                mountainSystemIds,
                primaryReliefRegionId: reliefRegionIds[0],
                activityBias: hotspot ? source.volcanicZoneBias : source.volcanicArcBias,
                zoneContinuity: hotspot ? source.persistenceBias : source.arcStrength
            })];
        });
    }

    function buildArchipelagoRegionRecords(input = {}) {
        const existingRecords = findInputRecordArray(input, 'archipelagoRegions');
        if (existingRecords.length) {
            return existingRecords.map((record) => createRecord('createArchipelagoRegionRecordSkeleton', record));
        }

        const archipelagoMacroZones = findInputIntermediateOutput(input, 'archipelagoMacroZones') || {};
        const macroZones = getArrayAtPaths(archipelagoMacroZones, ['macroZones']);

        const extraction = findInputIntermediateOutput(input, 'reliefRegionExtraction');
        const bands = findInputRecordArray(input, 'climateBands');
        const reliefByCell = [];
        for (const region of extraction?.reliefRegionBodies || []) {
            for (const cell of region.cellIndices) reliefByCell[cell] = region.reliefRegionId;
        }

        return macroZones.map((zone, index) => {
            const recordDraftHints = isPlainObject(zone.recordDraftHints) ? zone.recordDraftHints : {};
            const islandRelief = new Set((zone.cellIndices || []).map(cell => reliefByCell[cell]).filter(Boolean));
            const climateBandIds = uniqueStrings([...(recordDraftHints.climateBandIds || []),
                ...bands.filter(band => band.reliefRegionIds.some(id => islandRelief.has(id))).map(band => band.climateBandId)]);
            return createRecord('createArchipelagoRegionRecordSkeleton', {
                archipelagoId: normalizeString(recordDraftHints.archipelagoId || zone.archipelagoId, `archipelago_${String(index + 1).padStart(3, '0')}`),
                morphologyType: normalizeString(recordDraftHints.morphologyType || zone.morphologyType, 'broken_chain'),
                roleProfile: normalizeString(recordDraftHints.roleProfile || getNestedValue(zone, 'roleSeedHints.primaryRoleSeed', ''), ''),
                seaRegionIds: uniqueStrings(recordDraftHints.seaRegionIds || zone.seaRegionIds),
                climateBandIds,
                primarySeaRegionId: normalizeString(recordDraftHints.primarySeaRegionId, uniqueStrings(zone.seaRegionIds)[0] || ''),
                primaryClimateBandId: normalizeString(recordDraftHints.primaryClimateBandId || climateBandIds[0], ''),
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

    function mergeRoutePassages(route, crossings, edgesById) {
        if (!crossings?.length || !route.regionPathPositions || route.through) return route.through || route.regionPathIds;
        const positions = route.regionPathPositions.slice();
        for (const { chokeId, restrictedCells } of crossings) {
            for (const [index, edgeId] of route.edgePathIds.entries()) {
                const edge = edgesById.get(edgeId);
                if (!edge?.waterPathCellIndices) continue;
                const path = edge.fromNodeId === route.nodePathIds[index]
                    ? edge.waterPathCellIndices : edge.waterPathCellIndices.slice().reverse();
                const firstCrossing = path.findIndex(cell => restrictedCells.has(cell));
                if (firstCrossing < 0) continue;
                positions.push([chokeId, index + (firstCrossing + 1) / (path.length + 1)]);
                break;
            }
        }
        return positions.sort((left, right) => left[1] - right[1]).map(([id]) => id);
    }

    function buildMacroRouteRecords(input = {}) {
        const existingRecords = findInputRecordArray(input, 'macroRoutes');
        if (existingRecords.length) {
            return existingRecords.map((record) => createRecord('createMacroRouteRecordSkeleton', record));
        }

        const macroRoutes = findInputIntermediateOutput(input, 'macroRoutes') || {};
        const macroCorridors = findInputIntermediateOutput(input, 'macroCorridors') || {};
        const chokepointLinks = findInputIntermediateOutput(input, 'chokepointRecords')?.recordLinks || [];
        const chokeByPassage = new Map(chokepointLinks.map(link => [link.sourceReferenceId, link.chokepointId]));
        const topology = findInputIntermediateOutput(input, 'coastalAccessTopology');
        const passages = [...(topology?.islandPassages || []), ...(topology?.coastalInletPassages || [])];
        const crossings = new Map(passages.map(passage => [passage.passageId, new Set(passage.restrictedCellIndices)]));
        const graphEdges = findInputIntermediateOutput(input, 'hybridConnectivityGraph')?.edges || [];
        const edgesById = new Map(graphEdges.map(edge => [edge.edgeId, edge]));
        const routeRows = getArrayAtPaths(macroRoutes, ['candidateRoutes']);
        const corridorRows = getArrayAtPaths(macroCorridors, ['macroCorridors']);
        const corridorRowsByRouteId = new Map();
        const outageByRouteId = new Map();
        const crossingsByRoute = new Map();

        corridorRows.forEach((corridor) => {
            uniqueStrings(corridor.supportingRouteIds).forEach((routeId) => {
                if (!corridorRowsByRouteId.has(routeId)) {
                    corridorRowsByRouteId.set(routeId, []);
                }
                corridorRowsByRouteId.get(routeId).push(corridor);
            });
            for (const sample of corridor.dependenceSampleRows || []) {
                const impact = sample.blockedWithoutCorridor ? 1 : clampUnitInterval(sample.relativeDetourPenalty, 0);
                outageByRouteId.set(sample.routeId, Math.max(outageByRouteId.get(sample.routeId) || 0, impact));
                const chokeId = chokeByPassage.get(corridor.sourcePassageId);
                const restrictedCells = crossings.get(corridor.sourcePassageId);
                if (impact > 0 && chokeId && restrictedCells) {
                    const related = crossingsByRoute.get(sample.routeId) || [];
                    related.push({ chokeId, restrictedCells });
                    crossingsByRoute.set(sample.routeId, related);
                }
            }
        });

        const zones = findInputIntermediateOutput(input, 'archipelagoMacroZones')?.macroZones || [];
        const archipelagoByIslandGroup = new Map(zones.flatMap(zone =>
            (zone.sourceIslandGroupIds || []).map(groupId => [groupId, zone.archipelagoId])
        ));
        return routeRows.map((row, index) => {
            const routeId = normalizeString(row.routeId, `macro_route_${String(index + 1).padStart(3, '0')}`);
            const linkedCorridors = corridorRowsByRouteId.get(routeId) || [];
            const measuredImpact = outageByRouteId.get(routeId);
            const sameContinent = row.fromContinentId && row.fromContinentId === row.toContinentId;
            const fromArea = sameContinent ? row.fromReliefRegionId : (row.fromContinentId || row.fromReliefRegionId);
            const toArea = sameContinent ? row.toReliefRegionId : (row.toContinentId || row.toReliefRegionId);
            const cumulativeCost = normalizeNumber(row.totalRouteCost, Number.NaN);
            const normalizedCost = Number.isFinite(cumulativeCost) && cumulativeCost >= 0
                ? cumulativeCost / (1 + cumulativeCost) : row.meanEdgeRouteCost;
            return createRecord('createMacroRouteRecordSkeleton', {
                routeId,
                type: normalizeString(row.type || row.routeMode, 'hybrid_route'),
                fromRegion: normalizeString(row.fromRegion || fromArea || archipelagoByIslandGroup.get(row.fromIslandGroupId)
                    || row.fromSeaRegionId || row.fromRegionalSegmentId || row.fromNodeId, ''),
                toRegion: normalizeString(row.toRegion || toArea || archipelagoByIslandGroup.get(row.toIslandGroupId)
                    || row.toSeaRegionId || row.toRegionalSegmentId || row.toNodeId, ''),
                through: uniqueStrings(mergeRoutePassages(row, crossingsByRoute.get(routeId), edgesById) || row.nodePathIds || row.edgePathIds),
                baseCost: clampUnitInterval(row.baseCost ?? normalizedCost, 0.5),
                fragility: clampUnitInterval(
                    row.fragility
                    ?? Math.max(measuredImpact ?? 0, averageUnit(linkedCorridors.map(corridor => corridor.structureFragilityScore), 0.5)),
                    0.5
                ),
                redundancy: clampUnitInterval(
                    row.redundancy
                    ?? (measuredImpact === undefined ? 0.5 : 1 - measuredImpact),
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

        const topology = findInputIntermediateOutput(input, 'coastalAccessTopology');
        if (topology) return topology.ports.map(cloneValue);
        const exceptionalCoastalNodes = findInputIntermediateOutput(input, 'exceptionalCoastalNodes') || {};
        return getArrayAtPaths(exceptionalCoastalNodes, ['exceptionalCoastalNodes']).map(cloneValue);
    }

    function buildIsolatedZonePackageLayer(input = {}) {
        const providedZones = findInputRecordArray(input, 'isolatedZones');
        if (providedZones.length) {
            return providedZones.map(cloneValue);
        }

        const isolatedZones = findInputIntermediateOutput(input, 'isolatedZones') || {};
        const nodes = findInputIntermediateOutput(input, 'hybridConnectivityGraph')?.nodes || [];
        const nodesById = new Map(nodes.map(node => [node.nodeId, node]));
        const zones = getArrayAtPaths(isolatedZones, ['zones']);
        return zones.map(zone => ({
            ...cloneValue(zone),
            seaRegionIds: uniqueStrings((zone.nodeIds || []).map(id => nodesById.get(id)?.seaRegionId)),
            reliefRegionIds: uniqueStrings((zone.nodeIds || []).map(id => nodesById.get(id)?.reliefRegionId))
        }));
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
        const reliefRegions = buildReliefRegionRecords(input, worldBounds);
        const climateBands = findInputRecordArray(input, 'climateBands').map((record) => createRecord('createClimateBandRecordSkeleton', record));
        const riverBasins = findInputRecordArray(input, 'riverBasins').map((record) => createRecord('createRiverBasinRecordSkeleton', record));
        const environmentalCoverage = macro.buildEnvironmentalCoverage({
            mask: getNestedValue(input, 'marineCarving.outputs.fields.coastJaggednessControlledLandWaterMaskField'),
            reliefRegions,
            reliefBodies: findInputIntermediateOutput(input, 'reliefRegionExtraction')?.reliefRegionBodies,
            riverBasins,
            watersheds: findInputIntermediateOutput(input, 'watershedSegmentation')?.watersheds,
            climateBands,
            climateZones: findInputIntermediateOutput(input, 'climateZoneClassification')?.zoneSummaries,
            localWater: input.localWater,
            wind: getNestedValue(input, 'climateEnvelope.outputs.fields.prevailingWindField')
        });
        const chokepoints = findInputRecordArray(input, 'chokepoints').map((record) => createRecord('createChokepointRecordSkeleton', record));
        const continents = buildContinentRecords(input, reliefRegions, climateBands);
        const archipelagoRegions = buildArchipelagoRegionRecords(input);
        const seaRegions = buildSeaRegionRecords(input);
        const mountainSystems = buildMountainSystemRecords(input, reliefRegions);
        const volcanicZones = buildVolcanicZoneRecords(input, mountainSystems);
        const macroRoutes = buildMacroRouteRecords(input);
        const sampledRoutes = findInputIntermediateOutput(input, 'macroRoutes')?.candidateRoutes;
        const hybridGraph = findInputIntermediateOutput(input, 'hybridConnectivityGraph');
        const marineRouteGeometry = macro.buildMarineRouteGeometry(sampledRoutes, hybridGraph, macroRoutes);
        const weather = input.climateEnvelope?.outputs?.fields;
        const surface = getNestedValue(input, 'marineCarving.outputs.fields.finalRelativeElevationField');
        const seaClusters = findInputIntermediateOutput(input, 'seaRegionClusters');
        const isolatedInlandWater = macro.describeIsolatedInlandWater(
            seaClusters?.isolatedInlandWater, surface, weather, input.finalDrainage);
        const marineRouteSurvey = marineRouteGeometry && macro.surveyMarineRouteGeometry({
            macroSeed: normalizedSeed, worldBounds, macroRoutes, marineRouteGeometry
        }, surface, sampledRoutes, hybridGraph, weather && {
            storm: weather.stormCorridorField?.values, seasonality: weather.seasonalityField?.values,
            seaClusters: seaClusters?.seaRegionClusters || []
        });
        const contactModel = input.tectonicSkeleton?.outputs?.intermediateOutputs?.plateBoundaryClassification?.adjacencyModel;
        const plateContactProvenance = contactModel && {
            model: contactModel,
            selectionPolicy: 'bounded_relief_support_v1',
            ...(input.plateContactReliefComparison && { comparison: input.plateContactReliefComparison })
        };
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
            ...(isolatedInlandWater.length && { isolatedInlandWater }),
            mountainSystems,
            volcanicZones,
            riverBasins,
            climateBands,
            reliefRegions,
            archipelagoRegions,
            coastalOpportunityMap,
            chokepoints,
            macroRoutes,
            marineRouteGeometry,
            ...(marineRouteSurvey && { marineGeometryVersion: 1, marineRouteSurvey }),
            plateContactProvenance,
            isolatedZones,
            strategicRegions,
            environmentalCoverage,
            regionalArchipelago: input.regionalArchipelago?.regionalGeography,
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
