(() => {
    const macro = window.Game.systems.worldgenMacro;
    const collections = {
        plates: ['plateId', 'Plate'],
        continents: ['continentId', 'Continent'],
        seaRegions: ['seaRegionId', 'SeaRegion'],
        mountainSystems: ['mountainSystemId', 'MountainSystem'],
        volcanicZones: ['volcanicZoneId', 'VolcanicZone'],
        reliefRegions: ['reliefRegionId', 'ReliefRegion'],
        climateBands: ['climateBandId', 'ClimateBand'],
        riverBasins: ['riverBasinId', 'RiverBasin'],
        archipelagoRegions: ['archipelagoId', 'ArchipelagoRegion'],
        coastalOpportunityMap: ['coastalNodeId'],
        macroRoutes: ['routeId', 'MacroRoute'],
        chokepoints: ['chokepointId', 'Chokepoint'],
        isolatedZones: ['zoneId'],
        strategicRegions: ['regionId']
    };
    const targetsByField = {
        plateIds: ['plates'], primaryPlateId: ['plates'],
        continentIds: ['continents'], continentId: ['continents'],
        reliefRegionIds: ['reliefRegions'], primaryReliefRegionId: ['reliefRegions'],
        climateBandIds: ['climateBands'], primaryClimateBandId: ['climateBands'],
        seaRegionIds: ['seaRegions'], primarySeaRegionId: ['seaRegions'], seaRegionId: ['seaRegions'],
        adjacentSeaRegionIds: ['seaRegions'], terminalSeaRegionIds: ['seaRegions'],
        mountainSystemIds: ['mountainSystems'], sourceMountainSystemIds: ['mountainSystems'],
        macroRouteIds: ['macroRoutes'], chokepointIds: ['chokepoints'], supportingChokepointIds: ['chokepoints'],
        strategicRegionIds: ['strategicRegions']
    };
    const spatialCollections = ['continents', 'reliefRegions', 'seaRegions', 'archipelagoRegions'];
    const spatialFields = ['adjacentRegions', 'fromRegion', 'toRegion', 'through'];

    function assertFoundationRecordReferences(geography) {
        const errors = [];
        const ids = {};
        for (const [collection, [idField, contract]] of Object.entries(collections)) {
            ids[collection] = new Set();
            for (const row of geography[collection]) {
                const id = row[idField];
                if (!id || ids[collection].has(id)) errors.push(`${collection} contains a missing or repeated ${idField}: ${id}`);
                ids[collection].add(id);
                if (contract) errors.push(...macro[`validate${contract}Record`](row).errors);
            }
        }
        for (const [collection, [idField]] of Object.entries(collections)) {
            for (const row of geography[collection]) {
                for (const [field, value] of Object.entries(row)) {
                    const targets = targetsByField[field] || (spatialFields.includes(field) ? spatialCollections : null);
                    if (!targets) continue;
                    for (const ref of Array.isArray(value) ? value : [value].filter(Boolean)) {
                        if (!targets.some(target => ids[target].has(ref))) {
                            errors.push(`${collection}.${row[idField]}.${field} does not resolve: ${ref}`);
                        }
                    }
                }
            }
        }
        if (errors.length) {
            const error = new Error(errors.slice(0, 12).join(' '));
            error.issues = errors;
            throw error;
        }
    }

    macro.assertFoundationRecordReferences = assertFoundationRecordReferences;
})();
