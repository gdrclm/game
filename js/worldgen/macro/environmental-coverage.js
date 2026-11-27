(() => {
    const macro = window.Game.systems.worldgenMacro;

    function indexLandCoverage(records, idField, bodies, mask, bodyId) {
        const ids = new Set(records.map(record => record[idField]));
        const byCell = new Array(mask.values.length);
        const byId = new Map();
        for (const body of bodies) {
            const id = bodyId(body);
            if (!ids.has(id)) continue;
            const row = { landCellCount: 0 };
            for (const cell of body.cellIndices) {
                if (mask.values[cell] < mask.threshold) continue;
                byCell[cell] = id;
                row.landCellCount += 1;
            }
            byId.set(id, row);
        }
        return { byCell, byId };
    }

    function countIntersections(size, sources, targets, field) {
        for (let cell = 0; cell < size; cell += 1) {
            const source = sources.byCell[cell];
            const target = targets.byCell[cell];
            if (!source || !target) continue;
            const row = sources.byId.get(source);
            const counts = row[field] ||= {};
            counts[target] = (counts[target] || 0) + 1;
        }
    }

    function sampleRefugeHorizon(signed, width, cell, windX, windY) {
        const magnitude = Math.hypot(windX, windY);
        if (!magnitude) return null;
        const height = signed.length / width;
        const x = cell % width - windX / magnitude;
        const y = Math.floor(cell / width) - windY / magnitude;
        if (x < 0 || x > width - 1 || y < 0 || y > height - 1) return null;
        const left = Math.floor(x);
        const top = Math.floor(y);
        const right = Math.min(width - 1, left + 1);
        const bottom = Math.min(height - 1, top + 1);
        const dx = x - left;
        const dy = y - top;
        return (signed[top * width + left] * (1 - dx) + signed[top * width + right] * dx) * (1 - dy)
            + (signed[bottom * width + left] * (1 - dx) + signed[bottom * width + right] * dx) * dy;
    }

    function measureReliefRefuges(water, width, wind, relief) {
        const { signed, terminal, input, lowInput } = water;
        if (wind?.xValues?.length !== signed.length || wind?.yValues?.length !== signed.length) return undefined;
        const rows = new Map(Array.from(relief.byId.keys(), id => [id, {
            classifiedLandCells: 0, shelteredLandCells: 0, ordinaryInput: 0, lowSeasonInput: 0,
            wateredLandCells: 0, wateredPatchCount: 0, largestWateredPatch: 0
        }]));
        const watered = new Uint8Array(signed.length);
        for (let cell = 0; cell < signed.length; cell += 1) {
            const row = rows.get(relief.byCell[cell]);
            if (!row) continue;
            const upwind = sampleRefugeHorizon(signed, width, cell, wind.xValues[cell], wind.yValues[cell]);
            if (upwind === null) continue;
            row.classifiedLandCells += 1;
            if (upwind <= signed[cell]) continue;
            row.shelteredLandCells += 1;
            row.ordinaryInput += input[cell];
            row.lowSeasonInput += lowInput[cell];
            if (lowInput[cell] > 0) {
                row.wateredLandCells += 1;
                watered[cell] = 1;
            }
        }
        // Report connected, locally replenished land within the same drainage
        // branch. Routed source flow and delivery do not enter this measure.
        for (let cell = 0; cell < watered.length; cell += 1) {
            if (!watered[cell]) continue;
            const id = relief.byCell[cell];
            const row = rows.get(id);
            const queue = [cell];
            watered[cell] = 0;
            for (let index = 0; index < queue.length; index += 1) {
                macro.forEachCardinalNeighbor(queue[index], width, watered.length, neighbor => {
                    if (!watered[neighbor] || relief.byCell[neighbor] !== id || terminal[neighbor] !== terminal[cell]) return;
                    watered[neighbor] = 0;
                    queue.push(neighbor);
                });
            }
            row.wateredPatchCount += 1;
            row.largestWateredPatch = Math.max(row.largestWateredPatch, queue.length);
        }
        return { method: 'one_macrocell_upwind_final_relief', regions: Object.fromEntries(Array.from(rows, ([id, row]) => [
            id, { ...row, ordinaryInput: Number(row.ordinaryInput.toFixed(6)), lowSeasonInput: Number(row.lowSeasonInput.toFixed(6)) }
        ])) };
    }

    function validReliefRefuge(row, water) {
        if (!row) return false;
        const { classifiedLandCells, shelteredLandCells, ordinaryInput, lowSeasonInput,
            wateredLandCells, wateredPatchCount, largestWateredPatch } = row;
        const within = (value, upper) => Number.isSafeInteger(value) && value >= 0 && value <= upper;
        const unshelteredLand = water.landCellCount - shelteredLandCells;
        return within(classifiedLandCells, water.landCellCount) && within(shelteredLandCells, classifiedLandCells)
            && within(wateredLandCells, shelteredLandCells) && within(wateredPatchCount, wateredLandCells)
            && within(largestWateredPatch, wateredLandCells)
            && (wateredLandCells ? wateredPatchCount > 0 && largestWateredPatch > 0
                && largestWateredPatch + wateredPatchCount - 1 <= wateredLandCells
                && largestWateredPatch * wateredPatchCount >= wateredLandCells : largestWateredPatch === 0)
            && Number.isFinite(ordinaryInput) && ordinaryInput >= 0 && ordinaryInput <= shelteredLandCells
            && Number.isFinite(lowSeasonInput) && lowSeasonInput >= 0 && lowSeasonInput <= ordinaryInput
            && lowSeasonInput <= wateredLandCells
            && ordinaryInput <= water.inputPotential && lowSeasonInput <= water.lowInputPotential
            && water.inputPotential - ordinaryInput <= unshelteredLand + 1e-6
            && water.lowInputPotential - lowSeasonInput <= water.inputPotential - ordinaryInput + 2e-6;
    }

    function buildDrainageCoverage(water, relief, basins) {
        const branches = new Map([...water.branches].map(([cell, branch]) => [cell, {
            ...macro.serializeDrainageBranch(branch), reliefRegionCells: {}, riverBasinCells: {}
        }]));
        const access = new Map([...relief.byId.keys()].map(id => [id, macro.createWaterAccessSummary()]));
        for (let cell = 0; cell < water.terminal.length; cell += 1) {
            if (water.terminal[cell] < 0) continue;
            const branch = branches.get(water.terminal[cell]);
            const reliefId = relief.byCell[cell];
            if (reliefId) {
                branch.reliefRegionCells[reliefId] = (branch.reliefRegionCells[reliefId] || 0) + 1;
                macro.addWaterAccessCell(access.get(reliefId), water, cell);
            }
            const basinId = basins.byCell[cell];
            if (basinId) branch.riverBasinCells[basinId] = (branch.riverBasinCells[basinId] || 0) + 1;
        }
        return { version: 1, routingModel: 'steepest_connected_descent', branches: [...branches.values()],
            reliefRegions: Object.fromEntries([...access].map(([id, row]) => [id, macro.summarizeWaterAccess(row)])) };
    }

    function buildEnvironmentalCoverage({ mask, reliefRegions, reliefBodies, riverBasins, watersheds, climateBands, climateZones, localWater, wind }) {
        if (!mask?.values?.length || !reliefBodies?.length || !watersheds?.length || !climateZones?.length) return undefined;
        const relief = indexLandCoverage(reliefRegions, 'reliefRegionId', reliefBodies, mask, body => body.reliefRegionId);
        const climate = indexLandCoverage(climateBands, 'climateBandId', climateZones, mask, zone => zone.climateBandId);
        const basins = indexLandCoverage(riverBasins, 'riverBasinId', watersheds, mask, basin => basin.recordDraft.riverBasinId);
        const size = mask.values.length;
        countIntersections(size, relief, climate, 'climateBandCells');
        countIntersections(size, relief, basins, 'riverBasinCells');
        countIntersections(size, climate, basins, 'riverBasinCells');
        const localDrainage = localWater && buildDrainageCoverage(localWater, relief, basins);
        const reliefRefuges = localWater && measureReliefRefuges(localWater, mask.width, wind, relief);
        return {
            version: 1,
            reliefRegions: Object.fromEntries(relief.byId),
            climateBands: Object.fromEntries(climate.byId),
            riverBasins: Object.fromEntries(basins.byId),
            ...(localDrainage && { localWater: localDrainage }),
            ...(reliefRefuges && { reliefRefuges })
        };
    }

    function validateEnvironmentalCoverage(geography) {
        const coverage = geography.environmentalCoverage;
        if (coverage === undefined) return [];
        const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);
        const collections = { reliefRegions: 'reliefRegionId', climateBands: 'climateBandId', riverBasins: 'riverBasinId' };
        if (coverage?.version !== 1 || Object.keys(collections).some(key => !isRecord(coverage[key]))) {
            return ['Invalid environmentalCoverage version or collections.'];
        }
        const worldSize = geography.worldBounds?.width * geography.worldBounds?.height;
        const errors = [];
        for (const [collection, idField] of Object.entries(collections)) {
            const records = Array.isArray(geography[collection]) ? geography[collection] : [];
            const ids = new Set(records.map(record => record?.[idField]));
            for (const id of ids) {
                if (!Object.hasOwn(coverage[collection], id)) {
                    errors.push(`Missing land coverage at environmentalCoverage.${collection}.${id}.`);
                }
            }
            let total = 0;
            for (const [id, row] of Object.entries(coverage[collection])) {
                const path = `environmentalCoverage.${collection}.${id}`;
                if (!ids.has(id) || !Number.isSafeInteger(row?.landCellCount) || row.landCellCount < 0) {
                    errors.push(`Invalid land coverage at ${path}.`);
                    continue;
                }
                total += row.landCellCount;
                const relations = collection === 'reliefRegions'
                    ? { climateBandCells: 'climateBands', riverBasinCells: 'riverBasins' }
                    : collection === 'climateBands' ? { riverBasinCells: 'riverBasins' } : {};
                for (const [field, targetCollection] of Object.entries(relations)) {
                    if (row[field] === undefined) continue;
                    if (!isRecord(row[field])) {
                        errors.push(`Invalid intersection counts at ${path}.${field}.`);
                        continue;
                    }
                    let overlap = 0;
                    for (const [target, count] of Object.entries(row[field])) {
                        const targetSize = coverage[targetCollection][target]?.landCellCount;
                        if (!Number.isSafeInteger(count) || count <= 0 || !Number.isSafeInteger(targetSize) || count > targetSize) {
                            errors.push(`Invalid intersection with ${target} at ${path}.${field}.`);
                            continue;
                        }
                        overlap += count;
                    }
                    if (overlap > row.landCellCount) errors.push(`Intersection counts exceed land coverage at ${path}.${field}.`);
                }
            }
            if (total > worldSize) errors.push(`Land coverage exceeds world area in ${collection}.`);
        }
        if (coverage.localWater !== undefined) errors.push(...macro.validateDrainageCoverage(coverage, geography.worldBounds));
        if (coverage.reliefRefuges !== undefined) {
            const { reliefRefuges } = coverage;
            if (reliefRefuges?.method !== 'one_macrocell_upwind_final_relief' || !isRecord(reliefRefuges.regions)
                || Object.keys(reliefRefuges.regions).length !== Object.keys(coverage.reliefRegions).length) {
                errors.push('Invalid macro refuge coverage.');
            } else {
                for (const id of Object.keys(coverage.reliefRegions)) {
                    const water = coverage.localWater?.reliefRegions?.[id];
                    if (!water || !validReliefRefuge(reliefRefuges.regions[id], water)) {
                        errors.push(`Invalid macro refuge coverage for ${id}.`);
                    }
                }
            }
        }
        return errors;
    }

    Object.assign(macro, { buildEnvironmentalCoverage, validateEnvironmentalCoverage, measureReliefRefuges });
})();
