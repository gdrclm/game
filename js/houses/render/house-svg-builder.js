(() => {
    const houseLayout = window.Game.systems.houseLayout;
    const houseVisuals = window.Game.systems.houseVisuals;

    function getBounds(points) {
        return {
            minX: Math.min(...points.map((point) => point.x)),
            maxX: Math.max(...points.map((point) => point.x)),
            minY: Math.min(...points.map((point) => point.y)),
            maxY: Math.max(...points.map((point) => point.y))
        };
    }

    function getFootprintMinimums(footprint) {
        const points = footprint.cells.flatMap((cell) => {
            const diamond = houseVisuals.getDiamondPoints(cell.x, cell.y, 0);
            return [diamond.top, diamond.right, diamond.bottom, diamond.left];
        });

        return {
            minX: Math.min(...points.map((point) => point.x)),
            minY: Math.min(...points.map((point) => point.y))
        };
    }

    function getRoofSplitY(body) {
        if (body.wallPolygons.length === 0) {
            return 0;
        }

        return Math.max(...body.wallPolygons.flatMap((polygon) => [
            polygon.points[0].y,
            polygon.points[1].y
        ]));
    }

    function getPolygonCenterY(polygon) {
        return polygon.points.reduce((sum, point) => sum + point.y, 0) / polygon.points.length;
    }

    function getLineCenterY(line) {
        return (line.from.y + line.to.y) / 2;
    }

    function splitRoofGeometry(roof, roofSplitY) {
        return {
            south: {
                roofFringes: roof.roofFringes.filter((polygon) => getPolygonCenterY(polygon) >= roofSplitY),
                roofPlanes: roof.roofPlanes.filter((polygon) => getPolygonCenterY(polygon) >= roofSplitY),
                chimneyPolygons: roof.chimneyPolygons.filter((polygon) => getPolygonCenterY(polygon) >= roofSplitY),
                roofDetails: roof.roofDetails.filter((line) => getLineCenterY(line) >= roofSplitY)
            },
            north: {
                roofFringes: roof.roofFringes.filter((polygon) => getPolygonCenterY(polygon) < roofSplitY),
                roofPlanes: roof.roofPlanes.filter((polygon) => getPolygonCenterY(polygon) < roofSplitY),
                chimneyPolygons: roof.chimneyPolygons.filter((polygon) => getPolygonCenterY(polygon) < roofSplitY),
                roofDetails: roof.roofDetails.filter((line) => getLineCenterY(line) < roofSplitY)
            }
        };
    }

    function renderPolygons(polygons, translateX, translateY) {
        return polygons.map((polygon) => {
            const translated = houseVisuals.translatePoints(polygon.points, translateX, translateY);
            const attributes = [
                `points="${houseVisuals.pointsToSvg(translated)}"`,
                `fill="${polygon.fill}"`
            ];

            if (polygon.stroke) {
                attributes.push(`stroke="${polygon.stroke}"`, `stroke-width="${polygon.strokeWidth || 1}"`, 'stroke-linejoin="round"');
            }

            return `<polygon ${attributes.join(' ')} />`;
        }).join('');
    }

    function renderLines(lines, translateX, translateY) {
        return lines.map((line) => {
            const [from, to] = houseVisuals.translatePoints([line.from, line.to], translateX, translateY);
            return `<line x1="${from.x.toFixed(1)}" y1="${from.y.toFixed(1)}" x2="${to.x.toFixed(1)}" y2="${to.y.toFixed(1)}" stroke="${line.stroke}" stroke-width="${line.strokeWidth || 1}" opacity="${line.opacity || 1}" stroke-linecap="round" />`;
        }).join('');
    }

    function renderWindows(windowPolygons, translateX, translateY) {
        return windowPolygons.map((windowPolygon) => {
            const translated = houseVisuals.translatePoints(windowPolygon.points, translateX, translateY);
            const verticalA = houseVisuals.midpoint(translated[0], translated[3]);
            const verticalB = houseVisuals.midpoint(translated[1], translated[2]);
            const horizontalA = houseVisuals.midpoint(translated[0], translated[1]);
            const horizontalB = houseVisuals.midpoint(translated[3], translated[2]);

            return `
                <polygon points="${houseVisuals.pointsToSvg(translated)}" fill="${windowPolygon.fill}" stroke="${windowPolygon.stroke}" stroke-width="${windowPolygon.strokeWidth}" stroke-linejoin="round" />
                <line x1="${verticalA.x.toFixed(1)}" y1="${verticalA.y.toFixed(1)}" x2="${verticalB.x.toFixed(1)}" y2="${verticalB.y.toFixed(1)}" stroke="${windowPolygon.stroke}" stroke-width="1.1" />
                <line x1="${horizontalA.x.toFixed(1)}" y1="${horizontalA.y.toFixed(1)}" x2="${horizontalB.x.toFixed(1)}" y2="${horizontalB.y.toFixed(1)}" stroke="${windowPolygon.stroke}" stroke-width="1.1" />
            `;
        }).join('');
    }

    function createHouseSvgVariant(footprint, paletteIndex) {
        const palette = houseVisuals.getPalette(paletteIndex);
        const footprintLayout = houseLayout.getFootprintLayout(footprint);
        const body = houseVisuals.buildBodyGeometry(footprint, footprintLayout, palette);
        const interior = houseVisuals.buildInteriorGeometry(footprint, footprintLayout, palette);
        const roof = houseVisuals.buildRoofGeometry(footprint, footprintLayout, palette);
        const bounds = getBounds(body.pointsForBounds.concat(interior.pointsForBounds, roof.pointsForBounds));
        const footprintMinimums = getFootprintMinimums(footprint);
        const padding = 12;
        const translateX = -bounds.minX + padding;
        const translateY = -bounds.minY + padding;
        const svgWidth = Math.ceil(bounds.maxX - bounds.minX + padding * 2);
        const svgHeight = Math.ceil(bounds.maxY - bounds.minY + padding * 2);
        const splitRoof = splitRoofGeometry(roof, getRoofSplitY(body));

        const bodySvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
    ${renderPolygons(body.shadowPolygons, translateX, translateY)}
    ${renderPolygons(body.floorPolygons, translateX, translateY)}
    ${renderLines(body.floorDetails, translateX, translateY)}
    ${renderPolygons(body.wallPolygons, translateX, translateY)}
    ${renderLines(body.wallDetails, translateX, translateY)}
    ${body.doorStepPolygon ? renderPolygons([body.doorStepPolygon], translateX, translateY) : ''}
    ${body.doorPolygon ? renderPolygons([body.doorPolygon], translateX, translateY) : ''}
    ${renderWindows(body.windowPolygons, translateX, translateY)}
</svg>`.trim();

        const interiorSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
    ${renderPolygons(interior.floorBasePolygons, translateX, translateY)}
    ${renderPolygons(interior.floorPolygons, translateX, translateY)}
    ${renderPolygons(interior.borderPolygons, translateX, translateY)}
    ${renderPolygons(interior.backWallPolygons, translateX, translateY)}
    ${renderLines(interior.trimLines, translateX, translateY)}
    ${body.doorStepPolygon ? renderPolygons([body.doorStepPolygon], translateX, translateY) : ''}
    ${body.doorPolygon ? renderPolygons([body.doorPolygon], translateX, translateY) : ''}
</svg>`.trim();

        const southRoofSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
    ${renderPolygons(splitRoof.south.roofFringes, translateX, translateY)}
    ${renderPolygons(splitRoof.south.roofPlanes, translateX, translateY)}
    ${renderPolygons(splitRoof.south.chimneyPolygons, translateX, translateY)}
    ${renderLines(splitRoof.south.roofDetails, translateX, translateY)}
</svg>`.trim();

        const northRoofSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
    ${renderPolygons(splitRoof.north.roofFringes, translateX, translateY)}
    ${renderPolygons(splitRoof.north.roofPlanes, translateX, translateY)}
    ${renderPolygons(splitRoof.north.chimneyPolygons, translateX, translateY)}
    ${renderLines(splitRoof.north.roofDetails, translateX, translateY)}
</svg>`.trim();

        return {
            bodySvg,
            interiorSvg,
            southRoofSvg,
            northRoofSvg,
            drawWidth: svgWidth,
            drawHeight: svgHeight,
            drawOffsetX: footprintMinimums.minX - bounds.minX + padding,
            drawOffsetY: footprintMinimums.minY - bounds.minY + padding,
            localFootprintMinX: footprintMinimums.minX,
            localFootprintMinY: footprintMinimums.minY
        };
    }

    houseVisuals.createHouseSvgVariant = createHouseSvgVariant;
})();
