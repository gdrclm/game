(() => {
    const macro = window.Game.systems.worldgenMacro;
    const SEED_NAMESPACE = 'macro.regionalArchipelago.surface';

    function buildRegionalArchipelago(input = {}) {
        const marine = input.marineCarving?.outputs?.fields;
        const relief = input.reliefElevation?.outputs?.fields;
        const tectonic = input.tectonicSkeleton?.outputs;
        const climate = input.climateEnvelope?.outputs?.fields;
        const connectivity = input.connectivityGraph?.outputs?.intermediateOutputs;
        const topology = connectivity?.coastalAccessTopology;
        const zone = input.archipelagoSignificance?.outputs?.intermediateOutputs?.archipelagoMacroZones?.macroZones?.[0];
        const archipelagoId = zone?.recordDraftHints?.archipelagoId || zone?.archipelagoId;
        const chain = relief?.seaLevelAppliedElevationField?.seaLevelModel?.hotspotChain;
        const bed = marine?.finalRelativeElevationField;
        const hotspotUplift = marine?.offshoreHotspotUpliftField?.values;
        const fracture = tectonic?.fields?.fractureMaskField?.values;
        const storm = climate?.stormCorridorField?.values;
        const seafloor = marine?.macroSeafloorFormField;
        if (!archipelagoId || !bed || !hotspotUplift || !fracture || !storm || !seafloor) return null;
        const regionalSeed = macro.deriveMacroSubSeed(input.macroSeed, SEED_NAMESPACE);
        const waterPaths = (connectivity?.seaConnectivityGraph?.edges || []).map(edge => edge.waterPathCellIndices)
            .filter(path => path?.length > 1);
        const plateSeeds = tectonic.intermediateOutputs?.plateSeedDistribution?.plateSeeds || [];
        const inheritedIds = topology?.islands?.map(row => row.islandId) || [];
        let surface;
        let extracted;
        const processAttempts = [];
        const inheritedPeakById = new Map((topology?.islands || []).map(row => [row.islandId, row.peakCellIndex]));
        const scaleByPeak = new Map();
        const getUnresolved = () => {
            const separateIds = new Set(extracted.islandRecords.flatMap(row =>
                row.physicalOrigin.macroIslandIds.length === 1 ? row.physicalOrigin.macroIslandIds : []));
            return inheritedIds.filter(id => !separateIds.has(id));
        };
        let unresolvedMacroIslandIds = [];
        for (const attenuation of [1, 0.75, 0.5, 0.25, 0, null]) {
            for (const id of unresolvedMacroIslandIds) {
                if (attenuation !== null) scaleByPeak.set(inheritedPeakById.get(id), attenuation);
            }
            const processScale = attenuation === null ? 0 : 1;
            surface = macro.buildRegionalArchipelagoSurface({
                bed, hotspotUplift, fracture, storm, seafloor, topology, chain, regionalSeed, waterPaths, processScale, scaleByPeak
            });
            if (!surface) return null;
            extracted = macro.extractRegionalArchipelagoIslands(surface, topology, chain, bed.width, plateSeeds);
            unresolvedMacroIslandIds = getUnresolved();
            processAttempts.push({ processScale, localScales: Object.fromEntries(scaleByPeak), unresolvedMacroIslandIds });
            if (attenuation === 1 && unresolvedMacroIslandIds.length) {
                const restoredSeparationCells = macro.preserveRegionalWaterSeparations(surface, topology.islands, bed.width);
                if (restoredSeparationCells) {
                    extracted = macro.extractRegionalArchipelagoIslands(surface, topology, chain, bed.width, plateSeeds);
                    unresolvedMacroIslandIds = getUnresolved();
                    processAttempts.push({ processScale, localScales: {}, restoredSeparationCells, unresolvedMacroIslandIds });
                }
            }
            if (!unresolvedMacroIslandIds.length) break;
        }
        const { islandRecords, originCounts, minimumApproximatedAreaCells } = extracted;
        const network = macro.buildRegionalArchipelagoWaterNetwork(islandRecords, surface);
        const regionalGeography = {
            version: 1,
            archipelagoId,
            regionalSeed,
            seedNamespace: SEED_NAMESPACE,
            sourceHotspotSeedId: chain.hotspotSeedId,
            sourceMacroIslandIds: inheritedIds,
            sourcePeaks: chain.peaks.map(({ cellIndex, x, y, radius }) => ({ cellIndex, x, y, radius })),
            sourceVents: surface.vents.map(vent => ({ ...vent })),
            sourceFieldIds: [bed.fieldId, 'offshoreHotspotUpliftField', 'fractureMaskField', 'stormCorridorField', seafloor.fieldId],
            sourceGraphIds: waterPaths.length ? ['seaConnectivityGraph'] : [],
            elevationUnits: 'normalized_macro_elevation_offset_from_sea_level',
            grid: surface.grid,
            elevationRaster: macro.encodeRegionalElevation(surface.signed),
            minimumApproximatedAreaCells,
            processAttempts,
            islandRecords,
            islandEnvironment: macro.buildRegionalIslandEnvironment(islandRecords, surface, input.climateEnvelope.outputs, bed),
            waterNetwork: network,
            summary: {
                islandCount: islandRecords.length,
                originCounts,
                largestWaterConnectedComponent: network.componentSizes[0] || 0,
                areaSensitivity: macro.measureRegionalCarrierCapacity(islandRecords, network)
            }
        };
        return { regionalGeography, surface };
    }

    function validateRegionalArchipelago(value, geography) {
        if (value === undefined) return [];
        if (value?.version !== 1 || !Array.isArray(geography.archipelagoRegions)
            || !geography.archipelagoRegions.some(row => row?.archipelagoId === value.archipelagoId)
            || !Array.isArray(geography.plates) || !geography.worldBounds
            || !Array.isArray(value.islandRecords) || !Array.isArray(value.waterNetwork?.links)
            || !Array.isArray(value.waterNetwork.landfalls)) {
            return ['Invalid regional archipelago version, parent, or record lists.'];
        }
        if (value.seedNamespace !== SEED_NAMESPACE
            || value.regionalSeed !== macro.deriveMacroSubSeed(geography.macroSeed, SEED_NAMESPACE)) {
            return ['Regional archipelago seed does not match its parent namespace.'];
        }
        const { grid } = value;
        const size = grid?.width * grid?.height;
        if (!Number.isSafeInteger(size) || size <= 0 || !Number.isSafeInteger(grid.subdivision) || grid.subdivision <= 0
            || ![grid.originX, grid.originY, grid.width, grid.height].every(Number.isSafeInteger) || grid.originX < 0 || grid.originY < 0
            || grid.originX + (grid.width - 1) / grid.subdivision > geography.worldBounds.width - 1
            || grid.originY + (grid.height - 1) / grid.subdivision > geography.worldBounds.height - 1) {
            return ['Regional archipelago grid exceeds its parent world.'];
        }
        const errors = [];
        // Legacy version-1 packages may omit these additive physical source records.
        const hasSources = value.sourcePeaks !== undefined || value.sourceVents !== undefined;
        const peaks = new Set(), vents = new Set();
        if (hasSources) {
            if (!Array.isArray(value.sourcePeaks) || !value.sourcePeaks.length || !Array.isArray(value.sourceVents)) {
                return ['Invalid regional physical source records.'];
            }
            for (const peak of value.sourcePeaks) {
                if (!Number.isSafeInteger(peak?.cellIndex) || peak.cellIndex < 0
                    || peak.cellIndex >= geography.worldBounds.width * geography.worldBounds.height
                    || peaks.has(peak.cellIndex) || peak.x !== peak.cellIndex % geography.worldBounds.width
                    || peak.y !== Math.floor(peak.cellIndex / geography.worldBounds.width)
                    || !Number.isFinite(peak.radius) || peak.radius <= 0) {
                    errors.push('Invalid regional source peak.');
                }
                peaks.add(peak?.cellIndex);
            }
            for (const vent of value.sourceVents) {
                if (!vent?.ventId || vents.has(vent.ventId) || !peaks.has(vent.parentPeakCell)
                    || ![vent.x, vent.y, vent.rise, vent.radius].every(Number.isFinite)
                    || vent.x < grid.originX || vent.y < grid.originY
                    || vent.x > grid.originX + (grid.width - 1) / grid.subdivision
                    || vent.y > grid.originY + (grid.height - 1) / grid.subdivision
                    || vent.rise <= 0 || vent.radius <= 0) errors.push('Invalid regional source vent.');
                vents.add(vent?.ventId);
            }
        }
        const signed = macro.decodeRegionalElevation(value);
        if (value.elevationRaster !== undefined && !signed) return ['Invalid regional elevation raster.'];
        const isLand = cell => signed && signed[cell] > 0;
        const plates = new Set(geography.plates.map(row => row?.plateId).filter(Boolean));
        const ids = new Set();
        const inside = cell => Number.isSafeInteger(cell) && cell >= 0 && cell < size;
        const adjacent = (a, b) => Math.abs(a % grid.width - b % grid.width)
            + Math.abs(Math.floor(a / grid.width) - Math.floor(b / grid.width)) === 1;
        const allLand = new Set();
        const islandLand = new Map();
        for (const row of value.islandRecords) {
            if (!row?.islandId || ids.has(row.islandId) || !Number.isSafeInteger(row.areaCells) || row.areaCells <= 0
                || !Number.isFinite(row.anchor?.x) || !Number.isFinite(row.anchor?.y) || !Array.isArray(row.landRuns)
                || !Array.isArray(row.shoreEdges) || !row.shoreEdges.length || !plates.has(row.physicalOrigin?.sourcePlateId)
                || ![row.areaMacroCellUnits, row.elevation?.min, row.elevation?.max, row.elevation?.mean,
                    row.nearshoreDepth?.min, row.nearshoreDepth?.max, row.nearshoreDepth?.mean].every(Number.isFinite)
                || row.elevation.min < 0 || row.elevation.min > row.elevation.mean || row.elevation.mean > row.elevation.max
                || row.nearshoreDepth.min < 0 || row.nearshoreDepth.min > row.nearshoreDepth.mean
                || row.nearshoreDepth.mean > row.nearshoreDepth.max
                || Math.abs(row.areaMacroCellUnits * grid.subdivision ** 2 - row.areaCells) > 0.0001) {
                errors.push('Invalid regional island geometry, identity, or source plate.');
                continue;
            }
            ids.add(row.islandId);
            const anchorX = row.anchor.x * grid.subdivision;
            const anchorY = row.anchor.y * grid.subdivision;
            const localX = anchorX - grid.originX * grid.subdivision;
            const localY = anchorY - grid.originY * grid.subdivision;
            const land = new Set();
            let footprintContainsWater = false;
            for (const run of row.landRuns) {
                if (!Array.isArray(run) || !inside(run[0]) || !Number.isSafeInteger(run[1])
                    || run[1] <= 0 || run[0] % grid.width + run[1] > grid.width) {
                    errors.push(`Invalid footprint in ${row.islandId}.`);
                    continue;
                }
                const [cell, length] = run;
                for (let offset = 0; offset < length; offset += 1) {
                    if (allLand.has(cell + offset)) errors.push(`Overlapping footprint in ${row.islandId}.`);
                    if (signed && !isLand(cell + offset)) footprintContainsWater = true;
                    land.add(cell + offset);
                    allLand.add(cell + offset);
                }
            }
            if (land.size !== row.areaCells || row.shoreEdges.some(edge =>
                !Array.isArray(edge) || !land.has(edge[0]) || !inside(edge[1]) || !adjacent(edge[0], edge[1]) || isLand(edge[1]))) {
                errors.push(`Regional island area or shoreline contradicts its footprint in ${row.islandId}.`);
            }
            if (footprintContainsWater) {
                errors.push(`Regional island footprint reaches water in ${row.islandId}.`);
            }
            if (!Number.isSafeInteger(localX) || !Number.isSafeInteger(localY)
                || localX < 0 || localX >= grid.width || localY < 0 || localY >= grid.height
                || !land.has(localY * grid.width + localX) || row.islandId !== `regional_island_${anchorX}_${anchorY}`) {
                errors.push(`Regional island anchor does not resolve to its footprint in ${row.islandId}.`);
            }
            if (hasSources && (!Array.isArray(row.physicalOrigin.regionalVentIds)
                || row.physicalOrigin.regionalVentIds.some(id => !vents.has(id))
                || (row.physicalOrigin.parentPeakCell !== undefined && !peaks.has(row.physicalOrigin.parentPeakCell))
                || (row.physicalOrigin.mechanism === 'volcanic_satellite' && !row.physicalOrigin.regionalVentIds.length))) {
                errors.push('Regional island has unresolved physical sources: ' + row.islandId);
            }
            const restoredPath = row.physicalOrigin.restoredSeparationPath;
            if ((restoredPath !== undefined || row.physicalOrigin.mechanism === 'fault_fragment')
                && (!signed || !Array.isArray(restoredPath) || restoredPath.length < 3
                || !['fault_fragment', 'erosional_fragment'].includes(row.physicalOrigin.mechanism)
                || !land.has(restoredPath[0]) || !isLand(restoredPath.at(-1)) || land.has(restoredPath.at(-1))
                || new Set(restoredPath).size !== restoredPath.length
                || restoredPath.some((cell, index) => !inside(cell) || (index > 0 && !adjacent(restoredPath[index - 1], cell))
                    || (index > 0 && index < restoredPath.length - 1 && isLand(cell))))) {
                errors.push('Regional separation witness contradicts the measured terrain: ' + row.islandId);
            }
            if (signed && !footprintContainsWater && row.shoreEdges.every(edge => Array.isArray(edge) && edge.length === 2)) {
                errors.push(...macro.validateRegionalIslandSurface(row, land, grid, signed));
            }
            islandLand.set(row.islandId, land);
        }
        if (Array.isArray(value.sourceMacroIslandIds)) {
            const separateIds = new Set(value.islandRecords.flatMap(row => row?.physicalOrigin?.macroIslandIds?.length === 1
                ? row.physicalOrigin.macroIslandIds : []));
            for (const sourceId of value.sourceMacroIslandIds) {
                if (!separateIds.has(sourceId)) errors.push(`Regional geography lost or joined source island ${sourceId}.`);
            }
        }
        for (const row of value.islandRecords) {
            if (Array.isArray(row?.shoreEdges) && row.shoreEdges.some(edge => Array.isArray(edge) && allLand.has(edge[1]))) {
                errors.push(`Regional shore enters land in ${row.islandId}.`);
            }
        }
        const landfalls = new Map();
        for (const row of value.waterNetwork.landfalls || []) {
            if (!row || !islandLand.get(row.islandId)?.has(row.landCell) || !inside(row.waterCell) || allLand.has(row.waterCell)
                || isLand(row.waterCell) || !adjacent(row.landCell, row.waterCell) || landfalls.has(row.islandId)) {
                errors.push(`Invalid regional water landfall at ${row?.islandId}.`);
                continue;
            }
            landfalls.set(row.islandId, row.waterCell);
        }
        for (const link of value.waterNetwork.links) {
            const path = link?.waterPathCellIndices;
            if (!Array.isArray(path) || !path.length || link.fromIslandId === link.toIslandId || !landfalls.has(link.fromIslandId)
                || !landfalls.has(link.toIslandId) || landfalls.get(link.fromIslandId) !== path[0]
                || landfalls.get(link.toIslandId) !== path.at(-1)
                || !Number.isFinite(link.distanceMacroCellUnits)
                || Math.abs(link.distanceMacroCellUnits * grid.subdivision - (path.length - 1)) > 0.00001
                || path.some((cell, index) => !inside(cell) || allLand.has(cell) || isLand(cell)
                    || (index > 0 && !adjacent(cell, path[index - 1])))) {
                errors.push('Regional water link has an unresolved endpoint or crosses land.');
                continue;
            }
            if (signed) {
                let shallowest = Infinity;
                let totalDepth = 0;
                for (const cell of path) {
                    const depth = -signed[cell];
                    shallowest = Math.min(shallowest, depth);
                    totalDepth += depth;
                }
                if (![link.shallowestDepth, link.meanDepth].every(Number.isFinite)
                    || Math.abs(shallowest - link.shallowestDepth) > 1e-6
                    || Math.abs(totalDepth / path.length - link.meanDepth) > 1e-6) {
                    errors.push('Regional water link depths contradict the elevation raster.');
                }
            }
        }
        if (!errors.length && Array.isArray(value.summary?.areaSensitivity)) {
            const expected = macro.measureRegionalCarrierCapacity(value.islandRecords, value.waterNetwork);
            if (value.summary.areaSensitivity.length !== expected.length
                || expected.some((row, index) => {
                    const actual = value.summary.areaSensitivity[index];
                    return !actual || actual.minAreaMacroCellUnits !== row.minAreaMacroCellUnits
                        || actual.islandCount !== row.islandCount
                        || actual.openWaterLandfallCount !== row.openWaterLandfallCount
                        || (actual.largestConnectedEligibleCount !== undefined
                            && actual.largestConnectedEligibleCount !== row.largestConnectedEligibleCount);
                })) errors.push('Regional carrier counts contradict the physical water network.');
        }
        if (!errors.length) errors.push(...macro.validateRegionalIslandEnvironment(value, geography));
        return errors;
    }

    macro.buildRegionalArchipelago = buildRegionalArchipelago;
    macro.validateRegionalArchipelago = validateRegionalArchipelago;
})();
