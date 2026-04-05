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

    function fillPolygon(context, points, fillStyle) {
        if (!Array.isArray(points) || points.length === 0) {
            return;
        }

        context.beginPath();
        context.moveTo(points[0].x, points[0].y);

        for (let index = 1; index < points.length; index++) {
            context.lineTo(points[index].x, points[index].y);
        }

        context.closePath();
        context.fillStyle = fillStyle;
        context.fill();
    }

    function traceChestBody(context, halfWidth, bodyTop, bodyBottom, shoulderInset) {
        context.beginPath();
        context.moveTo(-(halfWidth - shoulderInset), bodyTop);
        context.lineTo(halfWidth - shoulderInset, bodyTop);
        context.lineTo(halfWidth, bodyBottom);
        context.lineTo(-halfWidth, bodyBottom);
        context.closePath();
    }

    function traceChestLid(context, halfWidth, bodyTop, lidBaseY, lidPeakY, lidOverhang, innerLift) {
        context.beginPath();
        context.moveTo(-(halfWidth + lidOverhang), lidBaseY);
        context.quadraticCurveTo(0, lidPeakY, halfWidth + lidOverhang, lidBaseY);
        context.lineTo(halfWidth - 2, bodyTop + 2);
        context.quadraticCurveTo(0, lidPeakY + innerLift, -(halfWidth - 2), bodyTop + 2);
        context.closePath();
    }

    function drawGem(context, x, y, size, fillStyle, highlightStyle) {
        fillPolygon(context, [
            { x, y: y - size },
            { x: x + size * 0.9, y },
            { x, y: y + size },
            { x: x - size * 0.9, y }
        ], fillStyle);

        fillPolygon(context, [
            { x, y: y - size * 0.7 },
            { x: x + size * 0.38, y: y - size * 0.08 },
            { x, y: y + size * 0.22 },
            { x: x - size * 0.38, y: y - size * 0.08 }
        ], highlightStyle);
    }

    function getChestTierStyle(chestTier) {
        const tierStyles = {
            ordinary: {
                material: 'wood',
                body: '#7d4b22',
                bodyShadow: '#562e12',
                lid: '#a66635',
                lidShadow: '#6f421e',
                trim: '#cda76a',
                trimShadow: '#8c6b37',
                panel: '#91572a',
                accent: '#eed9a6',
                gem: '#3ec88b',
                glow: 'rgba(0,0,0,0)',
                width: 28,
                height: 16,
                lidHeight: 8,
                lidOverhang: 2,
                shoulderInset: 2,
                braces: [-0.5],
                bands: 1,
                rivets: 0,
                gems: 0,
                feet: 2,
                handles: false,
                vines: false,
                runes: false,
                crest: false
            },
            rich: {
                material: 'wood',
                body: '#8b5224',
                bodyShadow: '#603515',
                lid: '#b56f37',
                lidShadow: '#7f4a21',
                trim: '#e2bc73',
                trimShadow: '#9d7935',
                panel: '#9e612d',
                accent: '#fff0c2',
                gem: '#53d49b',
                glow: 'rgba(255, 210, 111, 0.12)',
                width: 31,
                height: 17,
                lidHeight: 10,
                lidOverhang: 3,
                shoulderInset: 2,
                braces: [-7, 7],
                bands: 2,
                rivets: 2,
                gems: 2,
                feet: 2,
                handles: true,
                vines: false,
                runes: false,
                crest: false
            },
            hidden: {
                material: 'wood',
                body: '#56412a',
                bodyShadow: '#362718',
                lid: '#6b5337',
                lidShadow: '#453523',
                trim: '#96825e',
                trimShadow: '#665537',
                panel: '#65503a',
                accent: '#d0c8a2',
                gem: '#6ec08b',
                glow: 'rgba(0,0,0,0)',
                width: 27,
                height: 16,
                lidHeight: 8,
                lidOverhang: 2,
                shoulderInset: 3,
                braces: [-0.5],
                bands: 1,
                rivets: 0,
                gems: 0,
                feet: 2,
                handles: false,
                vines: true,
                runes: false,
                crest: false
            },
            cursed: {
                material: 'metal',
                body: '#4c314d',
                bodyShadow: '#2d1d30',
                lid: '#68436b',
                lidShadow: '#412945',
                trim: '#82e89d',
                trimShadow: '#38734d',
                panel: '#5a3960',
                accent: '#d4ffe0',
                gem: '#7bf7ac',
                glow: 'rgba(122, 227, 141, 0.22)',
                width: 31,
                height: 17,
                lidHeight: 9,
                lidOverhang: 3,
                shoulderInset: 1,
                braces: [-8, 8],
                bands: 2,
                rivets: 6,
                gems: 2,
                feet: 2,
                handles: true,
                vines: false,
                runes: true,
                crest: false
            },
            elite: {
                material: 'metal',
                body: '#5f6873',
                bodyShadow: '#3b434e',
                lid: '#7b8592',
                lidShadow: '#4f5864',
                trim: '#dbc382',
                trimShadow: '#8e7540',
                panel: '#707985',
                accent: '#edf4ff',
                gem: '#74d7ff',
                glow: 'rgba(190, 220, 255, 0.18)',
                width: 34,
                height: 18,
                lidHeight: 11,
                lidOverhang: 4,
                shoulderInset: 1,
                braces: [-10, 0, 10],
                bands: 2,
                rivets: 8,
                gems: 4,
                feet: 2,
                handles: true,
                vines: false,
                runes: false,
                crest: true
            },
            jackpot: {
                material: 'gold',
                body: '#b77a17',
                bodyShadow: '#88570d',
                lid: '#dda12a',
                lidShadow: '#a56f13',
                trim: '#fff1bb',
                trimShadow: '#b8923d',
                panel: '#c8891f',
                accent: '#fff7d5',
                gem: '#ff6d5f',
                glow: 'rgba(255, 224, 111, 0.24)',
                width: 36,
                height: 19,
                lidHeight: 12,
                lidOverhang: 4,
                shoulderInset: 1,
                braces: [-10, 0, 10],
                bands: 3,
                rivets: 8,
                gems: 6,
                feet: 2,
                handles: true,
                vines: false,
                runes: false,
                crest: true
            },
            final: {
                material: 'gold',
                body: '#cf9417',
                bodyShadow: '#97660f',
                lid: '#f0b933',
                lidShadow: '#b17b18',
                trim: '#fff6ce',
                trimShadow: '#c09d46',
                panel: '#dea126',
                accent: '#fffbe2',
                gem: '#5cd0ff',
                glow: 'rgba(255, 239, 164, 0.28)',
                width: 39,
                height: 20,
                lidHeight: 13,
                lidOverhang: 5,
                shoulderInset: 1,
                braces: [-12, -4, 4, 12],
                bands: 3,
                rivets: 10,
                gems: 8,
                feet: 2,
                handles: true,
                vines: false,
                runes: false,
                crest: true
            }
        };

        return tierStyles[chestTier] || tierStyles.ordinary;
    }

    function drawChest(screenX, baseY, interaction, resolved) {
        const context = window.Game.ctx;
        const expedition = interaction.expedition || {};
        const chestTier = interaction.kind === 'finalChest'
            ? 'final'
            : (expedition.chestTier || (interaction.kind === 'jackpotChest' ? 'jackpot' : 'ordinary'));
        const tierStyle = getChestTierStyle(chestTier);
        const halfWidth = Math.round(tierStyle.width / 2);
        const bodyBottom = -2;
        const bodyTop = bodyBottom - tierStyle.height;
        const lidBaseY = bodyTop + 1;
        const lidPeakY = bodyTop - tierStyle.lidHeight;
        const panelInset = tierStyle.material === 'wood' ? 5 : 4;
        const panelTop = bodyTop + 4;
        const panelBottom = bodyBottom - 3;

        drawShadow(screenX, baseY + 2, Math.max(12, halfWidth), 6);

        context.save();
        context.translate(screenX, baseY);

        if (tierStyle.glow && tierStyle.glow !== 'rgba(0,0,0,0)') {
            context.fillStyle = tierStyle.glow;
            context.beginPath();
            context.ellipse(0, -12, halfWidth + 8, 12, 0, 0, Math.PI * 2);
            context.fill();
        }

        for (let footIndex = 0; footIndex < tierStyle.feet; footIndex++) {
            const direction = footIndex === 0 ? -1 : 1;
            fillPolygon(context, [
                { x: direction * (halfWidth - 8), y: bodyBottom - 1 },
                { x: direction * (halfWidth - 4), y: bodyBottom - 1 },
                { x: direction * (halfWidth - 6), y: bodyBottom + 3 }
            ], tierStyle.trimShadow);
        }

        traceChestBody(context, halfWidth, bodyTop, bodyBottom, tierStyle.shoulderInset);
        context.fillStyle = tierStyle.body;
        context.fill();

        fillPolygon(context, [
            { x: -halfWidth, y: bodyBottom },
            { x: -(halfWidth - 1), y: bodyTop + 1 },
            { x: -(halfWidth - 6), y: bodyTop + 2 },
            { x: -(halfWidth - 4), y: bodyBottom - 1 }
        ], tierStyle.bodyShadow);
        fillPolygon(context, [
            { x: halfWidth, y: bodyBottom },
            { x: halfWidth - 1, y: bodyTop + 1 },
            { x: halfWidth - 6, y: bodyTop + 2 },
            { x: halfWidth - 4, y: bodyBottom - 1 }
        ], tierStyle.bodyShadow);

        fillPolygon(context, [
            { x: -(halfWidth - panelInset), y: panelTop },
            { x: halfWidth - panelInset, y: panelTop },
            { x: halfWidth - (panelInset - 1), y: panelBottom },
            { x: -(halfWidth - (panelInset - 1)), y: panelBottom }
        ], tierStyle.panel);

        traceChestLid(
            context,
            halfWidth,
            bodyTop,
            lidBaseY,
            lidPeakY,
            tierStyle.lidOverhang,
            tierStyle.material === 'gold' ? 5 : 4
        );
        context.fillStyle = tierStyle.lid;
        context.fill();

        traceChestLid(
            context,
            halfWidth - 1,
            bodyTop + 2,
            lidBaseY + 2,
            lidPeakY + 4,
            Math.max(1, tierStyle.lidOverhang - 1),
            tierStyle.material === 'gold' ? 5 : 4
        );
        context.fillStyle = tierStyle.lidShadow;
        context.fill();

        context.fillStyle = tierStyle.trim;
        context.fillRect(-(halfWidth - 3), bodyTop + 1, tierStyle.width - 6, 2.5);

        for (let bandIndex = 0; bandIndex < tierStyle.bands; bandIndex++) {
            const yOffset = panelTop + 2 + bandIndex * 4;
            context.fillStyle = bandIndex % 2 === 0 ? tierStyle.trim : tierStyle.trimShadow;
            context.fillRect(-(halfWidth - 4), yOffset, tierStyle.width - 8, 2);
        }

        tierStyle.braces.forEach((braceX) => {
            context.fillStyle = tierStyle.trimShadow;
            context.fillRect(braceX - 1.6, lidBaseY + 0.5, 3.2, bodyBottom - lidBaseY - 0.5);
            context.fillStyle = tierStyle.trim;
            context.fillRect(braceX - 1, lidBaseY, 2, bodyBottom - lidBaseY - 1.2);
        });

        if (tierStyle.material === 'metal') {
            context.fillStyle = tierStyle.trimShadow;
            context.fillRect(-halfWidth + 2, panelTop - 1, 3, panelBottom - panelTop + 4);
            context.fillRect(halfWidth - 5, panelTop - 1, 3, panelBottom - panelTop + 4);
        }

        if (tierStyle.material === 'gold') {
            context.strokeStyle = tierStyle.accent;
            context.lineWidth = 1.6;
            context.lineCap = 'round';
            context.beginPath();
            context.moveTo(-(halfWidth - 6), lidBaseY - 1);
            context.quadraticCurveTo(0, lidPeakY + 3, halfWidth - 6, lidBaseY - 1);
            context.stroke();
        }

        if (tierStyle.handles) {
            context.strokeStyle = tierStyle.trimShadow;
            context.lineWidth = 1.8;
            context.beginPath();
            context.arc(-halfWidth - 1, bodyTop + 9, 3, Math.PI * 0.2, Math.PI * 1.2, true);
            context.stroke();
            context.beginPath();
            context.arc(halfWidth + 1, bodyTop + 9, 3, Math.PI * 1.8, Math.PI * 0.8, true);
            context.stroke();
        }

        if (tierStyle.rivets > 0) {
            context.fillStyle = tierStyle.accent;
            for (let rivetIndex = 0; rivetIndex < tierStyle.rivets; rivetIndex++) {
                const progress = tierStyle.rivets === 1 ? 0.5 : rivetIndex / (tierStyle.rivets - 1);
                const x = -(halfWidth - 5) + progress * (tierStyle.width - 10);
                const y = rivetIndex % 2 === 0 ? panelTop + 1.5 : panelTop + 5;
                context.beginPath();
                context.arc(x, y, 0.95, 0, Math.PI * 2);
                context.fill();
            }
        }

        if (tierStyle.material === 'gold') {
            fillPolygon(context, [
                { x: 0, y: lidPeakY + 1 },
                { x: 5, y: lidPeakY + 6 },
                { x: 0, y: lidPeakY + 10 },
                { x: -5, y: lidPeakY + 6 }
            ], tierStyle.trimShadow);
        }

        if (tierStyle.crest) {
            fillPolygon(context, [
                { x: 0, y: lidPeakY - 2 },
                { x: 4, y: lidPeakY + 2 },
                { x: 0, y: lidPeakY + 5 },
                { x: -4, y: lidPeakY + 2 }
            ], tierStyle.trim);
        }

        if (tierStyle.material === 'gold') {
            fillPolygon(context, [
                { x: -4, y: panelTop + 2 },
                { x: 4, y: panelTop + 2 },
                { x: 5, y: panelTop + 11 },
                { x: 0, y: panelTop + 15 },
                { x: -5, y: panelTop + 11 }
            ], tierStyle.trim);
            drawGem(context, 0, panelTop + 8, chestTier === 'final' ? 2.5 : 2.1, tierStyle.gem, tierStyle.accent);
        } else if (tierStyle.material === 'metal') {
            fillPolygon(context, [
                { x: 0, y: panelTop + 2 },
                { x: 4, y: panelTop + 5 },
                { x: 4, y: panelTop + 10 },
                { x: 0, y: panelTop + 13 },
                { x: -4, y: panelTop + 10 },
                { x: -4, y: panelTop + 5 }
            ], tierStyle.trim);
            context.fillStyle = tierStyle.trimShadow;
            context.fillRect(-1, panelTop + 6, 2, 5);
        } else {
            context.fillStyle = tierStyle.trim;
            context.fillRect(-3, panelTop + 2, 6, 10);
            context.fillStyle = tierStyle.trimShadow;
            context.beginPath();
            context.arc(0, panelTop + 5, 2.1, Math.PI, 0, false);
            context.fill();
            context.fillRect(-1, panelTop + 5, 2, 5);
        }

        if (tierStyle.vines) {
            context.fillStyle = 'rgba(86, 121, 67, 0.92)';
            fillPolygon(context, [
                { x: -(halfWidth + 3), y: panelTop + 2 },
                { x: -(halfWidth - 1), y: panelTop - 1 },
                { x: -(halfWidth - 2), y: panelTop + 5 }
            ], context.fillStyle);
            fillPolygon(context, [
                { x: halfWidth + 3, y: panelTop + 4 },
                { x: halfWidth - 1, y: panelTop + 1 },
                { x: halfWidth, y: panelTop + 8 }
            ], context.fillStyle);
            context.fillRect(-(halfWidth + 2), panelTop + 5, 2, 6);
            context.fillRect(halfWidth, panelTop + 6, 2, 5);
        }

        if (tierStyle.runes) {
            drawGem(context, 0, lidPeakY + 5, 2.8, tierStyle.gem, tierStyle.accent);
            context.fillStyle = tierStyle.gem;
            context.fillRect(-12, bodyTop + 7, 3, 1.7);
            context.fillRect(-10.5, bodyTop + 5.5, 1.2, 5);
            context.fillRect(9, bodyTop + 7, 3, 1.7);
            context.fillRect(10.2, bodyTop + 5.5, 1.2, 5);
        }

        if (tierStyle.gems > 0) {
            for (let gemIndex = 0; gemIndex < tierStyle.gems; gemIndex++) {
                const progress = tierStyle.gems === 1 ? 0.5 : gemIndex / (tierStyle.gems - 1);
                const x = -(halfWidth - 5) + progress * Math.max(0, tierStyle.width - 10);
                const y = gemIndex % 2 === 0 ? lidBaseY - 2 : lidPeakY + 3;
                drawGem(
                    context,
                    x,
                    y,
                    chestTier === 'final' ? 2.4 : 2,
                    tierStyle.gem,
                    tierStyle.accent
                );
            }
        }

        if (resolved) {
            context.fillStyle = 'rgba(214, 214, 214, 0.34)';
            traceChestBody(context, halfWidth, bodyTop, bodyBottom, tierStyle.shoulderInset);
            context.fill();
            traceChestLid(
                context,
                halfWidth,
                bodyTop,
                lidBaseY,
                lidPeakY,
                tierStyle.lidOverhang,
                tierStyle.material === 'gold' ? 5 : 4
            );
            context.fill();
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

    function drawIslandOriginalNpc(screenX, baseY, interaction, resolved) {
        const context = window.Game.ctx;
        const expedition = interaction && interaction.expedition ? interaction.expedition : {};
        const role = expedition.visualRole || 'wanderer';
        const palette = {
            fisher: { coat: '#3d7fb1', trim: '#9ed7ff', prop: '#8a6a3e', accent: '#ffd36f' },
            bridgewright: { coat: '#7b5a35', trim: '#d7b37a', prop: '#b88a52', accent: '#8fd5ff' },
            herbalist: { coat: '#557a41', trim: '#c4e59d', prop: '#86c66c', accent: '#f4da75' },
            storyteller: { coat: '#6a476f', trim: '#e2b7ff', prop: '#d4b36e', accent: '#9fe7ff' },
            ferryman: { coat: '#355d7b', trim: '#b7dff7', prop: '#b68855', accent: '#f7d78c' },
            cook: { coat: '#8b5633', trim: '#ffd59c', prop: '#d8b972', accent: '#ff996c' },
            leatherworker: { coat: '#72503c', trim: '#dfc29a', prop: '#b7865c', accent: '#9fe88a' },
            quartermaster: { coat: '#586876', trim: '#d2e5f2', prop: '#c7a665', accent: '#ffe17c' },
            watcher: { coat: '#49566d', trim: '#d6deef', prop: '#d6c074', accent: '#9fe7ff' },
            junker: { coat: '#6c5f4d', trim: '#d0c2a0', prop: '#9c8667', accent: '#ffb572' },
            beekeeper: { coat: '#826b2b', trim: '#ffe48a', prop: '#a57f3a', accent: '#fff0a8' },
            cartographer: { coat: '#5e6b4b', trim: '#dce9ba', prop: '#d2b37c', accent: '#86d7ff' },
            collector: { coat: '#6a4e2b', trim: '#ffd79b', prop: '#e6c76f', accent: '#8df5da' },
            exchanger: { coat: '#7c4d41', trim: '#ffd2c8', prop: '#dfc16d', accent: '#ffe785' },
            hermit: { coat: '#5c6250', trim: '#dce2cb', prop: '#b59c6c', accent: '#a7d5ff' },
            wanderer: { coat: '#5c5c72', trim: '#d7d7eb', prop: '#bfa372', accent: '#ffe08a' }
        }[role] || {
            coat: '#5c5c72',
            trim: '#d7d7eb',
            prop: '#bfa372',
            accent: '#ffe08a'
        };

        drawShadow(screenX, baseY + 3, 11, 5);

        context.save();
        context.translate(screenX, baseY);

        context.fillStyle = palette.coat;
        context.beginPath();
        context.moveTo(-10, -5);
        context.lineTo(-6, -19);
        context.lineTo(6, -19);
        context.lineTo(10, -5);
        context.lineTo(4, 0);
        context.lineTo(-4, 0);
        context.closePath();
        context.fill();

        context.fillStyle = palette.trim;
        context.fillRect(-2, -18, 4, 14);
        context.fillRect(-8, -5, 16, 2);

        context.fillStyle = '#e5cfb2';
        context.beginPath();
        context.arc(0, -25, 6.5, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = palette.accent;
        context.fillRect(-9, -34, 18, 5);
        context.fillRect(-5, -39, 10, 6);

        context.fillStyle = '#433322';
        context.fillRect(-3, -2, 2.6, 8);
        context.fillRect(0.4, -2, 2.6, 8);

        context.fillStyle = palette.prop;

        if (role === 'fisher' || role === 'ferryman') {
            context.fillRect(9, -28, 2, 26);
            context.strokeStyle = palette.accent;
            context.lineWidth = 1.4;
            context.beginPath();
            context.moveTo(10, -28);
            context.quadraticCurveTo(19, -33, 17, -18);
            context.stroke();
            context.fillStyle = palette.accent;
            context.beginPath();
            context.arc(16, -17, 2.2, 0, Math.PI * 2);
            context.fill();
        } else if (role === 'bridgewright') {
            context.fillRect(9, -17, 9, 5);
            context.fillRect(12, -23, 3, 14);
        } else if (role === 'herbalist' || role === 'beekeeper') {
            context.beginPath();
            context.arc(12, -14, 4, 0, Math.PI * 2);
            context.arc(16, -18, 3, 0, Math.PI * 2);
            context.arc(8, -18, 3, 0, Math.PI * 2);
            context.fill();
        } else if (role === 'storyteller' || role === 'cartographer') {
            context.fillRect(10, -18, 9, 12);
            context.fillStyle = palette.trim;
            context.fillRect(12, -16, 5, 8);
        } else if (role === 'collector' || role === 'exchanger') {
            context.beginPath();
            context.arc(14, -14, 4.2, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = palette.accent;
            context.beginPath();
            context.arc(14, -14, 1.7, 0, Math.PI * 2);
            context.fill();
        } else if (role === 'quartermaster' || role === 'watcher') {
            context.fillRect(10, -19, 7, 11);
            context.fillStyle = palette.accent;
            context.fillRect(12, -17, 3, 7);
        } else if (role === 'junker' || role === 'leatherworker') {
            context.fillRect(10, -16, 8, 8);
            context.beginPath();
            context.arc(9, -10, 3, 0, Math.PI * 2);
            context.fill();
        } else if (role === 'cook') {
            context.beginPath();
            context.arc(14, -13, 4.5, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = palette.trim;
            context.lineWidth = 1.2;
            context.beginPath();
            context.moveTo(18, -18);
            context.lineTo(21, -22);
            context.stroke();
        } else if (role === 'hermit') {
            context.fillRect(10, -25, 2, 24);
            context.fillStyle = palette.accent;
            context.beginPath();
            context.arc(11, -27, 3.5, 0, Math.PI * 2);
            context.fill();
        }

        if (resolved) {
            context.fillStyle = 'rgba(205, 205, 205, 0.38)';
            context.fillRect(-18, -42, 38, 46);
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

        if (interaction.kind === 'islandOriginalNpc') {
            drawIslandOriginalNpc(screenX, baseY, interaction, resolved);
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
