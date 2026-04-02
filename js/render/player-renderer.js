(() => {
    const game = window.Game;
    const playerRenderer = game.systems.playerRenderer = game.systems.playerRenderer || {};
    const playerSprite = new Image();

    game.assets = game.assets || {};
    game.assets.playerSprite = playerSprite;

    function drawFallbackPlayer(position) {
        const { x: screenX, y: screenY } = game.systems.camera.isoToScreen(position.x, position.y);
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
        return spriteConfig.frames[direction] || spriteConfig.frames.south;
    }

    function getDrawMetrics(frame) {
        const scale = game.config.playerSprite.targetHeight / frame.sourceHeight;
        return {
            scale,
            drawWidth: frame.sourceWidth * scale,
            drawHeight: frame.sourceHeight * scale,
            anchorX: (frame.flipX ? (frame.sourceWidth - frame.footX) : frame.footX) * scale,
            anchorY: frame.footY * scale
        };
    }

    function drawPlayer(position) {
        if (!playerSprite.complete || !playerSprite.naturalWidth) {
            drawFallbackPlayer(position);
            return;
        }

        const frame = getCurrentFrame();
        if (
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
        const { x: screenX, y: screenY } = game.systems.camera.isoToScreen(position.x, position.y);
        const tileCenterY = screenY + game.config.tileHeight / 2;
        const drawX = screenX - metrics.anchorX;
        const drawY = tileCenterY - metrics.anchorY;

        game.ctx.save();
        game.ctx.imageSmoothingEnabled = false;

        if (frame.flipX) {
            game.ctx.translate(drawX + metrics.drawWidth, drawY);
            game.ctx.scale(-1, 1);
            game.ctx.drawImage(
                playerSprite,
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
                playerSprite,
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

    playerSprite.onload = () => {
        if (game.systems.ui && typeof game.systems.ui.markDirty === 'function') {
            game.systems.ui.markDirty(['portrait']);
        }

        if (game.systems.render) {
            game.systems.render.render();
        }
    };

    playerSprite.src = game.config.playerSprite.src;

    Object.assign(playerRenderer, {
        drawPlayer,
        resetFacing,
        setFacing,
        setFacingFromDelta
    });
})();
