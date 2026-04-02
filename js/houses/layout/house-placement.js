(() => {
    const houseLayout = window.Game.systems.houseLayout;

    function doesFootprintIntersectHouses(houses, cellsToCheck) {
        const checkKeys = new Set(cellsToCheck.map((cell) => houseLayout.tileKey(cell.x, cell.y)));

        return houses.some((house) => house.localCells.some((cell) => checkKeys.has(houseLayout.tileKey(cell.x, cell.y))));
    }

    function isFootprintClear(chunkData, houses, footprint, startX, startY, padding = 1) {
        const chunkSize = window.Game.config.chunkSize;
        const placedCells = footprint.cells.map((cell) => ({ x: startX + cell.x, y: startY + cell.y }));
        const marginCells = houseLayout.expandCells(placedCells, padding);

        for (const cell of marginCells) {
            if (cell.x < 0 || cell.x >= chunkSize || cell.y < 0 || cell.y >= chunkSize) {
                return false;
            }

            if (chunkData[cell.y][cell.x] !== 'grass') {
                return false;
            }
        }

        return !doesFootprintIntersectHouses(houses, marginCells);
    }

    function buildDoorMetadata(chunkX, chunkY, localOriginX, localOriginY, doorWall) {
        if (!doorWall) {
            return null;
        }

        const chunkSize = window.Game.config.chunkSize;
        const insideLocalX = localOriginX + doorWall.cell.x;
        const insideLocalY = localOriginY + doorWall.cell.y;
        const outsideLocalX = doorWall.type === 'east' ? insideLocalX + 1 : insideLocalX;
        const outsideLocalY = doorWall.type === 'south' ? insideLocalY + 1 : insideLocalY;
        const chunkWorldX = chunkX * chunkSize;
        const chunkWorldY = chunkY * chunkSize;

        return {
            type: doorWall.type,
            worldInside: { x: chunkWorldX + insideLocalX, y: chunkWorldY + insideLocalY },
            worldOutside: { x: chunkWorldX + outsideLocalX, y: chunkWorldY + outsideLocalY },
            localInside: { x: insideLocalX, y: insideLocalY },
            localOutside: { x: outsideLocalX, y: outsideLocalY }
        };
    }

    function createPlacedHouse(chunkX, chunkY, footprint, localOriginX, localOriginY, paletteIndex) {
        const chunkSize = window.Game.config.chunkSize;
        const footprintLayout = houseLayout.getFootprintLayout(footprint);
        const worldOriginX = chunkX * chunkSize + localOriginX;
        const worldOriginY = chunkY * chunkSize + localOriginY;
        const localCells = footprint.cells.map((cell) => ({ x: localOriginX + cell.x, y: localOriginY + cell.y }));
        const worldCells = localCells.map((cell) => ({ x: chunkX * chunkSize + cell.x, y: chunkY * chunkSize + cell.y }));

        return {
            id: `${chunkX},${chunkY}:${localOriginX},${localOriginY}:${footprint.signature}`,
            footprint,
            paletteIndex,
            localOriginX,
            localOriginY,
            worldOriginX,
            worldOriginY,
            projectedOrigin: houseLayout.projectIsoLocal(worldOriginX, worldOriginY, 0),
            renderDepth: worldOriginX + worldOriginY + footprint.widthTiles + footprint.depthTiles,
            localCells,
            worldCells,
            localCellSet: new Set(localCells.map((cell) => houseLayout.tileKey(cell.x, cell.y))),
            worldCellSet: new Set(worldCells.map((cell) => houseLayout.tileKey(cell.x, cell.y))),
            door: buildDoorMetadata(chunkX, chunkY, localOriginX, localOriginY, footprintLayout.doorWall)
        };
    }

    function createChunkHouses(chunkX, chunkY, chunkData, random, progression = null, chunkRecord = null) {
        const houses = [];
        const hasExactQuota = chunkRecord && Number.isInteger(chunkRecord.houseQuota);

        if (chunkX === 0 && chunkY === 0) {
            return houses;
        }

        if (!hasExactQuota && progression && progression.islandIndex <= 2 && random() < 0.7) {
            return houses;
        }

        const footprintAttempts = progression ? 10 + Math.floor(progression.islandIndex / 2) : 8;
        const placementAttempts = progression ? 30 + progression.islandIndex * 2 : 30;
        let minHouseCount = progression ? progression.housesPerChunkMin : 1;
        let maxHouseCount = progression ? progression.housesPerChunkMax : 1;

        if (hasExactQuota) {
            minHouseCount = Math.max(0, chunkRecord.houseQuota);
            maxHouseCount = minHouseCount;
        } else if (chunkRecord) {
            if (chunkRecord.tags.has('entry') && progression && progression.islandIndex <= 3) {
                minHouseCount = 0;
                maxHouseCount = Math.max(0, maxHouseCount - 1);
            }

            if (chunkRecord.tags.has('remote') || chunkRecord.tags.has('tip')) {
                minHouseCount += 1;
                maxHouseCount += 2;
            }

            if (chunkRecord.tags.has('junction')) {
                maxHouseCount += 1;
            }

            if (chunkRecord.tags.has('vault')) {
                minHouseCount += 1;
                maxHouseCount += 2;
            }
        }

        minHouseCount = Math.max(0, minHouseCount);
        maxHouseCount = Math.max(minHouseCount, Math.min(4, maxHouseCount));
        const targetHouseCount = minHouseCount + Math.floor(random() * Math.max(1, maxHouseCount - minHouseCount + 1));
        const totalFootprintAttempts = hasExactQuota
            ? Math.max(footprintAttempts, targetHouseCount * 16)
            : footprintAttempts;
        const totalPlacementAttempts = hasExactQuota
            ? Math.max(placementAttempts, 120)
            : placementAttempts;
        let failedFootprintsInRow = 0;

        for (let footprintAttempt = 0; footprintAttempt < totalFootprintAttempts && houses.length < targetHouseCount; footprintAttempt++) {
            const footprint = houseLayout.createHouseFootprint(random);
            const paletteIndex = houseLayout.randomInt(random, 0, 2);
            let placedCurrentHouse = false;

            for (let placementAttempt = 0; placementAttempt < totalPlacementAttempts; placementAttempt++) {
                const maxOriginX = window.Game.config.chunkSize - footprint.widthTiles - 1;
                const maxOriginY = window.Game.config.chunkSize - footprint.depthTiles - 1;

                if (maxOriginX < 1 || maxOriginY < 1) {
                    break;
                }

                const localOriginX = houseLayout.randomInt(random, 1, maxOriginX);
                const localOriginY = houseLayout.randomInt(random, 1, maxOriginY);

                if (isFootprintClear(chunkData, houses, footprint, localOriginX, localOriginY, 1)) {
                    houses.push(createPlacedHouse(chunkX, chunkY, footprint, localOriginX, localOriginY, paletteIndex));
                    placedCurrentHouse = true;
                    failedFootprintsInRow = 0;
                    break;
                }
            }

            if (!placedCurrentHouse) {
                failedFootprintsInRow++;
                if (failedFootprintsInRow >= 3 && houses.length >= minHouseCount) {
                    break;
                }
            }
        }

        return houses;
    }

    function doesShapeTouchHouse(houses, shapeCells, startX, startY, padding = 1) {
        const absoluteShapeCells = shapeCells.map((cell) => ({
            x: startX + cell.x,
            y: startY + cell.y
        }));

        return doesFootprintIntersectHouses(houses, houseLayout.expandCells(absoluteShapeCells, padding));
    }

    Object.assign(houseLayout, {
        createChunkHouses,
        doesShapeTouchHouse
    });
})();
