(() => {
    const game = window.Game;
    const playerRenderer = game.systems.playerRenderer = game.systems.playerRenderer || {};
    const spriteAssets = new Map();
    const playerScreenPointBuffer = { x: 0, y: 0 };

    game.assets = game.assets || {};
    game.assets.playerSprites = spriteAssets;

    function fillScreenPoint(x, y, out) {
        const camera = game.systems.camera || null;

        if (camera && typeof camera.isoToScreenTo === 'function') {
            return camera.isoToScreenTo(x, y, out);
        }

        const point = camera && typeof camera.isoToScreen === 'function'
            ? camera.isoToScreen(x, y)
            : null;

        out.x = point ? point.x : 0;
        out.y = point ? point.y : 0;
        return out;
    }

    function drawFallbackPlayer(position) {
        fillScreenPoint(position.x, position.y, playerScreenPointBuffer);
        const screenX = playerScreenPointBuffer.x;
        const screenY = playerScreenPointBuffer.y;
        const tileCenterY = screenY + game.config.tileHeight / 2;

        game.ctx.save();
        game.ctx.translate(screenX, tileCenterY);
        game.ctx.beginPath();
        game.ctx.arc(0, 0, 12, 0, Math.PI * 2);
        game.ctx.fillStyle = game.colors.player;
        game.ctx.fill();
        game.ctx.strokeStyle = '#333';
        game.ctx.lineWidth = 2;
        game.ctx.stroke();
        game.ctx.fillStyle = '#fff';
        game.ctx.beginPath();
        game.ctx.arc(-4, -2, 2, 0, Math.PI * 2);
        game.ctx.arc(4, -2, 2, 0, Math.PI * 2);
        game.ctx.fill();
        game.ctx.restore();
    }

    function setFacing(direction) {
        game.state.playerFacing = direction;
    }

    function setFacingFromDelta(dx, dy) {
        const stepX = Math.sign(dx);
        const stepY = Math.sign(dy);

        if (stepX === 0 && stepY === 0) {
            return;
        }

        if (stepX > 0 && stepY < 0) {
            setFacing('east');
            return;
        }

        if (stepX > 0 && stepY > 0) {
            setFacing('south');
            return;
        }

        if (stepX < 0 && stepY < 0) {
            setFacing('north');
            return;
        }

        if (stepX < 0 && stepY > 0) {
            setFacing('west');
            return;
        }

        if (stepX > 0) {
            setFacing('southEast');
            return;
        }

        if (stepX < 0) {
            setFacing('northWest');
            return;
        }

        if (stepY > 0) {
            setFacing('southWest');
            return;
        }

        if (stepY < 0) {
            setFacing('northEast');
        }
    }

    function getCurrentFrame() {
        const spriteConfig = game.config.playerSprite;
        const direction = game.state.playerFacing || 'south';
        return getFrameByDirection(direction) || getFrameByDirection('south');
    }

    function getFrameByDirection(direction) {
        const spriteConfig = game.config.playerSprite;
        const frameConfig = spriteConfig.frames[direction] || spriteConfig.frames.south;

        if (!frameConfig || !frameConfig.src) {
            return null;
        }

        const asset = spriteAssets.get(frameConfig.src);

        if (!asset || !asset.image.complete || !asset.image.naturalWidth) {
            return null;
        }

        const resolvedBounds = asset.bounds || {
            sourceX: frameConfig.sourceX,
            sourceY: frameConfig.sourceY,
            sourceWidth: frameConfig.sourceWidth,
            sourceHeight: frameConfig.sourceHeight,
            footX: frameConfig.footX,
            footY: frameConfig.footY
        };

        if (
            typeof resolvedBounds.sourceX !== 'number' ||
            typeof resolvedBounds.sourceY !== 'number' ||
            typeof resolvedBounds.sourceWidth !== 'number' ||
            typeof resolvedBounds.sourceHeight !== 'number' ||
            typeof resolvedBounds.footX !== 'number' ||
            typeof resolvedBounds.footY !== 'number'
        ) {
            return null;
        }

        return {
            image: asset.image,
            sourceX: resolvedBounds.sourceX,
            sourceY: resolvedBounds.sourceY,
            sourceWidth: resolvedBounds.sourceWidth,
            sourceHeight: resolvedBounds.sourceHeight,
            footX: resolvedBounds.footX,
            footY: resolvedBounds.footY,
            flipX: Boolean(frameConfig.flipX)
        };
    }

    function getDrawMetrics(frame, targetHeight = game.config.playerSprite.targetHeight) {
        const scale = targetHeight / frame.sourceHeight;
        return {
            scale,
            drawWidth: frame.sourceWidth * scale,
            drawHeight: frame.sourceHeight * scale,
            anchorX: (frame.flipX ? (frame.sourceWidth - frame.footX) : frame.footX) * scale,
            anchorY: frame.footY * scale
        };
    }

    function analyzeSpriteImage(image) {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;

        if (!width || !height) {
            return null;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (!context) {
            return null;
        }

        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0);

        const { data } = context.getImageData(0, 0, width, height);
        const boundsThreshold = 24;
        const footThreshold = 96;
        let minX = width;
        let minY = height;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const alpha = data[(y * width + x) * 4 + 3];

                if (alpha <= boundsThreshold) {
                    continue;
                }

                if (x < minX) {
                    minX = x;
                }

                if (y < minY) {
                    minY = y;
                }

                if (x > maxX) {
                    maxX = x;
                }

                if (y > maxY) {
                    maxY = y;
                }
            }
        }

        if (maxX < minX || maxY < minY) {
            return null;
        }

        const sourceWidth = maxX - minX + 1;
        const sourceHeight = maxY - minY + 1;
        const footRowStart = Math.max(minY, maxY - Math.max(12, Math.floor(sourceHeight * 0.18)));
        let weightedFootCenter = 0;
        let weightedFootSamples = 0;

        for (let y = footRowStart; y <= maxY; y += 1) {
            let rowMinX = width;
            let rowMaxX = -1;
            let rowPixels = 0;

            for (let x = minX; x <= maxX; x += 1) {
                const alpha = data[(y * width + x) * 4 + 3];

                if (alpha <= footThreshold) {
                    continue;
                }

                rowMinX = Math.min(rowMinX, x);
                rowMaxX = Math.max(rowMaxX, x);
                rowPixels += 1;
            }

            if (rowMaxX < rowMinX) {
                continue;
            }

            const rowCenter = (rowMinX + rowMaxX) / 2;
            const rowWeight = rowPixels * (1 + (y - footRowStart));
            weightedFootCenter += rowCenter * rowWeight;
            weightedFootSamples += rowWeight;
        }

        const absoluteFootX = weightedFootSamples > 0
            ? weightedFootCenter / weightedFootSamples
            : (minX + maxX) / 2;

        return {
            sourceX: minX,
            sourceY: minY,
            sourceWidth,
            sourceHeight,
            footX: absoluteFootX - minX,
            footY: sourceHeight
        };
    }

    function markSpriteUpdate() {
        if (game.systems.ui && typeof game.systems.ui.markDirty === 'function') {
            game.systems.ui.markDirty(['portrait']);
        }

        if (game.systems.render) {
            game.systems.render.render();
        }
    }

    function loadSpriteAsset(src) {
        if (!src || spriteAssets.has(src)) {
            return;
        }

        const image = new Image();
        const asset = {
            image,
            bounds: null
        };

        image.onload = () => {
            asset.bounds = analyzeSpriteImage(image);
            markSpriteUpdate();
        };

        spriteAssets.set(src, asset);
        image.src = src;
    }

    function drawPlayer(position) {
        const frame = getCurrentFrame();
        if (
            !frame ||
            !frame.image ||
            typeof frame.sourceX !== 'number' ||
            typeof frame.sourceY !== 'number' ||
            typeof frame.sourceWidth !== 'number' ||
            typeof frame.sourceHeight !== 'number' ||
            typeof frame.footX !== 'number' ||
            typeof frame.footY !== 'number'
        ) {
            drawFallbackPlayer(position);
            return;
        }

        const metrics = getDrawMetrics(frame);
        fillScreenPoint(position.x, position.y, playerScreenPointBuffer);
        const screenX = playerScreenPointBuffer.x;
        const screenY = playerScreenPointBuffer.y;
        const tileCenterY = screenY + game.config.tileHeight / 2;
        const drawX = screenX - metrics.anchorX;
        const drawY = tileCenterY - metrics.anchorY;

        game.ctx.save();
        game.ctx.imageSmoothingEnabled = false;

        if (frame.flipX) {
            game.ctx.translate(drawX + metrics.drawWidth, drawY);
            game.ctx.scale(-1, 1);
            game.ctx.drawImage(
                frame.image,
                frame.sourceX,
                frame.sourceY,
                frame.sourceWidth,
                frame.sourceHeight,
                0,
                0,
                metrics.drawWidth,
                metrics.drawHeight
            );
        } else {
            game.ctx.drawImage(
                frame.image,
                frame.sourceX,
                frame.sourceY,
                frame.sourceWidth,
                frame.sourceHeight,
                drawX,
                drawY,
                metrics.drawWidth,
                metrics.drawHeight
            );
        }

        game.ctx.restore();
    }

    function resetFacing() {
        game.state.playerFacing = 'south';
    }

    Object.values(game.config.playerSprite.frames).forEach((frameConfig) => {
        loadSpriteAsset(frameConfig.src);
    });

    Object.assign(playerRenderer, {
        drawPlayer,
        getCurrentFrame,
        getDrawMetrics,
        getFrameByDirection,
        resetFacing,
        setFacing,
        setFacingFromDelta
    });
})();
