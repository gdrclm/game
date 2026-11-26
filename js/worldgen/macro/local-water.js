(() => {
    const macro = window.Game.systems.worldgenMacro;
    const round = value => Number(value.toFixed(6));

    function measureLocalWater({ signed, width, subdivision = 1, drainage, wetness, seasonality }) {
        const size = signed.length;
        const { downstreamCellIndices: downstream, terminalLandCellIndices: terminal, outlets } = drainage;
        const cellArea = 1 / subdivision ** 2;
        const branches = new Map(outlets.map(outlet => [outlet.outletCellIndex, {
            ...outlet, inputPotential: 0, lowInputPotential: 0, spillElevation: null, storageSpace: 0
        }]));
        const tributaries = new Uint8Array(size);
        const hasSource = new Uint8Array(size);
        const distance = new Int32Array(size).fill(-1);
        const sourceCell = new Int32Array(size).fill(-1);
        const ascent = new Float64Array(size);
        const input = new Float64Array(size);
        const lowInput = new Float64Array(size);

        for (let cell = 0; cell < size; cell += 1) {
            if (terminal[cell] < 0) continue;
            const branch = branches.get(terminal[cell]);
            input[cell] = wetness[cell] * cellArea;
            lowInput[cell] = input[cell] * (1 - seasonality[cell]);
            branch.inputPotential += input[cell];
            branch.lowInputPotential += lowInput[cell];
            const next = downstream[cell];
            if (next >= 0 && terminal[next] >= 0 && drainage.runoffPotentialByCell[cell] > 0) tributaries[next] += 1;
            if (branch.receiver !== 'local_depression') continue;
            macro.forEachCardinalNeighbor(cell, width, size, neighbor => {
                if (terminal[neighbor] === terminal[cell]) return;
                const sill = Math.max(signed[cell], signed[neighbor]);
                branch.spillElevation = Math.min(branch.spillElevation ?? Infinity, sill);
            });
        }

        const queue = [];
        for (let cell = 0; cell < size; cell += 1) {
            if (terminal[cell] < 0) continue;
            const branch = branches.get(terminal[cell]);
            if (branch.spillElevation !== null) {
                branch.storageSpace += Math.max(0, branch.spillElevation - signed[cell]) * cellArea;
            }
            const receivesWater = cell === terminal[cell] && branch.receiver === 'local_depression'
                && branch.spillElevation > signed[cell] && branch.inputPotential > 0;
            if (receivesWater || tributaries[cell] >= 2) {
                hasSource[cell] = 1;
                distance[cell] = 0;
                sourceCell[cell] = cell;
                queue.push(cell);
            }
        }
        for (let cursor = 0; cursor < queue.length; cursor += 1) {
            const cell = queue[cursor];
            const nextDistance = distance[cell] + 1;
            macro.forEachCardinalNeighbor(cell, width, size, neighbor => {
                if (terminal[neighbor] < 0 || (distance[neighbor] >= 0 && distance[neighbor] !== nextDistance)) return;
                // Measure the climb travelling from this neighbor toward the water.
                const nextAscent = ascent[cell] + Math.max(0, signed[cell] - signed[neighbor]);
                if (distance[neighbor] < 0) {
                    distance[neighbor] = nextDistance;
                    queue.push(neighbor);
                } else if (nextAscent > ascent[neighbor]
                    || (nextAscent === ascent[neighbor] && sourceCell[cell] >= sourceCell[neighbor])) return;
                ascent[neighbor] = nextAscent;
                sourceCell[neighbor] = sourceCell[cell];
            });
        }
        return { branches, terminal, hasSource, distance, sourceCell, ascent, input, lowInput, subdivision, signed, cellArea };
    }

    function createWaterAccessSummary() {
        return { landCellCount: 0, sourceCellCount: 0, reachableCellCount: 0, inputPotential: 0,
            lowInputPotential: 0, storageSpace: 0, distance: 0, ascent: 0 };
    }

    function addWaterAccessCell(summary, water, cell) {
        summary.landCellCount += 1;
        summary.sourceCellCount += water.hasSource[cell];
        summary.inputPotential += water.input[cell];
        summary.lowInputPotential += water.lowInput[cell];
        const sill = water.branches.get(water.terminal[cell]).spillElevation;
        if (sill !== null) summary.storageSpace += Math.max(0, sill - water.signed[cell]) * water.cellArea;
        if (water.distance[cell] < 0) return;
        summary.reachableCellCount += 1;
        summary.distance += water.distance[cell] / water.subdivision;
        summary.ascent += water.ascent[cell];
    }

    function summarizeWaterAccess({ distance, ascent, ...row }) {
        return { ...row, inputPotential: round(row.inputPotential), lowInputPotential: round(row.lowInputPotential),
            storageSpace: round(row.storageSpace),
            meanDistance: row.reachableCellCount ? round(distance / row.reachableCellCount) : null,
            meanAscent: row.reachableCellCount ? round(ascent / row.reachableCellCount) : null };
    }

    function serializeDrainageBranch(branch) {
        return { ...branch, inputPotential: round(branch.inputPotential), lowInputPotential: round(branch.lowInputPotential),
            storageSpace: round(branch.storageSpace) };
    }

    const nonnegative = value => Number.isFinite(value) && value >= 0;
    const count = value => Number.isSafeInteger(value) && value >= 0;
    const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);

    function validateWaterAccessSummary(row, landCells, subdivision = 1) {
        return isRecord(row) && count(landCells) && row.landCellCount === landCells
            && count(row.sourceCellCount) && count(row.reachableCellCount)
            && row.sourceCellCount <= row.reachableCellCount && row.reachableCellCount <= landCells
            && nonnegative(row.inputPotential) && row.inputPotential <= landCells / subdivision ** 2 + 1e-6
            && nonnegative(row.lowInputPotential) && row.lowInputPotential <= row.inputPotential
            && nonnegative(row.storageSpace)
            && (row.reachableCellCount ? nonnegative(row.meanDistance) && nonnegative(row.meanAscent)
                : row.meanDistance === null && row.meanAscent === null);
    }

    function validateDrainageCoverage(coverage, bounds) {
        const water = coverage.localWater;
        if (water === undefined) return [];
        if (water?.version !== 1 || !Array.isArray(water.branches) || !isRecord(water.reliefRegions)) {
            return ['Invalid local water coverage.'];
        }
        const errors = [];
        const size = bounds?.width * bounds?.height;
        const inside = cell => count(cell) && cell < size;
        const seen = new Set();
        const totals = { reliefRegionCells: {}, riverBasinCells: {} };
        const carriers = { reliefRegionCells: coverage.reliefRegions, riverBasinCells: coverage.riverBasins };
        let totalLand = 0;
        for (const row of water.branches) {
            const cell = row?.outletCellIndex;
            const next = row?.receivingCellIndex;
            const depression = row?.receiver === 'local_depression';
            if (!inside(cell) || seen.has(cell) || row.catchmentId !== `drainage_outlet_${cell}`
                || !count(row.contributingCells) || row.contributingCells === 0
                || !nonnegative(row.inputPotential) || row.inputPotential > row.contributingCells + 1e-6
                || !nonnegative(row.lowInputPotential) || row.lowInputPotential > row.inputPotential
                || !nonnegative(row.storageSpace) || (row.spillElevation !== null && !nonnegative(row.spillElevation))
                || (row.spillElevation === null && row.storageSpace > 0)
                || (depression ? next !== -1 : !['ocean', 'inland_water'].includes(row.receiver) || !inside(next)
                    || row.spillElevation !== null || Math.abs(cell % bounds.width - next % bounds.width)
                    + Math.abs(Math.floor(cell / bounds.width) - Math.floor(next / bounds.width)) !== 1)) {
                errors.push(`Invalid local drainage branch at cell ${cell}.`);
                continue;
            }
            seen.add(cell);
            totalLand += row.contributingCells;
            for (const [field, collection] of Object.entries(carriers)) {
                if (!isRecord(row[field])) {
                    errors.push(`Missing drainage branch intersections at ${row.catchmentId}.${field}.`);
                    continue;
                }
                let overlap = 0;
                for (const [id, area] of Object.entries(row[field])) {
                    if (!Object.hasOwn(collection, id) || !count(area) || area === 0) {
                        errors.push(`Invalid drainage carrier ${id} at ${row.catchmentId}.${field}.`);
                        continue;
                    }
                    totals[field][id] = (totals[field][id] || 0) + area;
                    overlap += area;
                }
                if (overlap > row.contributingCells) errors.push(`Drainage branch intersections exceed area at ${row.catchmentId}.`);
            }
        }
        if (totalLand > size) errors.push('Local drainage branches exceed world area.');
        for (const [field, collection] of Object.entries(carriers)) {
            for (const [id, row] of Object.entries(collection)) {
                if ((totals[field][id] || 0) !== row?.landCellCount) errors.push(`Local drainage area disagrees with ${id}.`);
            }
        }
        if (Object.keys(water.reliefRegions).length !== Object.keys(coverage.reliefRegions).length) {
            errors.push('Local water access does not cover the relief records.');
        }
        for (const [id, row] of Object.entries(coverage.reliefRegions)) {
            if (!validateWaterAccessSummary(water.reliefRegions[id], row?.landCellCount)) {
                errors.push(`Invalid local water access for ${id}.`);
            }
        }
        return errors;
    }

    Object.assign(macro, { measureLocalWater, createWaterAccessSummary, addWaterAccessCell, summarizeWaterAccess,
        serializeDrainageBranch, validateDrainageCoverage, validateWaterAccessSummary });
})();
