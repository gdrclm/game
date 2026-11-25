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

    function buildIslandPassageSections({ islands, approachShorelines }, mask) {
        const { width, height, values, threshold } = mask;
        const maximumGap = Math.min(width, height) * 0.13;
        const shores = islands.map(island => ({
            ...island, shoreCellIndices: island.cellIndices.filter(cell => hasOpenWaterNeighbor(mask, cell))
        }));
        const neighbors = shores.slice(1).map((to, index) => [shores[index], to]);
        for (const island of shores) for (const approach of approachShorelines || []) neighbors.push([island, approach]);
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
                    if (gap > Math.min(maximumGap, minimumGap + shoulderAllowance(minimumGap))) continue;
                    const cells = traceShoreTransect(left, right, width);
                    if (!cells.length || cells.some(cell => values[cell] >= threshold)) continue;
                    sections.push({ shoreCellIndices: [left, right], restrictedCellIndices: cells, gap });
                    minimumGap = Math.min(minimumGap, gap);
                }
            }
            const seen = new Set();
            const narrowSections = sections.filter(section => section.gap <= minimumGap + shoulderAllowance(minimumGap))
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

    Object.assign(macro, { buildIslandPassageSections, isOpenWaterTerminal });
})();
