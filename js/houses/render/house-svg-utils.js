(() => {
    const houseLayout = window.Game.systems.houseLayout;
    const houseVisuals = window.Game.systems.houseVisuals = window.Game.systems.houseVisuals || {};

    function getDiamondPoints(x, y, lift = 0) {
        return {
            top: houseLayout.projectIsoLocal(x, y, lift),
            right: houseLayout.projectIsoLocal(x + 1, y, lift),
            bottom: houseLayout.projectIsoLocal(x + 1, y + 1, lift),
            left: houseLayout.projectIsoLocal(x, y + 1, lift)
        };
    }

    function midpoint(pointA, pointB) {
        return {
            x: (pointA.x + pointB.x) / 2,
            y: (pointA.y + pointB.y) / 2
        };
    }

    function lerpPoint(pointA, pointB, factor) {
        return {
            x: pointA.x + (pointB.x - pointA.x) * factor,
            y: pointA.y + (pointB.y - pointA.y) * factor
        };
    }

    function insetWallQuad(quad, topFactor, bottomFactor, sidePadding) {
        const topLeftBase = lerpPoint(quad[0], quad[3], topFactor);
        const topRightBase = lerpPoint(quad[1], quad[2], topFactor);
        const bottomLeftBase = lerpPoint(quad[0], quad[3], bottomFactor);
        const bottomRightBase = lerpPoint(quad[1], quad[2], bottomFactor);

        return [
            lerpPoint(topLeftBase, topRightBase, sidePadding),
            lerpPoint(topLeftBase, topRightBase, 1 - sidePadding),
            lerpPoint(bottomLeftBase, bottomRightBase, 1 - sidePadding),
            lerpPoint(bottomLeftBase, bottomRightBase, sidePadding)
        ];
    }

    function insetDiamond(points, factor) {
        const center = {
            x: (points.top.x + points.right.x + points.bottom.x + points.left.x) / 4,
            y: (points.top.y + points.right.y + points.bottom.y + points.left.y) / 4
        };

        return [points.top, points.right, points.bottom, points.left].map((point) => ({
            x: center.x + (point.x - center.x) * factor,
            y: center.y + (point.y - center.y) * factor
        }));
    }

    function translatePoints(points, translateX, translateY) {
        return points.map((point) => ({
            x: point.x + translateX,
            y: point.y + translateY
        }));
    }

    function pointsToSvg(points) {
        return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
    }

    function createSvgImage(svg) {
        const image = new Image();

        image.onload = () => {
            if (window.Game.systems.render) {
                window.Game.systems.render.render();
            }
        };

        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        return image;
    }

    Object.assign(houseVisuals, {
        getDiamondPoints,
        midpoint,
        lerpPoint,
        insetWallQuad,
        insetDiamond,
        translatePoints,
        pointsToSvg,
        createSvgImage
    });
})();
