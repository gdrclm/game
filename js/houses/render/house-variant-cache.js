(() => {
    const houseVisuals = window.Game.systems.houseVisuals;
    const houseRenderer = window.Game.systems.houseRenderer = window.Game.systems.houseRenderer || {};
    const houseVariantCache = new Map();

    function getHouseVariant(footprint, paletteIndex) {
        const cacheKey = `${footprint.signature}:${paletteIndex}`;

        if (houseVariantCache.has(cacheKey)) {
            return houseVariantCache.get(cacheKey);
        }

        const variant = houseVisuals.createHouseSvgVariant(footprint, paletteIndex);
        const cachedVariant = {
            ...variant,
            bodyImage: houseVisuals.createSvgImage(variant.bodySvg),
            interiorImage: houseVisuals.createSvgImage(variant.interiorSvg),
            southRoofImage: houseVisuals.createSvgImage(variant.southRoofSvg),
            northRoofImage: houseVisuals.createSvgImage(variant.northRoofSvg)
        };

        houseVariantCache.set(cacheKey, cachedVariant);
        return cachedVariant;
    }

    houseRenderer.getHouseVariant = getHouseVariant;
})();
