(() => {
    const houseLayout = window.Game.systems.houseLayout;
    const houseVisuals = window.Game.systems.houseVisuals;

    function getRoofPitchFactor(footprint, roofRunsAlongX, coordinate) {
        const axisSize = roofRunsAlongX ? footprint.depthTiles : footprint.widthTiles;

        if (axisSize <= 1) {
            return 1;
        }

        const normalized = coordinate / axisSize;
        const distanceFromCenter = Math.abs(normalized - 0.5) * 2;
        return Math.max(0.18, 1 - Math.min(distanceFromCenter, 1));
    }

    function getRoofHeightAt(footprint, roofRunsAlongX, x, y) {
        const pitchFactor = getRoofPitchFactor(footprint, roofRunsAlongX, roofRunsAlongX ? y : x);
        const sizeBoost = Math.min(12, (footprint.widthTiles + footprint.depthTiles) * 1.15);
        return 34 + pitchFactor * (20 + sizeBoost);
    }

    function getRoofNoise(seed) {
        const hashed = Math.sin(seed * 12.9898) * 43758.5453;
        return (hashed - Math.floor(hashed)) * 2 - 1;
    }

    function buildChimneyGeometry(footprint, roofRunsAlongX, roofSpans) {
        if (roofSpans.length === 0) {
            return { chimneyPolygons: [], pointsForBounds: [] };
        }

        const centralSpan = roofSpans[Math.floor(roofSpans.length / 2)];
        const chimneyX = roofRunsAlongX ? (centralSpan.start + centralSpan.end + 1) / 2 - 0.12 : centralSpan.index + 0.18;
        const chimneyY = roofRunsAlongX ? centralSpan.index + 0.16 : (centralSpan.start + centralSpan.end + 1) / 2 - 0.12;
        const chimneyBaseLift = getRoofHeightAt(footprint, roofRunsAlongX, chimneyX, chimneyY) + 2;
        const chimneyBase = houseVisuals.getDiamondPoints(chimneyX, chimneyY, chimneyBaseLift);
        const chimneyTop = houseVisuals.getDiamondPoints(chimneyX, chimneyY, chimneyBaseLift + 22);

        return {
            chimneyPolygons: [
                { points: [chimneyTop.left, chimneyTop.bottom, chimneyBase.bottom, chimneyBase.left], fill: '#d7ccb7', stroke: '#73624b', strokeWidth: 1.8 },
                { points: [chimneyTop.right, chimneyTop.bottom, chimneyBase.bottom, chimneyBase.right], fill: '#b5a58b', stroke: '#73624b', strokeWidth: 1.8 },
                { points: [chimneyTop.top, chimneyTop.right, chimneyTop.bottom, chimneyTop.left], fill: '#ede1cd', stroke: '#73624b', strokeWidth: 1.8 }
            ],
            pointsForBounds: [
                chimneyTop.top,
                chimneyTop.right,
                chimneyTop.bottom,
                chimneyTop.left,
                chimneyBase.bottom
            ]
        };
    }

    function buildRoofGeometry(footprint, footprintLayout, palette) {
        const roofRunsAlongX = footprint.widthTiles >= footprint.depthTiles;
        const roofSpans = roofRunsAlongX ? footprintLayout.roofSpans.alongX : footprintLayout.roofSpans.alongY;
        const roof = {
            pointsForBounds: [],
            roofPlanes: [],
            roofFringes: [],
            roofDetails: [],
            chimneyPolygons: []
        };

        roofSpans.forEach((span, index) => {
            const bandStart = span.index - 0.24;
            const bandEnd = span.index + 1.24;
            const bandCenter = (span.start + span.end + 1) / 2;
            const darkerNoise = getRoofNoise(span.index + span.start * 3.1) * 1.3;
            const lighterNoise = getRoofNoise(span.index + span.end * 5.7) * 1.3;
            const darkFill = index % 2 === 0 ? palette.roofAlt : palette.roofFringe;
            const lightFill = index % 2 === 0 ? palette.roofMain : palette.roofHighlight;

            const ridgeA = roofRunsAlongX
                ? houseLayout.projectIsoLocal(bandCenter, bandStart, getRoofHeightAt(footprint, true, bandCenter, bandStart))
                : houseLayout.projectIsoLocal(bandStart, bandCenter, getRoofHeightAt(footprint, false, bandStart, bandCenter));
            const ridgeB = roofRunsAlongX
                ? houseLayout.projectIsoLocal(bandCenter, bandEnd, getRoofHeightAt(footprint, true, bandCenter, bandEnd))
                : houseLayout.projectIsoLocal(bandEnd, bandCenter, getRoofHeightAt(footprint, false, bandEnd, bandCenter));
            const darkEaveA = roofRunsAlongX
                ? houseLayout.projectIsoLocal(span.start - 0.38, bandStart + 0.02, 50 + darkerNoise)
                : houseLayout.projectIsoLocal(bandStart + 0.02, span.start - 0.38, 50 + darkerNoise);
            const darkEaveB = roofRunsAlongX
                ? houseLayout.projectIsoLocal(span.start - 0.38, bandEnd - 0.02, 50 + darkerNoise)
                : houseLayout.projectIsoLocal(bandEnd - 0.02, span.start - 0.38, 50 + darkerNoise);
            const lightEaveA = roofRunsAlongX
                ? houseLayout.projectIsoLocal(span.end + 1.38, bandStart + 0.02, 50 + lighterNoise)
                : houseLayout.projectIsoLocal(bandStart + 0.02, span.end + 1.38, 50 + lighterNoise);
            const lightEaveB = roofRunsAlongX
                ? houseLayout.projectIsoLocal(span.end + 1.38, bandEnd - 0.02, 50 + lighterNoise)
                : houseLayout.projectIsoLocal(bandEnd - 0.02, span.end + 1.38, 50 + lighterNoise);

            roof.roofPlanes.push(
                { points: [ridgeA, ridgeB, darkEaveB, darkEaveA], fill: darkFill, stroke: palette.roofStroke, strokeWidth: 2.2 },
                { points: [ridgeA, ridgeB, lightEaveB, lightEaveA], fill: lightFill, stroke: palette.roofStroke, strokeWidth: 2.2 }
            );
            roof.roofFringes.push(
                { points: [darkEaveA, darkEaveB, { x: darkEaveB.x, y: darkEaveB.y + 11 }, { x: darkEaveA.x, y: darkEaveA.y + 9 }], fill: palette.roofFringe, stroke: palette.roofStroke, strokeWidth: 1.4 },
                { points: [lightEaveA, lightEaveB, { x: lightEaveB.x, y: lightEaveB.y + 9 }, { x: lightEaveA.x, y: lightEaveA.y + 11 }], fill: palette.roofFringe, stroke: palette.roofStroke, strokeWidth: 1.4 }
            );
            roof.roofDetails.push(
                { from: ridgeA, to: ridgeB, stroke: palette.roofStroke, strokeWidth: 1.1, opacity: 0.45 },
                { from: houseVisuals.lerpPoint(ridgeA, darkEaveA, 0.42), to: houseVisuals.lerpPoint(ridgeB, darkEaveB, 0.42), stroke: palette.roofStroke, strokeWidth: 1.1, opacity: 0.45 },
                { from: houseVisuals.lerpPoint(ridgeA, lightEaveA, 0.42), to: houseVisuals.lerpPoint(ridgeB, lightEaveB, 0.42), stroke: palette.roofStroke, strokeWidth: 1.1, opacity: 0.45 }
            );
            roof.pointsForBounds.push(
                ridgeA,
                ridgeB,
                darkEaveA,
                darkEaveB,
                lightEaveA,
                lightEaveB
            );
        });

        const chimney = buildChimneyGeometry(footprint, roofRunsAlongX, roofSpans);
        roof.chimneyPolygons = chimney.chimneyPolygons;
        roof.pointsForBounds.push(...chimney.pointsForBounds);
        return roof;
    }

    houseVisuals.buildRoofGeometry = buildRoofGeometry;
})();
