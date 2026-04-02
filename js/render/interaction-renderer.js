(() => {
    const interactionRenderer = window.Game.systems.interactionRenderer = window.Game.systems.interactionRenderer || {};

    function getVisibleInteractions(focusChunkX, focusChunkY) {
        const result = [];
        const viewDistance = window.Game.config.viewDistance;

        for (let chunkY = focusChunkY - viewDistance; chunkY <= focusChunkY + viewDistance; chunkY++) {
            for (let chunkX = focusChunkX - viewDistance; chunkX <= focusChunkX + viewDistance; chunkX++) {
                const chunk = window.Game.state.loadedChunks[`${chunkX},${chunkY}`];

                if (chunk && Array.isArray(chunk.interactions)) {
                    result.push(...chunk.interactions);
                }
            }
        }

        return result.sort((left, right) => left.renderDepth - right.renderDepth);
    }

    function drawInteractionDiamond(screenX, screenY, fillStyle) {
        const { tileWidth, tileHeight } = window.Game.config;
        const context = window.Game.ctx;

        context.save();
        context.translate(screenX, screenY);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(tileWidth / 2, tileHeight / 2);
        context.lineTo(0, tileHeight);
        context.lineTo(-tileWidth / 2, tileHeight / 2);
        context.closePath();
        context.fillStyle = fillStyle;
        context.fill();
        context.restore();
    }

    function isInteractionResolved(interaction) {
        return Boolean(interaction && window.Game.state.resolvedHouseIds && window.Game.state.resolvedHouseIds[interaction.houseId]);
    }

    function drawShadow(screenX, baseY, radiusX, radiusY) {
        const context = window.Game.ctx;

        context.save();
        context.translate(screenX, baseY);
        context.beginPath();
        context.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
        context.fillStyle = 'rgba(0, 0, 0, 0.18)';
        context.fill();
        context.restore();
    }

    function drawChest(screenX, baseY, interaction, resolved) {
        const context = window.Game.ctx;
        const expedition = interaction.expedition || {};
        const chestTier = interaction.kind === 'finalChest'
            ? 'final'
            : (expedition.chestTier || (interaction.kind === 'jackpotChest' ? 'jackpot' : 'ordinary'));
        const tierStyle = {
            ordinary: { body: '#8a4f18', lid: '#a86322', trim: '#d7bb64', glow: 'rgba(0,0,0,0)', width: 28, height: 16, gems: 0, bands: 1 },
            rich: { body: '#925220', lid: '#b0682b', trim: '#ebc96d', glow: 'rgba(255, 212, 108, 0.12)', width: 30, height: 17, gems: 2, bands: 2 },
            hidden: { body: '#5b4428', lid: '#6d5535', trim: '#9e8d5a', glow: 'rgba(0,0,0,0)', width: 26, height: 15, gems: 0, bands: 1 },
            cursed: { body: '#4a284e', lid: '#5b3560', trim: '#7be08d', glow: 'rgba(122, 227, 141, 0.22)', width: 30, height: 16, gems: 2, bands: 1 },
            elite: { body: '#7d4618', lid: '#b97829', trim: '#f2d88a', glow: 'rgba(255, 220, 124, 0.18)', width: 34, height: 18, gems: 4, bands: 2 },
            jackpot: { body: '#9f5812', lid: '#d28722', trim: '#ffe28d', glow: 'rgba(255, 224, 111, 0.24)', width: 36, height: 19, gems: 6, bands: 3 },
            final: { body: '#c69110', lid: '#d9a41c', trim: '#fff0a8', glow: 'rgba(255, 239, 164, 0.28)', width: 38, height: 20, gems: 8, bands: 3 }
        }[chestTier] || {
            body: '#8a4f18',
            lid: '#a86322',
            trim: '#d7bb64',
            glow: 'rgba(0,0,0,0)',
            width: 28,
            height: 16,
            gems: 0,
            bands: 1
        };
        const halfWidth = Math.round(tierStyle.width / 2);

        drawShadow(screenX, baseY + 2, Math.max(12, halfWidth), 6);

        context.save();
        context.translate(screenX, baseY);

        if (tierStyle.glow && tierStyle.glow !== 'rgba(0,0,0,0)') {
            context.fillStyle = tierStyle.glow;
            context.beginPath();
            context.ellipse(0, -12, halfWidth + 8, 12, 0, 0, Math.PI * 2);
            context.fill();
        }

        context.fillStyle = tierStyle.body;
        context.fillRect(-halfWidth, -18, tierStyle.width, tierStyle.height);
        context.fillStyle = tierStyle.lid;
        context.fillRect(-(halfWidth + 2), -27, tierStyle.width + 4, 10);
        context.fillStyle = tierStyle.trim;
        context.fillRect(-2, -27, 4, 25);

        for (let bandIndex = 0; bandIndex < tierStyle.bands; bandIndex++) {
            const yOffset = -11 - bandIndex * 4;
            context.fillRect(-(halfWidth - 3), yOffset, tierStyle.width - 6, 2.5);
        }

        if (chestTier === 'hidden') {
            context.fillStyle = 'rgba(74, 113, 46, 0.9)';
            context.fillRect(-(halfWidth + 4), -15, 6, 10);
            context.fillRect(halfWidth - 2, -12, 6, 9);
        }

        if (chestTier === 'cursed') {
            context.fillStyle = '#7be08d';
            context.beginPath();
            context.arc(0, -31, 3.5, 0, Math.PI * 2);
            context.fill();
            context.fillRect(-11, -32, 5, 2);
            context.fillRect(6, -32, 5, 2);
        }

        if (tierStyle.gems > 0) {
            context.fillStyle = chestTier === 'cursed' ? '#7be08d' : '#39c77f';
            for (let gemIndex = 0; gemIndex < tierStyle.gems; gemIndex++) {
                const progress = tierStyle.gems === 1 ? 0.5 : gemIndex / (tierStyle.gems - 1);
                const x = -halfWidth + 4 + progress * Math.max(0, tierStyle.width - 8);
                const y = gemIndex % 2 === 0 ? -23 : -30;
                context.beginPath();
                context.arc(x, y, chestTier === 'final' ? 2.6 : 2.1, 0, Math.PI * 2);
                context.fill();
            }
        }

        if (resolved) {
            context.fillStyle = 'rgba(210, 210, 210, 0.38)';
            context.fillRect(-(halfWidth + 2), -30, tierStyle.width + 4, 30);
        }

        context.restore();
    }

    function drawMerchant(screenX, baseY, resolved) {
        const context = window.Game.ctx;

        drawShadow(screenX, baseY + 3, 11, 5);

        context.save();
        context.translate(screenX, baseY);
        context.fillStyle = '#694125';
        context.fillRect(-4, -20, 8, 18);
        context.fillStyle = '#294f7a';
        context.fillRect(-10, -12, 20, 14);
        context.fillStyle = '#ddc29a';
        context.beginPath();
        context.arc(0, -26, 7, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#8b6e2d';
        context.fillRect(-12, -35, 24, 5);
        context.fillRect(-8, -40, 16, 8);
        context.fillStyle = '#6b4d1f';
        context.fillRect(10, -14, 8, 12);
        context.fillStyle = '#9a6a33';
        context.fillRect(-16, -10, 6, 10);

        if (resolved) {
            context.fillStyle = 'rgba(205, 205, 205, 0.4)';
            context.fillRect(-18, -42, 36, 44);
        }

        context.restore();
    }

    function drawArtisan(screenX, baseY, resolved) {
        const context = window.Game.ctx;

        drawShadow(screenX, baseY + 3, 11, 5);

        context.save();
        context.translate(screenX, baseY);
        context.fillStyle = '#5d3824';
        context.fillRect(-4, -20, 8, 18);
        context.fillStyle = '#496057';
        context.fillRect(-10, -12, 20, 14);
        context.fillStyle = '#dfc8a3';
        context.beginPath();
        context.arc(0, -26, 7, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#7b5a31';
        context.fillRect(-12, -35, 24, 5);
        context.fillRect(-8, -40, 16, 8);
        context.fillStyle = '#d0b45c';
        context.fillRect(-16, -14, 5, 13);
        context.fillRect(11, -14, 5, 13);
        context.fillStyle = '#7ac9c1';
        context.beginPath();
        context.arc(0, -32, 3, 0, Math.PI * 2);
        context.fill();

        if (resolved) {
            context.fillStyle = 'rgba(205, 205, 205, 0.4)';
            context.fillRect(-18, -42, 36, 44);
        }

        context.restore();
    }

    function drawShelter(screenX, baseY, resolved) {
        const context = window.Game.ctx;

        drawShadow(screenX, baseY + 4, 13, 5);

        context.save();
        context.translate(screenX, baseY);
        context.fillStyle = '#6f7f45';
        context.fillRect(-16, -10, 32, 10);
        context.fillStyle = '#b0c48c';
        context.fillRect(-12, -14, 24, 7);
        context.fillStyle = '#7b4f16';
        context.fillRect(10, -24, 3, 14);
        context.fillStyle = '#ffc96d';
        context.beginPath();
        context.arc(12, -27, 4, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#6d2d0f';
        context.fillRect(-20, -4, 6, 4);
        context.fillRect(14, -4, 6, 4);

        if (resolved) {
            context.fillStyle = 'rgba(210, 210, 210, 0.32)';
            context.fillRect(-20, -28, 40, 30);
        }

        context.restore();
    }

    function drawWell(screenX, baseY, resolved) {
        const context = window.Game.ctx;

        drawShadow(screenX, baseY + 4, 12, 5);

        context.save();
        context.translate(screenX, baseY);
        context.fillStyle = '#7d7468';
        context.fillRect(-12, -10, 24, 10);
        context.fillStyle = '#b9b2a6';
        context.fillRect(-10, -14, 20, 6);
        context.fillStyle = '#4f8eb4';
        context.fillRect(-8, -12, 16, 4);
        context.fillStyle = '#6f5130';
        context.fillRect(-11, -28, 3, 18);
        context.fillRect(8, -28, 3, 18);
        context.fillRect(-11, -30, 22, 3);
        context.fillStyle = '#8e6a3b';
        context.fillRect(-2, -24, 4, 8);

        if (resolved) {
            context.fillStyle = 'rgba(210, 210, 210, 0.32)';
            context.fillRect(-16, -32, 32, 34);
        }

        context.restore();
    }

    function drawForageBush(screenX, baseY, resolved) {
        const context = window.Game.ctx;

        drawShadow(screenX, baseY + 4, 14, 5);

        context.save();
        context.translate(screenX, baseY);
        context.fillStyle = '#4f7b35';
        context.beginPath();
        context.arc(-8, -10, 8, 0, Math.PI * 2);
        context.arc(0, -16, 10, 0, Math.PI * 2);
        context.arc(9, -10, 8, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#6b9a45';
        context.beginPath();
        context.arc(-2, -9, 8, 0, Math.PI * 2);
        context.arc(7, -15, 6, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#b7355f';
        context.beginPath();
        context.arc(-7, -11, 2.2, 0, Math.PI * 2);
        context.arc(1, -17, 2.2, 0, Math.PI * 2);
        context.arc(8, -10, 2.2, 0, Math.PI * 2);
        context.arc(-1, -7, 2.2, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#6a4a2d';
        context.fillRect(-1, -5, 2, 7);

        if (resolved) {
            context.fillStyle = 'rgba(210, 210, 210, 0.32)';
            context.fillRect(-18, -28, 36, 30);
        }

        context.restore();
    }

    function drawGroundItem(screenX, baseY, interaction) {
        const context = window.Game.ctx;
        const icon = interaction.icon || '?';

        drawShadow(screenX, baseY + 4, 10, 4);

        context.save();
        context.translate(screenX, baseY);
        context.fillStyle = '#6b5533';
        context.fillRect(-10, -8, 20, 10);
        context.fillStyle = '#cfae66';
        context.fillRect(-8, -10, 16, 4);
        context.fillStyle = '#f8efcf';
        context.font = 'bold 11px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(icon, 0, -2);
        context.restore();
    }

    function drawEmptyHouseMarker(screenX, baseY, resolved) {
        const context = window.Game.ctx;

        drawShadow(screenX, baseY + 3, 10, 4);

        context.save();
        context.translate(screenX, baseY);
        context.fillStyle = '#7f7668';
        context.fillRect(-10, -8, 20, 8);
        context.fillStyle = '#b9b1a5';
        context.fillRect(-6, -13, 12, 6);
        context.fillStyle = '#6f675b';
        context.fillRect(-3, -17, 6, 5);

        if (resolved) {
            context.fillStyle = 'rgba(210, 210, 210, 0.35)';
            context.fillRect(-12, -20, 24, 22);
        }

        context.restore();
    }

    function drawTrapHouseMarker(screenX, baseY, resolved) {
        const context = window.Game.ctx;

        drawShadow(screenX, baseY + 3, 10, 4);

        context.save();
        context.translate(screenX, baseY);
        context.fillStyle = '#5c2323';
        context.fillRect(-10, -8, 20, 8);
        context.strokeStyle = '#ff9c9c';
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(-8, -18);
        context.lineTo(0, -4);
        context.lineTo(8, -18);
        context.stroke();

        if (resolved) {
            context.fillStyle = 'rgba(210, 210, 210, 0.35)';
            context.fillRect(-12, -20, 24, 22);
        }

        context.restore();
    }

    function drawInteraction(interaction) {
        const { tileHeight } = window.Game.config;
        const { x: screenX, y: screenY } = window.Game.systems.camera.isoToScreen(interaction.worldX, interaction.worldY);
        const baseY = screenY + tileHeight / 2 + 2;
        const isActive = window.Game.state.activeInteractionId === interaction.id;
        const resolved = isInteractionResolved(interaction);

        if (isActive) {
            drawInteractionDiamond(screenX, screenY, resolved ? 'rgba(205, 205, 205, 0.14)' : 'rgba(255, 228, 132, 0.2)');
        }

        if (interaction.kind === 'merchant') {
            drawMerchant(screenX, baseY, resolved);
            return;
        }

        if (interaction.kind === 'artisan') {
            drawArtisan(screenX, baseY, resolved);
            return;
        }

        if (interaction.kind === 'shelter') {
            drawShelter(screenX, baseY, resolved);
            return;
        }

        if (interaction.kind === 'well') {
            drawWell(screenX, baseY, resolved);
            return;
        }

        if (interaction.kind === 'forage') {
            drawForageBush(screenX, baseY, resolved);
            return;
        }

        if (interaction.kind === 'groundItem') {
            drawGroundItem(screenX, baseY, interaction);
            return;
        }

        if (interaction.kind === 'emptyHouse') {
            drawEmptyHouseMarker(screenX, baseY, resolved);
            return;
        }

        if (interaction.kind === 'trapHouse') {
            drawTrapHouseMarker(screenX, baseY, resolved);
            return;
        }

        drawChest(screenX, baseY, interaction, resolved);
    }

    function shouldRenderInteraction(interaction, activeHouseId = null) {
        if (interaction.placement !== 'interior') {
            return true;
        }

        return Boolean(activeHouseId && interaction.houseId === activeHouseId);
    }

    function drawInteractions(focusChunkX, focusChunkY, options = {}) {
        const {
            activeHouseId = null,
            minDepthExclusive = -Infinity,
            maxDepthInclusive = Infinity
        } = options;

        getVisibleInteractions(focusChunkX, focusChunkY)
            .filter((interaction) => shouldRenderInteraction(interaction, activeHouseId))
            .filter((interaction) => interaction.renderDepth > minDepthExclusive && interaction.renderDepth <= maxDepthInclusive)
            .forEach(drawInteraction);
    }

    Object.assign(interactionRenderer, {
        drawInteractions
    });
})();
