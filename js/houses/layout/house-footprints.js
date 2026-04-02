(() => {
    const houseLayout = window.Game.systems.houseLayout;
    const houseLayoutInternals = window.Game.systems.houseLayoutInternals;
    const {
        createUniqueCells,
        createRectangleCells,
        normalizeCells,
        getCellBounds
    } = houseLayoutInternals;

    function createSignature(cells) {
        return cells
            .slice()
            .sort((first, second) => (first.y - second.y) || (first.x - second.x))
            .map((cell) => houseLayout.tileKey(cell.x, cell.y))
            .join('|');
    }

    function createTShapeCells(random) {
        const stemWidth = houseLayout.randomInt(random, 2, 3);
        const stemDepth = houseLayout.randomInt(random, 4, 6);
        const capWidth = Math.max(stemWidth + 2, houseLayout.randomInt(random, 4, 6));
        const capDepth = houseLayout.randomInt(random, 2, 3);
        const stemOffset = Math.floor((capWidth - stemWidth) / 2);

        return createUniqueCells(
            createRectangleCells(0, 0, capWidth, capDepth).concat(
                createRectangleCells(stemOffset, capDepth, stemWidth, stemDepth)
            )
        );
    }

    function createLShapeCells(random) {
        const mainWidth = houseLayout.randomInt(random, 4, 6);
        const mainDepth = houseLayout.randomInt(random, 4, 6);
        const wingWidth = houseLayout.randomInt(random, 2, 3);
        const wingDepth = houseLayout.randomInt(random, 2, 3);
        const orientation = houseLayout.randomInt(random, 0, 3);
        const mainBody = createRectangleCells(0, 0, mainWidth, mainDepth);

        if (orientation === 0) {
            return mainBody.concat(createRectangleCells(mainWidth, mainDepth - wingDepth, wingWidth, wingDepth));
        }

        if (orientation === 1) {
            return mainBody.concat(createRectangleCells(-wingWidth, mainDepth - wingDepth, wingWidth, wingDepth));
        }

        if (orientation === 2) {
            return mainBody.concat(createRectangleCells(mainWidth, 0, wingWidth, wingDepth));
        }

        return mainBody.concat(createRectangleCells(-wingWidth, 0, wingWidth, wingDepth));
    }

    function createHouseFootprint(random) {
        const typeRoll = random();
        let type = 'square';
        let cells = createRectangleCells(0, 0, 4, 4);

        if (typeRoll < 0.18) {
            cells = createRectangleCells(0, 0, houseLayout.randomInt(random, 3, 5), houseLayout.randomInt(random, 3, 5));
        } else if (typeRoll < 0.36) {
            type = 'wide';
            cells = createRectangleCells(0, 0, houseLayout.randomInt(random, 5, 7), houseLayout.randomInt(random, 3, 4));
        } else if (typeRoll < 0.54) {
            type = 'deep';
            cells = createRectangleCells(0, 0, houseLayout.randomInt(random, 3, 4), houseLayout.randomInt(random, 5, 7));
        } else if (typeRoll < 0.72) {
            type = random() < 0.5 ? 'narrow-wide' : 'narrow-deep';
            cells = type === 'narrow-wide'
                ? createRectangleCells(0, 0, houseLayout.randomInt(random, 6, 8), houseLayout.randomInt(random, 2, 3))
                : createRectangleCells(0, 0, houseLayout.randomInt(random, 2, 3), houseLayout.randomInt(random, 6, 8));
        } else if (typeRoll < 0.9) {
            type = 'l-shape';
            cells = createLShapeCells(random);
        } else {
            type = 't-shape';
            cells = createTShapeCells(random);
        }

        const normalizedCells = createUniqueCells(normalizeCells(cells));
        const bounds = getCellBounds(normalizedCells);

        return {
            type,
            cells: normalizedCells,
            widthTiles: bounds.width,
            depthTiles: bounds.depth,
            signature: createSignature(normalizedCells)
        };
    }

    houseLayout.createHouseFootprint = createHouseFootprint;
})();
