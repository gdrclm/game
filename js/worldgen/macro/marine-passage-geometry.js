(() => {
    const macro = window.Game.systems.worldgenMacro;

    function traceShoreTransect(from, to, width) {
        let { x, y } = macro.cellPoint(from, width);
        const target = macro.cellPoint(to, width);
        const dx = Math.abs(target.x - x);
        const dy = -Math.abs(target.y - y);
        const stepX = Math.sign(target.x - x);
        const stepY = Math.sign(target.y - y);
        const cells = [];
        let error = dx + dy;
        // An 8-connected transect is continuous against cardinal water movement.
        while (x !== target.x || y !== target.y) {
            const delta = 2 * error;
            if (delta >= dy) {
                error += dy;
                x += stepX;
            }
            if (delta <= dx) {
                error += dx;
                y += stepY;
            }
            if (x !== target.x || y !== target.y) cells.push(y * width + x);
        }
        return cells;
    }

    function hasOpenWaterNeighbor(mask, cell, blockedCells) {
        let accessible = false;
        macro.forEachCardinalNeighbor(cell, mask.width, mask.values.length, neighbor => {
            if (mask.values[neighbor] < mask.threshold && !blockedCells?.has(neighbor)) accessible = true;
        });
        return accessible;
    }

    function isOpenWaterTerminal(mask, cell, blockedCells) {
        return mask.values[cell] < mask.threshold && !blockedCells.has(cell)
            && hasOpenWaterNeighbor(mask, cell, blockedCells);
    }

    function buildIslandPassageSections({ islands, approachShorelines }, mask, activePathCells) {
        const { width, height, values, threshold } = mask;
        const maximumGap = Math.min(width, height) * 0.13;
        const shores = islands.map(island => ({
            ...island, shoreCellIndices: island.cellIndices.filter(cell => hasOpenWaterNeighbor(mask, cell))
        }));
        const neighbors = shores.slice(1).map((to, index) => [shores[index], to]);
        for (const island of shores) for (const approach of approachShorelines || []) neighbors.push([island, approach]);
        if (activePathCells) {
            for (let index = 0; index < shores.length; index += 1) {
                for (const other of shores.slice(index + 2)) neighbors.push([shores[index], other]);
            }
        }
        const apertures = [];
        const shoulderAllowance = gap => Math.max(2, gap * 2 / 3);
        for (const [from, to] of neighbors) {
            const sections = [];
            let minimumGap = maximumGap;
            for (const left of from.shoreCellIndices) {
                for (const right of to.shoreCellIndices) {
                    const gap = macro.cellDistance(left, right, width);
                    // Survey the local throat and its shoulders. Wider throats permit
                    // a proportionally wider approach while narrow gaps allow for raster error.
                    if (gap > (activePathCells ? maximumGap : Math.min(maximumGap, minimumGap + shoulderAllowance(minimumGap)))) continue;
                    const cells = traceShoreTransect(left, right, width);
                    if (!cells.length || cells.some(cell => values[cell] >= threshold)) continue;
                    if (activePathCells && !cells.some(cell => activePathCells.has(cell))) continue;
                    sections.push({ shoreCellIndices: [left, right], restrictedCellIndices: cells, gap });
                    minimumGap = Math.min(minimumGap, gap);
                }
            }
            const seen = new Set();
            const narrowSections = sections.filter(section => activePathCells || section.gap <= minimumGap + shoulderAllowance(minimumGap))
                .sort((a, b) => a.gap - b.gap || a.shoreCellIndices[0] - b.shoreCellIndices[0]
                    || a.shoreCellIndices[1] - b.shoreCellIndices[1])
                .filter(section => {
                    const key = section.restrictedCellIndices.join(',');
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
            if (narrowSections.length) apertures.push({ from, to, sections: narrowSections });
        }
        return apertures;
    }

    function buildCoastalInletSections(continentBodies, mask, activePathCells) {
        const { width, height, values, threshold } = mask;
        const maximumGap = Math.min(width, height) * 0.13;
        const stepLimit = Math.floor(maximumGap);
        const sections = [];
        for (const body of continentBodies) {
            const continentId = body.recordDraft.continentId;
            const shore = new Set(body.cellIndices.filter(cell => values[cell] >= threshold && hasOpenWaterNeighbor(mask, cell)));
            for (const left of shore) {
                const { x, y } = macro.cellPoint(left, width);
                for (let dy = 0; dy <= stepLimit && y + dy < height; dy += 1) {
                    for (let dx = dy ? -stepLimit : 1; dx <= stepLimit; dx += 1) {
                        const right = left + dy * width + dx;
                        if (x + dx < 0 || x + dx >= width || !shore.has(right)) continue;
                        const gap = Math.hypot(dx, dy);
                        if (gap > maximumGap) continue;
                        const cells = traceShoreTransect(left, right, width);
                        if (cells.some(cell => activePathCells.has(cell)) && cells.every(cell => values[cell] < threshold)) {
                            sections.push({ continentId, shoreCellIndices: [left, right], restrictedCellIndices: cells, gap });
                        }
                    }
                }
            }
        }
        return sections.sort((a, b) => a.gap - b.gap || a.shoreCellIndices[0] - b.shoreCellIndices[0]
            || a.shoreCellIndices[1] - b.shoreCellIndices[1]);
    }

    Object.assign(macro, { buildIslandPassageSections, buildCoastalInletSections, isOpenWaterTerminal });
})();
