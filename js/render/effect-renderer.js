(() => {
    const game = window.Game;
    const effectRenderer = game.systems.effectRenderer = game.systems.effectRenderer || {};

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function drawBurstChest(effect, progress) {
        const { tileHeight } = game.config;
        const { x: screenX, y: screenY } = game.systems.camera.isoToScreen(
            effect.interaction.worldX,
            effect.interaction.worldY
        );
        const baseY = screenY + tileHeight / 2 + 2 - progress * 10;
        const alpha = 1 - progress;
        const scale = 1 - progress * 0.45;
        const isJackpot = effect.interaction.kind === 'jackpotChest' || effect.interaction.kind === 'finalChest';

        game.ctx.save();
        game.ctx.globalAlpha = alpha;
        game.ctx.translate(screenX, baseY);
        game.ctx.scale(scale, scale);
        game.ctx.fillStyle = isJackpot ? '#b87812' : '#8a4f18';
        game.ctx.fillRect(-14, -18, 28, 16);
        game.ctx.fillStyle = isJackpot ? '#d9a41c' : '#a86322';
        game.ctx.fillRect(-16, -26, 32, 10);
        game.ctx.fillStyle = isJackpot ? '#fff0a8' : '#d7bb64';
        game.ctx.fillRect(-2, -26, 4, 24);
        game.ctx.fillRect(-12, -11, 24, 3);
        game.ctx.restore();
    }

    function getRewardLabel(drop) {
        if (drop.type === 'gold') {
            return `+${drop.amount} золота`;
        }

        if (drop.type === 'stat') {
            return `${drop.label} +${drop.amount}`;
        }

        return `+ ${drop.label}${drop.quantity > 1 ? ` x${drop.quantity}` : ''}`;
    }

    function getRewardPalette(drop) {
        if (drop.type === 'gold') {
            return {
                background: 'rgba(63, 45, 8, 0.86)',
                accent: '#ffd15c'
            };
        }

        if (drop.type === 'stat') {
            return {
                background: 'rgba(21, 44, 56, 0.86)',
                accent: '#9fe8ff'
            };
        }

        return {
            background: 'rgba(28, 48, 38, 0.86)',
            accent: '#d9f7cb'
        };
    }

    function drawRewardFloat(effect, progress) {
        const { tileHeight } = game.config;
        const drop = effect.drop;
        const label = getRewardLabel(drop);
        const palette = getRewardPalette(drop);
        const { x: screenX, y: screenY } = game.systems.camera.isoToScreen(
            effect.interaction.worldX,
            effect.interaction.worldY
        );
        const drawX = screenX + (effect.driftX || 0);
        const drawY = screenY - 26 - progress * 34;
        const alpha = clamp(progress < 0.2 ? progress / 0.2 : (1 - progress) / 0.8, 0, 1);

        game.ctx.save();
        game.ctx.globalAlpha = alpha;
        game.ctx.font = 'bold 14px Arial';
        game.ctx.textAlign = 'center';
        game.ctx.textBaseline = 'middle';
        const textWidth = game.ctx.measureText(label).width;
        const width = textWidth + 26;
        const height = 24;

        game.ctx.fillStyle = palette.background;
        game.ctx.fillRect(drawX - width / 2, drawY - height / 2, width, height);

        game.ctx.fillStyle = palette.accent;
        game.ctx.fillText(drop.icon || '+', drawX - width / 2 + 12, drawY + 1);
        game.ctx.fillStyle = '#f7f2d1';
        game.ctx.fillText(label, drawX + 8, drawY + 1);
        game.ctx.restore();
    }

    function drawEffects() {
        if (!game.systems.effects) {
            return;
        }

        const now = game.systems.effects.getNow();
        const activeEffects = game.systems.effects.getActiveEffects(now);

        activeEffects.forEach((effect) => {
            const progress = clamp((now - effect.startTime) / effect.duration, 0, 1);

            if (effect.type === 'chestBurst') {
                drawBurstChest(effect, progress);
                return;
            }

            if (effect.type === 'rewardFloat') {
                drawRewardFloat(effect, progress);
            }
        });
    }

    Object.assign(effectRenderer, {
        drawEffects
    });
})();
