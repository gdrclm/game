(() => {
    const houseLayout = window.Game.systems.houseLayout;
    const houseVisuals = window.Game.systems.houseVisuals;

    function createEdgeStrip(points, edgeStart, edgeEnd, factor, fill, stroke, strokeWidth) {
        const center = {
            x: (points.top.x + points.right.x + points.bottom.x + points.left.x) / 4,
            y: (points.top.y + points.right.y + points.bottom.y + points.left.y) / 4
        };

        return {
            points: [
                edgeStart,
                edgeEnd,
                houseVisuals.lerpPoint(edgeEnd, center, factor),
                houseVisuals.lerpPoint(edgeStart, center, factor)
            ],
            fill,
            stroke,
            strokeWidth
        };
    }

    function createWallQuad(basePoints, capPoints, type, fill, stroke) {
        const points = type === 'north'
            ? [capPoints.top, capPoints.right, basePoints.right, basePoints.top]
            : [capPoints.left, capPoints.top, basePoints.top, basePoints.left];

        return {
            points,
            fill,
            stroke,
            strokeWidth: 1.6
        };
    }

    function buildInteriorGeometry(footprint, footprintLayout, palette) {
        const interior = {
            floorBasePolygons: [],
            floorPolygons: [],
            borderPolygons: [],
            backWallPolygons: [],
            trimLines: [],
            pointsForBounds: []
        };
        const cellSet = footprintLayout.cellSet;

        footprint.cells.forEach((cell, index) => {
            const keyNorth = houseLayout.tileKey(cell.x, cell.y - 1);
            const keySouth = houseLayout.tileKey(cell.x, cell.y + 1);
            const keyEast = houseLayout.tileKey(cell.x + 1, cell.y);
            const keyWest = houseLayout.tileKey(cell.x - 1, cell.y);
            const basePoints = houseVisuals.getDiamondPoints(cell.x, cell.y, 0);
            const capPoints = houseVisuals.getDiamondPoints(cell.x, cell.y, 26);
            const fullFloor = [basePoints.top, basePoints.right, basePoints.bottom, basePoints.left];
            const insetFloor = houseVisuals.insetDiamond(basePoints, 0.8);
            const floorPolygon = {
                points: insetFloor,
                fill: index % 2 === 0 ? palette.interiorFloor : palette.interiorFloorAlt,
                stroke: 'rgba(255,255,255,0.25)',
                strokeWidth: 0.9
            };

            interior.floorBasePolygons.push({
                points: fullFloor,
                fill: palette.interiorFloor,
                stroke: palette.interiorFloor,
                strokeWidth: 1.4
            });
            interior.floorPolygons.push(floorPolygon);
            interior.pointsForBounds.push(...fullFloor, ...floorPolygon.points);

            if (!cellSet.has(keyNorth)) {
                const northStrip = createEdgeStrip(
                    basePoints,
                    basePoints.top,
                    basePoints.right,
                    0.16,
                    palette.interiorBorder,
                    palette.interiorWallStroke,
                    1.1
                );
                const northWall = createWallQuad(
                    basePoints,
                    capPoints,
                    'north',
                    palette.interiorWallNorth,
                    palette.interiorWallStroke
                );

                interior.borderPolygons.push(northStrip);
                interior.backWallPolygons.push(northWall);
                interior.trimLines.push({
                    from: northWall.points[0],
                    to: northWall.points[1],
                    stroke: palette.interiorWallStroke,
                    strokeWidth: 1.1,
                    opacity: 0.6
                });
                interior.pointsForBounds.push(...northStrip.points, ...northWall.points);
            }

            if (!cellSet.has(keyWest)) {
                const westStrip = createEdgeStrip(
                    basePoints,
                    basePoints.left,
                    basePoints.top,
                    0.16,
                    palette.interiorBorder,
                    palette.interiorWallStroke,
                    1.1
                );
                const westWall = createWallQuad(
                    basePoints,
                    capPoints,
                    'west',
                    palette.interiorWallWest,
                    palette.interiorWallStroke
                );

                interior.borderPolygons.push(westStrip);
                interior.backWallPolygons.push(westWall);
                interior.trimLines.push({
                    from: westWall.points[0],
                    to: westWall.points[1],
                    stroke: palette.interiorWallStroke,
                    strokeWidth: 1.1,
                    opacity: 0.6
                });
                interior.pointsForBounds.push(...westStrip.points, ...westWall.points);
            }

            if (!cellSet.has(keySouth)) {
                const southStrip = createEdgeStrip(
                    basePoints,
                    basePoints.bottom,
                    basePoints.left,
                    0.12,
                    palette.interiorBorder,
                    palette.interiorWallStroke,
                    1
                );
                interior.borderPolygons.push(southStrip);
                interior.pointsForBounds.push(...southStrip.points);
            }

            if (!cellSet.has(keyEast)) {
                const eastStrip = createEdgeStrip(
                    basePoints,
                    basePoints.right,
                    basePoints.bottom,
                    0.12,
                    palette.interiorBorder,
                    palette.interiorWallStroke,
                    1
                );
                interior.borderPolygons.push(eastStrip);
                interior.pointsForBounds.push(...eastStrip.points);
            }
        });

        return interior;
    }

    houseVisuals.buildInteriorGeometry = buildInteriorGeometry;
})();
