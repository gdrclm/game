(() => {
    const houseLayout = window.Game.systems.houseLayout;
    const houseVisuals = window.Game.systems.houseVisuals;

    function buildBodyGeometry(footprint, footprintLayout, palette) {
        const geometryByCell = new Map();
        const body = {
            pointsForBounds: [],
            shadowPolygons: [],
            floorPolygons: [],
            floorDetails: [],
            wallPolygons: [],
            wallDetails: [],
            doorPolygon: null,
            doorStepPolygon: null,
            windowPolygons: []
        };

        footprint.cells
            .slice()
            .sort((first, second) => (first.x + first.y) - (second.x + second.y))
            .forEach((cell) => {
                const base = houseVisuals.getDiamondPoints(cell.x, cell.y, 0);
                const cap = houseVisuals.getDiamondPoints(cell.x, cell.y, 40);
                const floorInset = houseVisuals.insetDiamond(base, 0.92);
                const shadowDiamond = [base.top, base.right, base.bottom, base.left];

                geometryByCell.set(houseLayout.tileKey(cell.x, cell.y), { base, cap });
                body.shadowPolygons.push({ points: shadowDiamond, fill: palette.shadow });
                body.floorPolygons.push({
                    points: floorInset,
                    fill: palette.floor,
                    stroke: palette.floorStroke,
                    strokeWidth: 1.6
                });
                body.floorDetails.push({
                    from: houseVisuals.midpoint(floorInset[0], floorInset[3]),
                    to: houseVisuals.midpoint(floorInset[1], floorInset[2]),
                    stroke: palette.floorStroke,
                    strokeWidth: 0.8,
                    opacity: 0.35
                });
                body.pointsForBounds.push(...shadowDiamond, ...floorInset, cap.top, cap.right, cap.bottom, cap.left);
            });

        footprintLayout.wallRecords.forEach((wallRecord) => {
            const geometry = geometryByCell.get(houseLayout.tileKey(wallRecord.cell.x, wallRecord.cell.y));
            if (!geometry) {
                return;
            }

            wallRecord.quad = wallRecord.type === 'south'
                ? [geometry.cap.left, geometry.cap.bottom, geometry.base.bottom, geometry.base.left]
                : [geometry.cap.right, geometry.cap.bottom, geometry.base.bottom, geometry.base.right];

            const fill = wallRecord.type === 'south' ? palette.wallLeft : palette.wallRight;

            body.wallPolygons.push({
                points: wallRecord.quad,
                fill,
                stroke: palette.wallStroke,
                strokeWidth: 2
            });
            body.wallDetails.push({
                from: houseVisuals.midpoint(wallRecord.quad[0], wallRecord.quad[3]),
                to: houseVisuals.midpoint(wallRecord.quad[1], wallRecord.quad[2]),
                stroke: palette.wallStroke,
                strokeWidth: 1.1,
                opacity: 0.35
            });
            body.pointsForBounds.push(...wallRecord.quad);
        });

        if (footprintLayout.doorWall) {
            const outsideTile = footprintLayout.doorWall.type === 'south'
                ? houseVisuals.getDiamondPoints(footprintLayout.doorWall.cell.x, footprintLayout.doorWall.cell.y + 1, 0)
                : houseVisuals.getDiamondPoints(footprintLayout.doorWall.cell.x + 1, footprintLayout.doorWall.cell.y, 0);

            body.doorPolygon = {
                points: houseVisuals.insetWallQuad(footprintLayout.doorWall.quad, 0.22, 0.96, 0.26),
                fill: palette.door,
                stroke: palette.doorStroke,
                strokeWidth: 2
            };
            body.doorStepPolygon = {
                points: houseVisuals.insetDiamond(outsideTile, 0.45),
                fill: '#caa16a',
                stroke: '#8f6b40',
                strokeWidth: 1.3
            };
            body.pointsForBounds.push(...body.doorPolygon.points, ...body.doorStepPolygon.points);
        }

        body.windowPolygons = footprintLayout.windowWalls.map((wall) => ({
            points: houseVisuals.insetWallQuad(wall.quad, 0.18, 0.56, 0.26),
            fill: palette.window,
            stroke: palette.windowStroke,
            strokeWidth: 1.6
        }));

        body.windowPolygons.forEach((windowPolygon) => {
            body.pointsForBounds.push(...windowPolygon.points);
        });

        return body;
    }

    houseVisuals.buildBodyGeometry = buildBodyGeometry;
})();
