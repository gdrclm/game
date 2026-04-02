(() => {
    const game = window.Game;
    const interactionRouter = game.systems.interactionRouter = game.systems.interactionRouter || {};

    function getShared() {
        return game.systems.interactionShared || {};
    }

    function tileKey(x, y) {
        const shared = getShared();
        return typeof shared.tileKey === 'function'
            ? shared.tileKey(x, y)
            : `${x},${y}`;
    }

    function isGroundItemInteraction(interaction) {
        const shared = getShared();
        return typeof shared.isGroundItemInteraction === 'function'
            ? shared.isGroundItemInteraction(interaction)
            : Boolean(interaction && interaction.kind === 'groundItem');
    }

    function getInteractionAtChunkTile(chunk, localX, localY) {
        if (!chunk) {
            return null;
        }

        if (chunk.interactionTileMap instanceof Map) {
            return chunk.interactionTileMap.get(tileKey(localX, localY)) || null;
        }

        if (!Array.isArray(chunk.interactions)) {
            return null;
        }

        return chunk.interactions.find((interaction) => interaction.localX === localX && interaction.localY === localY) || null;
    }

    function canReachInteractionFrom(position, interaction) {
        if (!interaction) {
            return false;
        }

        const roundedX = Math.round(position.x);
        const roundedY = Math.round(position.y);
        const dx = Math.abs(roundedX - interaction.worldX);
        const dy = Math.abs(roundedY - interaction.worldY);

        if (Math.max(dx, dy) !== 1) {
            return false;
        }

        const fromInfo = game.systems.world.getTileInfo(roundedX, roundedY, { generateIfMissing: false });
        const interactionInfo = game.systems.world.getTileInfo(
            interaction.worldX,
            interaction.worldY,
            { generateIfMissing: false }
        );

        if (!fromInfo || !interactionInfo) {
            return false;
        }

        if (fromInfo.house || interactionInfo.house) {
            return game.systems.houses.canTraverseBetweenTiles(fromInfo, interactionInfo);
        }

        return true;
    }

    function isAdjacentToInteraction(position, interaction) {
        return canReachInteractionFrom(position, interaction);
    }

    function getAdjacentInteraction(position = game.state.playerPos) {
        const roundedX = Math.round(position.x);
        const roundedY = Math.round(position.y);
        const found = [];

        for (let offsetY = -1; offsetY <= 1; offsetY++) {
            for (let offsetX = -1; offsetX <= 1; offsetX++) {
                if (offsetX === 0 && offsetY === 0) {
                    continue;
                }

                const tileInfo = game.systems.world.getTileInfo(
                    roundedX + offsetX,
                    roundedY + offsetY,
                    { generateIfMissing: false }
                );

                if (
                    tileInfo
                    && tileInfo.interaction
                    && !isGroundItemInteraction(tileInfo.interaction)
                    && canReachInteractionFrom(position, tileInfo.interaction)
                ) {
                    found.push(tileInfo.interaction);
                }
            }
        }

        if (found.length === 0) {
            return null;
        }

        const resolvedMap = game.state.resolvedHouseIds || {};

        found.sort((left, right) => {
            const leftResolvedPenalty = resolvedMap[left.houseId] ? 1 : 0;
            const rightResolvedPenalty = resolvedMap[right.houseId] ? 1 : 0;

            if (leftResolvedPenalty !== rightResolvedPenalty) {
                return leftResolvedPenalty - rightResolvedPenalty;
            }

            const leftDistance = Math.abs(roundedX - left.worldX) + Math.abs(roundedY - left.worldY);
            const rightDistance = Math.abs(roundedX - right.worldX) + Math.abs(roundedY - right.worldY);

            return leftDistance - rightDistance || left.renderDepth - right.renderDepth;
        });

        return found[0] || null;
    }

    function getInteractionAtWorld(x, y, options = {}) {
        const tileInfo = game.systems.world.getTileInfo(x, y, options);
        return tileInfo ? tileInfo.interaction || null : null;
    }

    function getGroundItemAtWorld(x, y, options = {}) {
        const interaction = getInteractionAtWorld(x, y, options);
        return isGroundItemInteraction(interaction) ? interaction : null;
    }

    function resolveHouseClickTarget(startX, startY, targetX, targetY) {
        const startInfo = game.systems.world.getTileInfo(startX, startY, { generateIfMissing: false });
        const targetInfo = game.systems.world.getTileInfo(targetX, targetY, { generateIfMissing: false });
        const targetHouse = targetInfo ? targetInfo.house : null;

        if (!targetHouse || !targetHouse.door || !targetHouse.door.worldInside) {
            return null;
        }

        const isAlreadyInsideTargetHouse = Boolean(
            startInfo
            && startInfo.house
            && startInfo.house.id === targetHouse.id
        );

        if (isAlreadyInsideTargetHouse) {
            return null;
        }

        return {
            x: targetHouse.door.worldInside.x,
            y: targetHouse.door.worldInside.y
        };
    }

    function resolveClickTarget(startX, startY, targetX, targetY) {
        const houseTarget = resolveHouseClickTarget(startX, startY, targetX, targetY);

        if (houseTarget) {
            return houseTarget;
        }

        const interaction = getInteractionAtWorld(targetX, targetY);

        if (!interaction || isGroundItemInteraction(interaction)) {
            return { x: targetX, y: targetY };
        }

        let best = null;

        for (let offsetY = -1; offsetY <= 1; offsetY++) {
            for (let offsetX = -1; offsetX <= 1; offsetX++) {
                if (offsetX === 0 && offsetY === 0) {
                    continue;
                }

                const candidateX = interaction.worldX + offsetX;
                const candidateY = interaction.worldY + offsetY;
                const tileInfo = game.systems.world.getTileInfo(candidateX, candidateY, { generateIfMissing: false });

                if (!tileInfo || !game.systems.content.isPassableTile(tileInfo.tileType) || tileInfo.interaction) {
                    continue;
                }

                if (!canReachInteractionFrom({ x: candidateX, y: candidateY }, interaction)) {
                    continue;
                }

                const pathResult = game.systems.pathfinding.findPathResult(startX, startY, candidateX, candidateY);

                if (pathResult.path.length === 0) {
                    continue;
                }

                if (
                    !best
                    || pathResult.totalCost < best.totalCost
                    || (
                        Math.abs(pathResult.totalCost - best.totalCost) < 0.001
                        && pathResult.path.length < best.pathLength
                    )
                ) {
                    best = {
                        x: candidateX,
                        y: candidateY,
                        pathLength: pathResult.path.length,
                        totalCost: pathResult.totalCost
                    };
                }
            }
        }

        return best ? { x: best.x, y: best.y } : { x: targetX, y: targetY };
    }

    Object.assign(interactionRouter, {
        getInteractionAtChunkTile,
        getInteractionAtWorld,
        getGroundItemAtWorld,
        getAdjacentInteraction,
        isAdjacentToInteraction,
        resolveClickTarget
    });

    const interactions = game.systems.interactions = game.systems.interactions || {};
    Object.assign(interactions, {
        router: interactionRouter,
        getInteractionAtChunkTile,
        getInteractionAtWorld,
        getGroundItemAtWorld,
        getAdjacentInteraction,
        isAdjacentToInteraction,
        resolveClickTarget
    });
})();
