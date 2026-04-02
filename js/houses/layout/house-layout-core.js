(() => {
    const houseLayout = window.Game.systems.houseLayout = window.Game.systems.houseLayout || {};
    const houseLayoutInternals = window.Game.systems.houseLayoutInternals = window.Game.systems.houseLayoutInternals || {};

    function tileKey(x, y) {
        return `${x},${y}`;
    }

    function createUniqueCells(cells) {
        const unique = new Map();

        cells.forEach((cell) => {
            unique.set(tileKey(cell.x, cell.y), { x: cell.x, y: cell.y });
        });

        return Array.from(unique.values());
    }

    function createRectangleCells(originX, originY, widthTiles, depthTiles) {
        const cells = [];

        for (let y = 0; y < depthTiles; y++) {
            for (let x = 0; x < widthTiles; x++) {
                cells.push({ x: originX + x, y: originY + y });
            }
        }

        return cells;
    }

    function normalizeCells(cells) {
        const minX = Math.min(...cells.map((cell) => cell.x));
        const minY = Math.min(...cells.map((cell) => cell.y));

        return cells.map((cell) => ({
            x: cell.x - minX,
            y: cell.y - minY
        }));
    }

    function getCellBounds(cells) {
        const minX = Math.min(...cells.map((cell) => cell.x));
        const maxX = Math.max(...cells.map((cell) => cell.x));
        const minY = Math.min(...cells.map((cell) => cell.y));
        const maxY = Math.max(...cells.map((cell) => cell.y));

        return {
            minX,
            minY,
            width: maxX - minX + 1,
            depth: maxY - minY + 1
        };
    }

    function randomInt(random, min, max) {
        return min + Math.floor(random() * (max - min + 1));
    }

    function expandCells(cells, padding) {
        const expanded = new Map();

        cells.forEach((cell) => {
            for (let dy = -padding; dy <= padding; dy++) {
                for (let dx = -padding; dx <= padding; dx++) {
                    expanded.set(tileKey(cell.x + dx, cell.y + dy), {
                        x: cell.x + dx,
                        y: cell.y + dy
                    });
                }
            }
        });

        return Array.from(expanded.values());
    }

    function projectIsoLocal(x, y, lift = 0) {
        const { tileWidth, tileHeight } = window.Game.config;

        return {
            x: (x - y) * tileWidth / 2,
            y: (x + y) * tileHeight / 2 - lift
        };
    }

    Object.assign(houseLayout, {
        tileKey,
        randomInt,
        expandCells,
        projectIsoLocal
    });

    Object.assign(houseLayoutInternals, {
        createUniqueCells,
        createRectangleCells,
        normalizeCells,
        getCellBounds
    });
})();
