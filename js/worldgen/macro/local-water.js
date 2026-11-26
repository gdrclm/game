(() => {
    const macro = window.Game.systems.worldgenMacro;
    const round = value => Number(value.toFixed(6));
    const SURFACE_WATER = -1;

    function measureSurfaceWaterSpills(branches, saddles) {
        const parents = new Map([[SURFACE_WATER, SURFACE_WATER]]);
        const links = new Map([[SURFACE_WATER, []]]);
        for (const [id, branch] of branches) {
            branch.retentionToSurfaceWater = null;
            parents.set(id, id);
            links.set(id, []);
        }
        const rootOf = id => {
            while (parents.get(id) !== id) {
                const parent = parents.get(id);
                parents.set(id, parents.get(parent));
                id = parents.get(id);
            }
            return id;
        };
        // Contract monotone catchments into a graph. The minimum spanning
        // forest keeps a minimum-highest-saddle path to existing water.
        for (const { from, to, elevation } of Array.from(saddles.values()).sort((a, b) => a.elevation - b.elevation)) {
            const fromRoot = rootOf(from);
            const toRoot = rootOf(to);
            if (fromRoot === toRoot) continue;
            parents.set(fromRoot, toRoot);
            links.get(from).push({ id: to, elevation });
            links.get(to).push({ id: from, elevation });
        }
        const queue = [{ id: SURFACE_WATER, parent: null, elevation: 0 }];
        for (let cursor = 0; cursor < queue.length; cursor += 1) {
            const node = queue[cursor];
            for (const link of links.get(node.id)) {
                if (link.id === node.parent) continue;
                const elevation = Math.max(node.elevation, link.elevation);
                const branch = branches.get(link.id);
                if (branch.receiver === 'local_depression') {
                    branch.retentionToSurfaceWater = { spillElevation: elevation, storageSpace: 0 };
                }
                queue.push({ id: link.id, parent: node.id, elevation });
            }
        }
    }

    function measureLocalWater({ signed, width, subdivision = 1, drainage, wetness, seasonality }) {
        const size = signed.length;
        const { downstreamCellIndices: downstream, terminalLandCellIndices: terminal, outlets } = drainage;
        const cellArea = 1 / subdivision ** 2;
        const branches = new Map(outlets.map(outlet => [outlet.outletCellIndex, {
            ...outlet, inputPotential: 0, lowInputPotential: 0, spillElevation: null, storageSpace: 0
        }]));
        const tributaries = new Uint8Array(size);
        const hasSource = new Uint8Array(size);
        const input = new Float64Array(size);
        const lowInput = new Float64Array(size);
        const land = [];
        const saddles = new Map();

        for (let cell = 0; cell < size; cell += 1) {
            if (terminal[cell] < 0) continue;
            land.push(cell);
            const branch = branches.get(terminal[cell]);
            input[cell] = wetness[cell] * cellArea;
            lowInput[cell] = input[cell] * (1 - seasonality[cell]);
            branch.inputPotential += input[cell];
            branch.lowInputPotential += lowInput[cell];
            const next = downstream[cell];
            if (next >= 0 && terminal[next] >= 0 && drainage.runoffPotentialByCell[cell] > 0) tributaries[next] += 1;
            macro.forEachCardinalNeighbor(cell, width, size, neighbor => {
                const to = terminal[neighbor];
                if (to === terminal[cell] || (to < 0 && signed[neighbor] > 0)) return;
                const sill = Math.max(signed[cell], signed[neighbor]);
                if (branch.receiver === 'local_depression') {
                    branch.spillElevation = Math.min(branch.spillElevation ?? Infinity, sill);
                }
                if (to >= 0 && neighbor < cell) return;
                const from = terminal[cell];
                const key = Math.min(from, to) * size + Math.max(from, to);
                if (!saddles.has(key) || sill < saddles.get(key).elevation) {
                    saddles.set(key, { from, to, elevation: sill });
                }
            });
        }
        measureSurfaceWaterSpills(branches, saddles);

        const sourceCells = [];
        for (let cell = 0; cell < size; cell += 1) {
            if (terminal[cell] < 0) continue;
            const branch = branches.get(terminal[cell]);
            if (branch.spillElevation !== null) {
                branch.storageSpace += Math.max(0, branch.spillElevation - signed[cell]) * cellArea;
            }
            const retention = branch.retentionToSurfaceWater;
            if (retention) retention.storageSpace += Math.max(0, retention.spillElevation - signed[cell]) * cellArea;
            const receivesWater = cell === terminal[cell] && branch.receiver === 'local_depression'
                && branch.spillElevation > signed[cell] && branch.inputPotential > 0;
            if (receivesWater || tributaries[cell] >= 2) {
                hasSource[cell] = 1;
                sourceCells.push(cell);
            }
        }
        const lowFlow = lowInput.slice();
        const allocatedInput = input.slice();
        const allocatedLowInput = lowInput.slice();
        land.sort((a, b) => signed[b] - signed[a] || a - b);
        for (const cell of land) {
            const next = downstream[cell];
            if (next < 0 || terminal[next] < 0) continue;
            lowFlow[next] += lowFlow[cell];
            // Each contribution belongs to its first potential collection
            // point. Upstream potential must not be allocated a second time.
            if (!hasSource[cell]) {
                allocatedInput[next] += allocatedInput[cell];
                allocatedLowInput[next] += allocatedLowInput[cell];
            }
        }
        const access = traceDryLandAccess(signed, width, cell => terminal[cell] >= 0, sourceCells);
        const areaServed = new Uint32Array(size);
        for (const cell of land) {
            const source = access.sourceCell[cell];
            if (source >= 0) areaServed[source] += 1;
        }
        return { branches, terminal, hasSource, ...access, input, lowInput, lowFlow, flow: drainage.runoffPotentialByCell,
            subdivision, signed, cellArea, allocatedInput, allocatedLowInput, areaServed };
    }

    function traceDryLandAccess(signed, width, isLand, sourceCells) {
        const size = signed.length;
        const distance = new Int32Array(size).fill(-1);
        const sourceCell = new Int32Array(size).fill(-1);
        const ascent = new Float64Array(size);
        const queue = sourceCells.slice();
        for (const cell of queue) {
            distance[cell] = 0;
            sourceCell[cell] = cell;
        }
        for (let cursor = 0; cursor < queue.length; cursor += 1) {
            const cell = queue[cursor];
            const nextDistance = distance[cell] + 1;
            macro.forEachCardinalNeighbor(cell, width, size, neighbor => {
                if (!isLand(neighbor) || (distance[neighbor] >= 0 && distance[neighbor] !== nextDistance)) return;
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
        return { distance, sourceCell, ascent };
    }

    function createWaterAccessSummary() {
        return { landCellCount: 0, sourceCellCount: 0, reachableCellCount: 0, inputPotential: 0,
            lowInputPotential: 0, storageSpace: 0, storageSpaceToSurfaceWater: 0,
            distance: 0, ascent: 0, sourceFlow: 0, sourceLowFlow: 0, allocatedSupply: 0, allocatedLowSupply: 0 };
    }

    function addWaterAccessCell(summary, water, cell) {
        summary.landCellCount += 1;
        summary.sourceCellCount += water.hasSource[cell];
        summary.inputPotential += water.input[cell];
        summary.lowInputPotential += water.lowInput[cell];
        const branch = water.branches.get(water.terminal[cell]);
        const sill = branch.spillElevation;
        if (sill !== null) summary.storageSpace += Math.max(0, sill - water.signed[cell]) * water.cellArea;
        if (branch.retentionToSurfaceWater) {
            summary.storageSpaceToSurfaceWater += Math.max(0, branch.retentionToSurfaceWater.spillElevation
                - water.signed[cell]) * water.cellArea;
        }
        if (water.distance[cell] < 0) return;
        summary.reachableCellCount += 1;
        summary.distance += water.distance[cell] / water.subdivision;
        summary.ascent += water.ascent[cell];
        const source = water.sourceCell[cell];
        summary.sourceFlow += water.flow[source] * water.cellArea;
        summary.sourceLowFlow += water.lowFlow[source];
        const servicedArea = water.areaServed[source] * water.cellArea;
        summary.allocatedSupply += water.allocatedInput[source] / servicedArea;
        summary.allocatedLowSupply += water.allocatedLowInput[source] / servicedArea;
    }

    function summarizeWaterAccess({ distance, ascent, sourceFlow, sourceLowFlow, allocatedSupply, allocatedLowSupply, ...row }) {
        return { ...row, inputPotential: round(row.inputPotential), lowInputPotential: round(row.lowInputPotential),
            storageSpace: round(row.storageSpace), storageSpaceToSurfaceWater: round(row.storageSpaceToSurfaceWater),
            meanDistance: row.reachableCellCount ? round(distance / row.reachableCellCount) : null,
            meanAscent: row.reachableCellCount ? round(ascent / row.reachableCellCount) : null,
            meanSourceFlow: row.reachableCellCount ? round(sourceFlow / row.reachableCellCount) : null,
            meanSourceLowFlow: row.reachableCellCount ? round(sourceLowFlow / row.reachableCellCount) : null,
            allocatedSupplyPerArea: row.reachableCellCount ? round(allocatedSupply / row.reachableCellCount) : null,
            allocatedLowSupplyPerArea: row.reachableCellCount ? round(allocatedLowSupply / row.reachableCellCount) : null };
    }

    function serializeDrainageBranch(branch) {
        const retention = branch.retentionToSurfaceWater;
        return { ...branch, inputPotential: round(branch.inputPotential), lowInputPotential: round(branch.lowInputPotential),
            storageSpace: round(branch.storageSpace), retentionToSurfaceWater: retention && {
                spillElevation: retention.spillElevation, storageSpace: round(retention.storageSpace)
            } };
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
            && (row.storageSpaceToSurfaceWater === undefined || nonnegative(row.storageSpaceToSurfaceWater))
            && (row.reachableCellCount ? nonnegative(row.meanDistance) && nonnegative(row.meanAscent)
                : row.meanDistance === null && row.meanAscent === null)
            && (row.meanSourceFlow === undefined && row.meanSourceLowFlow === undefined
                || (row.reachableCellCount ? nonnegative(row.meanSourceFlow) && nonnegative(row.meanSourceLowFlow)
                    && row.meanSourceLowFlow <= row.meanSourceFlow + 1e-6
                    : row.meanSourceFlow === null && row.meanSourceLowFlow === null))
            && (row.allocatedSupplyPerArea === undefined && row.allocatedLowSupplyPerArea === undefined
                || (row.reachableCellCount ? nonnegative(row.allocatedSupplyPerArea) && nonnegative(row.allocatedLowSupplyPerArea)
                    && row.allocatedLowSupplyPerArea <= row.allocatedSupplyPerArea + 1e-6
                    : row.allocatedSupplyPerArea === null && row.allocatedLowSupplyPerArea === null));
    }

    function validateWaterAccessSubset(part, total, partCells, subdivision) {
        if (!validateWaterAccessSummary(part, partCells, subdivision)
            || !validateWaterAccessSummary(total, total?.landCellCount, subdivision)) return false;
        const outsideCells = total.landCellCount - partCells;
        const outsideReachable = total.reachableCellCount - part.reachableCellCount;
        const outsideSources = total.sourceCellCount - part.sourceCellCount;
        if (outsideSources < 0 || outsideReachable < outsideSources || outsideReachable > outsideCells) return false;
        if (outsideCells === 0) return Object.keys(total).every(key => part[key] === total[key]);

        const outsideInput = total.inputPotential - part.inputPotential;
        const outsideLowInput = total.lowInputPotential - part.lowInputPotential;
        if (outsideInput < -1e-6 || outsideInput > outsideCells / subdivision ** 2 + 1e-6
            || outsideLowInput < -1e-6 || outsideLowInput > outsideInput + 2e-6
            || part.storageSpace > total.storageSpace + 1e-6
            || (part.storageSpaceToSurfaceWater ?? 0) > (total.storageSpaceToSurfaceWater ?? 0) + 1e-6) return false;
        if (partCells === 0 && (part.inputPotential !== 0 || part.storageSpace !== 0 || part.storageSpaceToSurfaceWater > 0)) return false;

        for (const key of ['allocatedSupplyPerArea', 'allocatedLowSupplyPerArea']) {
            if (part[key] === undefined || total[key] === undefined) return false;
            if (!outsideReachable && part[key] !== total[key]) return false;
            // Compare the two allocated amounts over their serviced areas. The common cell area cancels.
            const tolerance = (part.reachableCellCount + total.reachableCellCount) * 1e-6;
            if (part[key] * part.reachableCellCount > total[key] * total.reachableCellCount + tolerance) return false;
        }
        return true;
    }

    function validRetentionToSurfaceWater(row) {
        const retention = row.retentionToSurfaceWater;
        return retention == null || (row.receiver === 'local_depression' && nonnegative(row.spillElevation)
            && nonnegative(retention.spillElevation) && retention.spillElevation >= row.spillElevation
            && nonnegative(retention.storageSpace) && retention.storageSpace >= row.storageSpace);
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
        let totalInput = 0;
        let totalLowInput = 0;
        for (const row of water.branches) {
            const cell = row?.outletCellIndex;
            const next = row?.receivingCellIndex;
            const depression = row?.receiver === 'local_depression';
            if (!inside(cell) || seen.has(cell) || row.catchmentId !== `drainage_outlet_${cell}`
                || !count(row.contributingCells) || row.contributingCells === 0
                || !nonnegative(row.inputPotential) || row.inputPotential > row.contributingCells + 1e-6
                || !nonnegative(row.lowInputPotential) || row.lowInputPotential > row.inputPotential
                || !nonnegative(row.storageSpace) || (row.spillElevation !== null && !nonnegative(row.spillElevation))
                || !validRetentionToSurfaceWater(row)
                || (row.spillElevation === null && row.storageSpace > 0)
                || (depression ? next !== -1 : !['ocean', 'inland_water'].includes(row.receiver) || !inside(next)
                    || row.spillElevation !== null || Math.abs(cell % bounds.width - next % bounds.width)
                    + Math.abs(Math.floor(cell / bounds.width) - Math.floor(next / bounds.width)) !== 1)) {
                errors.push(`Invalid local drainage branch at cell ${cell}.`);
                continue;
            }
            seen.add(cell);
            totalLand += row.contributingCells;
            totalInput += row.inputPotential;
            totalLowInput += row.lowInputPotential;
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
        let supply = 0;
        let lowSupply = 0;
        for (const [id, row] of Object.entries(coverage.reliefRegions)) {
            const access = water.reliefRegions[id];
            if (!validateWaterAccessSummary(access, row?.landCellCount)) {
                errors.push(`Invalid local water access for ${id}.`);
                continue;
            }
            supply += (access.allocatedSupplyPerArea ?? 0) * access.reachableCellCount;
            lowSupply += (access.allocatedLowSupplyPerArea ?? 0) * access.reachableCellCount;
        }
        const roundingTolerance = (totalLand + seen.size) * 1e-6;
        if (supply > totalInput + roundingTolerance || lowSupply > totalLowInput + roundingTolerance) {
            errors.push('Allocated relief water supply exceeds measured incoming water.');
        }
        return errors;
    }

    Object.assign(macro, { measureLocalWater, createWaterAccessSummary, addWaterAccessCell, summarizeWaterAccess,
        serializeDrainageBranch, validateDrainageCoverage, validateWaterAccessSummary, validateWaterAccessSubset, validRetentionToSurfaceWater,
        traceDryLandAccess });
})();
