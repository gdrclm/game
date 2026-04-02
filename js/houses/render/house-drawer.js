(() => {
    const houseRenderer = window.Game.systems.houseRenderer = window.Game.systems.houseRenderer || {};

    function getVisibleHouses(focusChunkX, focusChunkY) {
        const houses = [];
        const viewDistance = window.Game.config.viewDistance;

        for (let chunkY = focusChunkY - viewDistance; chunkY <= focusChunkY + viewDistance; chunkY++) {
            for (let chunkX = focusChunkX - viewDistance; chunkX <= focusChunkX + viewDistance; chunkX++) {
                const chunk = window.Game.state.loadedChunks[`${chunkX},${chunkY}`];

                if (chunk && chunk.houses) {
                    houses.push(...chunk.houses);
                }
            }
        }

        return houses.sort((first, second) => first.renderDepth - second.renderDepth);
    }

    function getDrawPosition(house, variant) {
        return {
            x: house.projectedOrigin.x + variant.localFootprintMinX + window.Game.camera.offset.x - variant.drawOffsetX,
            y: house.projectedOrigin.y + variant.localFootprintMinY + window.Game.camera.offset.y - variant.drawOffsetY
        };
    }

    function getHouseStyle(house) {
        return house && house.expedition && house.expedition.houseStyle
            ? house.expedition.houseStyle
            : 'ordinary';
    }

    function getDoorScreenPosition(house) {
        if (!house || !house.door || !house.door.worldOutside) {
            return null;
        }

        const { x, y } = window.Game.systems.camera.isoToScreen(
            house.door.worldOutside.x,
            house.door.worldOutside.y
        );

        return {
            x: x + window.Game.camera.offset.x,
            y: y + window.Game.camera.offset.y + window.Game.config.tileHeight / 2
        };
    }

    function drawGroundDiamond(x, y, width, height, fillStyle, strokeStyle = '') {
        const context = window.Game.ctx;

        context.save();
        context.translate(x, y);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(width / 2, height / 2);
        context.lineTo(0, height);
        context.lineTo(-width / 2, height / 2);
        context.closePath();
        context.fillStyle = fillStyle;
        context.fill();

        if (strokeStyle) {
            context.strokeStyle = strokeStyle;
            context.lineWidth = 1.4;
            context.stroke();
        }

        context.restore();
    }

    function drawHouseStyleSouth(house, variant, drawPosition) {
        const context = window.Game.ctx;
        const style = getHouseStyle(house);
        const doorPosition = getDoorScreenPosition(house);
        const centerX = drawPosition.x + variant.drawWidth / 2;
        const baseY = drawPosition.y + variant.drawHeight * 0.72;

        context.save();

        if (style === 'rich') {
            if (doorPosition) {
                drawGroundDiamond(doorPosition.x, doorPosition.y - 2, 28, 14, 'rgba(193, 157, 91, 0.72)', 'rgba(107, 75, 28, 0.85)');
                context.fillStyle = '#8f6f31';
                context.fillRect(doorPosition.x - 11, doorPosition.y - 16, 4, 14);
                context.fillRect(doorPosition.x + 7, doorPosition.y - 16, 4, 14);
            }

            context.fillStyle = 'rgba(247, 219, 150, 0.38)';
            context.fillRect(centerX - 16, baseY - 28, 32, 18);
            context.fillStyle = '#ce9b35';
            context.fillRect(centerX - 20, baseY - 6, 40, 4);
        } else if (style === 'poor') {
            context.strokeStyle = 'rgba(99, 66, 31, 0.85)';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(centerX - 22, baseY - 22);
            context.lineTo(centerX - 6, baseY - 10);
            context.moveTo(centerX + 4, baseY - 20);
            context.lineTo(centerX + 20, baseY - 8);
            context.stroke();
        } else if (style === 'empty') {
            context.fillStyle = 'rgba(120, 120, 120, 0.24)';
            context.fillRect(centerX - 22, baseY - 30, 44, 24);

            if (doorPosition) {
                context.fillStyle = '#70573e';
                context.fillRect(doorPosition.x - 8, doorPosition.y - 15, 16, 4);
                context.fillRect(doorPosition.x - 6, doorPosition.y - 8, 12, 3);
            }
        } else if (style === 'trap') {
            if (doorPosition) {
                drawGroundDiamond(doorPosition.x, doorPosition.y - 1, 24, 12, 'rgba(118, 25, 25, 0.68)', 'rgba(255, 108, 108, 0.78)');
                context.strokeStyle = '#ff8d8d';
                context.lineWidth = 1.5;
                context.beginPath();
                context.moveTo(doorPosition.x - 10, doorPosition.y - 16);
                context.lineTo(doorPosition.x + 10, doorPosition.y - 4);
                context.moveTo(doorPosition.x + 10, doorPosition.y - 16);
                context.lineTo(doorPosition.x - 10, doorPosition.y - 4);
                context.stroke();
            }

            context.fillStyle = 'rgba(50, 0, 0, 0.24)';
            context.fillRect(centerX - 20, baseY - 28, 40, 20);
        }

        context.restore();
    }

    function drawHouseStyleNorth(house, variant, drawPosition) {
        const context = window.Game.ctx;
        const style = getHouseStyle(house);
        const centerX = drawPosition.x + variant.drawWidth / 2;
        const roofTopY = drawPosition.y + Math.max(10, variant.drawHeight * 0.18);

        context.save();

        if (style === 'rich') {
            context.fillStyle = '#e6c36c';
            context.beginPath();
            context.moveTo(centerX, roofTopY - 12);
            context.lineTo(centerX + 7, roofTopY);
            context.lineTo(centerX - 7, roofTopY);
            context.closePath();
            context.fill();

            context.fillStyle = 'rgba(255, 230, 150, 0.5)';
            context.fillRect(centerX - 24, roofTopY + 10, 48, 3);
        } else if (style === 'poor') {
            context.strokeStyle = 'rgba(90, 63, 42, 0.85)';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(centerX - 18, roofTopY + 6);
            context.lineTo(centerX - 6, roofTopY + 16);
            context.moveTo(centerX + 6, roofTopY + 4);
            context.lineTo(centerX + 18, roofTopY + 15);
            context.stroke();
        } else if (style === 'empty') {
            context.fillStyle = 'rgba(160, 160, 160, 0.18)';
            context.fillRect(centerX - 24, roofTopY, 48, 18);
        } else if (style === 'trap') {
            context.fillStyle = '#b83b3b';
            context.beginPath();
            context.moveTo(centerX, roofTopY - 10);
            context.lineTo(centerX + 10, roofTopY + 4);
            context.lineTo(centerX, roofTopY + 1);
            context.lineTo(centerX - 10, roofTopY + 4);
            context.closePath();
            context.fill();
        }

        context.restore();
    }

    function drawHouseInterior(house) {
        const variant = houseRenderer.getHouseVariant(house.footprint, house.paletteIndex);

        if (!variant.interiorImage || !variant.interiorImage.complete) {
            return;
        }

        const drawPosition = getDrawPosition(house, variant);

        window.Game.ctx.drawImage(
            variant.interiorImage,
            drawPosition.x,
            drawPosition.y,
            variant.drawWidth,
            variant.drawHeight
        );
    }

    function drawExteriorHouseSouth(house) {
        const variant = houseRenderer.getHouseVariant(house.footprint, house.paletteIndex);
        const drawPosition = getDrawPosition(house, variant);

        if (variant.bodyImage.complete) {
            window.Game.ctx.drawImage(
                variant.bodyImage,
                drawPosition.x,
                drawPosition.y,
                variant.drawWidth,
                variant.drawHeight
            );
        }

        if (variant.southRoofImage.complete) {
            window.Game.ctx.drawImage(
                variant.southRoofImage,
                drawPosition.x,
                drawPosition.y,
                variant.drawWidth,
                variant.drawHeight
            );
        }

        drawHouseStyleSouth(house, variant, drawPosition);
    }

    function drawExteriorHouseNorth(house) {
        const variant = houseRenderer.getHouseVariant(house.footprint, house.paletteIndex);
        const drawPosition = getDrawPosition(house, variant);

        if (variant.northRoofImage.complete) {
            window.Game.ctx.drawImage(
                variant.northRoofImage,
                drawPosition.x,
                drawPosition.y,
                variant.drawWidth,
                variant.drawHeight
            );
        }

        drawHouseStyleNorth(house, variant, drawPosition);
    }

    function drawInteriorHouses(focusChunkX, focusChunkY, activeHouseId = null) {
        if (!activeHouseId) {
            return;
        }

        getVisibleHouses(focusChunkX, focusChunkY)
            .filter((house) => house.id === activeHouseId)
            .forEach(drawHouseInterior);
    }

    function drawExteriorHouseSouthParts(focusChunkX, focusChunkY, activeHouseId = null) {
        getVisibleHouses(focusChunkX, focusChunkY)
            .filter((house) => house.id !== activeHouseId)
            .forEach(drawExteriorHouseSouth);
    }

    function drawExteriorHouseNorthParts(focusChunkX, focusChunkY, activeHouseId = null) {
        getVisibleHouses(focusChunkX, focusChunkY)
            .filter((house) => house.id !== activeHouseId)
            .forEach(drawExteriorHouseNorth);
    }

    Object.assign(houseRenderer, {
        drawInteriorHouses,
        drawExteriorHouseSouthParts,
        drawExteriorHouseNorthParts
    });
})();
