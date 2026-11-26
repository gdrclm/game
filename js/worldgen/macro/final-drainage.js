(() => {
    const macro = window.Game.systems.worldgenMacro;
    const REACH_MIN_CELLS = 16;

    function routeSurfaceDrainage({ signed: bed, width, wetness, receiverAt, landCells }) {
        const size = bed.length;
        const downstream = new Array(size).fill(-1);
        const terminal = new Array(size).fill(-1);
        const contributingCells = new Array(size).fill(0);
        const runoffPotential = new Array(size).fill(0);
        const land = landCells ? landCells.slice() : [];
        if (!landCells) {
            for (let cell = 0; cell < size; cell += 1) {
                if (bed[cell] > 0) land.push(cell);
            }
        }
        for (const cell of land) {
            contributingCells[cell] = 1;
            if (wetness) runoffPotential[cell] = wetness[cell];
            let lowest = bed[cell];
            macro.forEachCardinalNeighbor(cell, width, size, neighbor => {
                // Water receives flow at its surface. Its bed depth cannot
                // make a deep mouth attract runoff away from a shallow one.
                const receivingElevation = Math.max(0, bed[neighbor]);
                if (receivingElevation >= lowest) return;
                downstream[cell] = neighbor;
                lowest = receivingElevation;
            });
        }
        land.sort((a, b) => bed[a] - bed[b] || a - b);
        for (const cell of land) {
            const next = downstream[cell];
            if (next >= 0 && bed[next] > 0 && !contributingCells[next]) {
                throw new Error('Surface drainage crosses an unmeasured land cell.');
            }
            terminal[cell] = next < 0 || bed[next] <= 0 ? cell : terminal[next];
        }
        for (let index = land.length - 1; index >= 0; index -= 1) {
            const cell = land[index];
            const next = downstream[cell];
            if (next < 0 || bed[next] <= 0) continue;
            contributingCells[next] += contributingCells[cell];
            runoffPotential[next] += runoffPotential[cell];
        }

        const outlets = land.filter(cell => terminal[cell] === cell).map(cell => {
            const receivingCell = downstream[cell];
            const receiver = receivingCell < 0 ? 'local_depression' : receiverAt(receivingCell);
            return {
                catchmentId: `drainage_outlet_${cell}`,
                outletCellIndex: cell,
                receivingCellIndex: receivingCell,
                receiver,
                contributingCells: contributingCells[cell],
                ...(wetness && { runoffPotential: Number(runoffPotential[cell].toFixed(6)) })
            };
        });
        return {
            downstreamCellIndices: downstream,
            terminalLandCellIndices: terminal,
            contributingCells,
            ...(wetness && { runoffPotentialByCell: runoffPotential }),
            reachMinimumContributingCells: REACH_MIN_CELLS,
            outlets,
            summary: {
                landCellCount: land.length,
                reachCellCount: land.filter(cell => contributingCells[cell] >= REACH_MIN_CELLS).length,
                landCellsByReceiver: Object.fromEntries(['local_depression', 'inland_water', 'ocean'].map(receiver => [
                    receiver, outlets.filter(outlet => outlet.receiver === receiver)
                        .reduce((total, outlet) => total + outlet.contributingCells, 0)
                ]))
            }
        };
    }

    function buildFinalDrainage(surface, seafloor, wetness) {
        const { width, height, values: signed } = surface;
        return {
            modelId: 'finalTerrainDrainageV1',
            worldBounds: { width, height },
            sourceFieldIds: [surface.fieldId, seafloor.fieldId, ...(wetness ? ['wetnessField'] : [])],
            ...routeSurfaceDrainage({ signed, width, wetness, receiverAt: cell =>
                seafloor.valueEncoding[seafloor.values[cell]] === 'inland_water' ? 'inland_water' : 'ocean' })
        };
    }

    Object.assign(macro, { buildFinalDrainage, routeSurfaceDrainage });
})();
