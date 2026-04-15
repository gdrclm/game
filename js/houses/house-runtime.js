function getHouseAtChunkTile(chunk, localX, localY) {
    if (!chunk) {
        return null;
    }

    if (chunk.houseTileMap instanceof Map) {
        return chunk.houseTileMap.get(window.Game.systems.houseLayout.tileKey(localX, localY)) || null;
    }

    if (!chunk.houses) {
        return null;
    }

    return chunk.houses.find((house) => house.localCellSet.has(
        window.Game.systems.houseLayout.tileKey(localX, localY)
    )) || null;
}

function getHouseAtWorld(x, y, generateMissingChunk = true) {
    if (window.Game.systems.world) {
        return window.Game.systems.world.getTileInfo(x, y, { generateIfMissing: generateMissingChunk }).house;
    }

    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    const chunkSize = window.Game.config.chunkSize;
    const chunkX = Math.floor(roundedX / chunkSize);
    const chunkY = Math.floor(roundedY / chunkSize);
    const chunk = window.Game.state.loadedChunks[`${chunkX},${chunkY}`]
        || (generateMissingChunk ? window.Game.systems.generateChunk(chunkX, chunkY) : null);

    if (!chunk) {
        return null;
    }

    const localX = window.Game.systems.utils.normalizeModulo(roundedX, chunkSize);
    const localY = window.Game.systems.utils.normalizeModulo(roundedY, chunkSize);

    return getHouseAtChunkTile(chunk, localX, localY);
}

function isTileBlockedByHouse(chunk, localX, localY) {
    return Boolean(getHouseAtChunkTile(chunk, localX, localY));
}

function canTraverseBetweenTiles(fromInfo, toInfo) {
    const fromHouse = fromInfo.house;
    const toHouse = toInfo.house;

    if (fromHouse && toHouse) {
        return fromHouse.id === toHouse.id;
    }

    const transitionHouse = fromHouse || toHouse;

    if (!transitionHouse || !transitionHouse.door) {
        return false;
    }

    const { worldInside, worldOutside } = transitionHouse.door;
    const forward = (
        fromInfo.x === worldOutside.x &&
        fromInfo.y === worldOutside.y &&
        toInfo.x === worldInside.x &&
        toInfo.y === worldInside.y
    );
    const backward = (
        fromInfo.x === worldInside.x &&
        fromInfo.y === worldInside.y &&
        toInfo.x === worldOutside.x &&
        toInfo.y === worldOutside.y
    );

    return forward || backward;
}

window.Game.systems.houses = {
    createChunkHouses: window.Game.systems.houseLayout.createChunkHouses,
    doesShapeTouchHouse: window.Game.systems.houseLayout.doesShapeTouchHouse,
    isTileBlockedByHouse,
    getHouseAtChunkTile,
    getHouseAtWorld,
    canTraverseBetweenTiles,
    collectVisibleInteriorHouses: window.Game.systems.houseRenderer.collectVisibleInteriorHouses,
    collectVisibleExteriorHouses: window.Game.systems.houseRenderer.collectVisibleExteriorHouses,
    drawInteriorHouseList: window.Game.systems.houseRenderer.drawInteriorHouseList,
    drawExteriorHouseSouthList: window.Game.systems.houseRenderer.drawExteriorHouseSouthList,
    drawExteriorHouseNorthList: window.Game.systems.houseRenderer.drawExteriorHouseNorthList,
    drawInteriorHouses: window.Game.systems.houseRenderer.drawInteriorHouses,
    drawExteriorHouseSouthParts: window.Game.systems.houseRenderer.drawExteriorHouseSouthParts,
    drawExteriorHouseNorthParts: window.Game.systems.houseRenderer.drawExteriorHouseNorthParts
};
