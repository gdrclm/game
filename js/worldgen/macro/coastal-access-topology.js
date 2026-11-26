(() => {
    const macro = window.Game.systems.worldgenMacro;

    function forEachCardinalNeighbor(index, width, size, visit) {
        const x = index % width;
        if (x > 0) visit(index - 1);
        if (x < width - 1) visit(index + 1);
        if (index >= width) visit(index - width);
        if (index + width < size) visit(index + width);
    }

    function cellPoint(index, width) {
        return { x: index % width, y: Math.floor(index / width) };
    }

    function cellDistance(left, right, width) {
        return Math.hypot(left % width - right % width, Math.floor(left / width) - Math.floor(right / width));
    }

    function selectPorts(component, context, limit, favoredCell = -1) {
        const { width, height, accessibleWater, seaByCell, opportunity, landContinentByCell, reliefByCell, profileByCluster,
            selectedWaterCells } = context;
        const scale = Math.min(width, height);
        const candidatesByWaterCell = new Map();
        for (const landCellIndex of component.cells) {
            forEachCardinalNeighbor(landCellIndex, width, accessibleWater.length, waterCellIndex => {
                const sea = seaByCell[waterCellIndex];
                if (!accessibleWater[waterCellIndex] || !sea?.touchesWorldEdge || candidatesByWaterCell.has(waterCellIndex)) return;
                const score = opportunity?.[waterCellIndex] || 0;
                // Physical landfall and open-water access also support a modest landing.
                // The local opportunity field ranks candidates on the same coast.
                const proximity = favoredCell < 0 ? 0 : 1 / (1 + cellDistance(waterCellIndex, favoredCell, width) / scale);
                candidatesByWaterCell.set(waterCellIndex, { landCellIndex, waterCellIndex, sea, score, rank: score + proximity * 0.28 });
            });
        }
        const ranked = [...candidatesByWaterCell.values()].sort((a, b) => b.rank - a.rank || a.waterCellIndex - b.waterCellIndex);
        const ports = [];
        for (const candidate of ranked) {
            if (ports.length >= limit) break;
            if (ports.some(port => cellDistance(port.waterCellIndex, candidate.waterCellIndex, width) < scale * 0.13)) continue;
            const { sea, score, landCellIndex, waterCellIndex } = candidate;
            const profile = profileByCluster.get(sea.seaRegionClusterId) || {};
            const anchorPoint = cellPoint(landCellIndex, width);
            // A one-cell channel can carry landfalls on both banks. Their land
            // anchors remain distinct even if they start at the same water cell.
            const coastalNodeId = selectedWaterCells.has(waterCellIndex)
                ? `coastal_access_${waterCellIndex}_${landCellIndex}`
                : `coastal_access_${waterCellIndex}`;
            selectedWaterCells.add(waterCellIndex);
            ports.push({
                coastalNodeId,
                selectionMode: 'local_open_water_access',
                continentId: landContinentByCell[landCellIndex] || component.continentId || '',
                seaRegionClusterId: sea.seaRegionClusterId,
                seaRegionId: sea.recordDraft.seaRegionId,
                sourceBasinId: sea.sourceBasinId,
                basinType: sea.basinType,
                islandId: component.islandId || '',
                islandGroupId: component.islandGroupId || '',
                reliefRegionId: reliefByCell[landCellIndex] || component.reliefRegionId || '',
                anchorCellIndex: landCellIndex,
                landCellIndex,
                waterCellIndex,
                anchorPoint,
                normalizedAnchorPoint: { x: anchorPoint.x / (width - 1), y: anchorPoint.y / (height - 1) },
                coastalOpportunityScore: score,
                exceptionalityScore: score,
                exceptionalityClass: 'local_landfall',
                harborQualityScore: profile.harborQualityScore || 0,
                landingEaseScore: profile.landingEaseScore || 0,
                fishingPotentialScore: profile.fishingPotentialScore || 0,
                shoreDefenseScore: profile.shoreDefenseScore || 0,
                inlandLinkBonusScore: profile.inlandLinkBonusScore || 0
            });
        }
        return ports;
    }

    function findApproachShorelines(mainlands, islands, context) {
        const { width, height, values, seaByCell } = context;
        const reach = Math.min(width, height) * 0.13;
        const islandsBounds = islands.map(({ cellIndices }) => {
            const points = cellIndices.map(cell => cellPoint(cell, width));
            return {
                minX: Math.min(...points.map(point => point.x)) - reach,
                maxX: Math.max(...points.map(point => point.x)) + reach,
                minY: Math.min(...points.map(point => point.y)) - reach,
                maxY: Math.max(...points.map(point => point.y)) + reach
            };
        });
        return mainlands.flatMap(body => {
            const seaRegionByShoreCell = {};
            for (const cell of body.cells) {
                const { x, y } = cellPoint(cell, width);
                if (!islandsBounds.some(bounds => x >= bounds.minX && x <= bounds.maxX
                    && y >= bounds.minY && y <= bounds.maxY)) continue;
                forEachCardinalNeighbor(cell, width, values.length, neighbor => {
                    const sea = seaByCell[neighbor];
                    if (!values[neighbor] && sea?.touchesWorldEdge) seaRegionByShoreCell[cell] ??= sea.recordDraft.seaRegionId;
                });
            }
            const shoreCellIndices = Object.keys(seaRegionByShoreCell).map(Number);
            return shoreCellIndices.length ? [{ continentId: body.continentId, shoreCellIndices, seaRegionByShoreCell }] : [];
        });
    }

    function buildCoastalAccessTopology({ mask, continentBodies, seaClusters, coastalOpportunity, clusterProfiles, hotspotChain, reliefRegionBodies }) {
        if (!mask?.values?.length || mask.width < 2 || mask.height < 2 || !continentBodies?.length || !seaClusters?.length) return null;
        const { width, height } = mask;
        const values = mask.values.map(value => Number(value >= mask.threshold));
        const accessibleWater = new Uint8Array(values.length);
        for (let cell = 0; cell < values.length; cell += 1) {
            if (values[cell]) continue;
            forEachCardinalNeighbor(cell, width, values.length, neighbor => {
                if (!values[neighbor]) accessibleWater[cell] = 1;
            });
        }
        const bodies = macro.collectLandWaterComponents(values, width, height, 1);
        const landByCell = [];
        const landContinentByCell = [];
        const seaByCell = [];
        const reliefByCell = [];
        const ports = [];
        for (const body of bodies) {
            for (const cell of body.cells) landByCell[cell] = body;
        }
        for (const { recordDraft, cellIndices } of continentBodies) {
            for (const cell of cellIndices) landContinentByCell[cell] = recordDraft.continentId;
        }
        for (const sea of seaClusters) {
            for (const cell of sea.cellIndices) seaByCell[cell] = sea;
        }
        for (const region of reliefRegionBodies) {
            for (const cell of region.cellIndices) reliefByCell[cell] = region.reliefRegionId;
        }
        const context = {
            width, height, values, accessibleWater, seaByCell, landContinentByCell, reliefByCell,
            opportunity: coastalOpportunity?.values,
            selectedWaterCells: new Set(),
            profileByCluster: new Map(clusterProfiles.map(profile => [profile.seaRegionClusterId, profile]))
        };

        const mainlandById = new Map();
        for (const body of bodies) {
            const counts = new Map();
            for (const cell of body.cells) {
                const continentId = landContinentByCell[cell];
                if (continentId) counts.set(continentId, (counts.get(continentId) || 0) + 1);
            }
            const [primary] = [...counts].sort((a, b) => b[1] - a[1]);
            if (!primary || (mainlandById.get(primary[0])?.cellCount || 0) >= body.cellCount) continue;
            mainlandById.set(primary[0], { ...body, continentId: primary[0] });
        }
        for (const mainland of mainlandById.values()) ports.push(...selectPorts(mainland, context, 3));

        const used = new Set();
        const islands = [];
        const peaks = hotspotChain?.peaks || [];
        for (const peak of peaks) {
            const land = landByCell[peak.cellIndex];
            if (!land || land.cellCount < 7 || used.has(land) || land.cells.some(cell => landContinentByCell[cell])) continue;
            const islandId = `offshore_island_${peak.cellIndex}`;
            const islandGroupId = `offshore_chain_${hotspotChain.hotspotSeedId}`;
            const reliefRegionId = reliefByCell[peak.cellIndex];
            if (!reliefRegionId) continue;
            const island = { islandId, islandGroupId, reliefRegionId, peakCellIndex: peak.cellIndex, cellIndices: land.cells };
            const neighborPeak = peaks.find(other => other.driftStep === peak.driftStep + 1)
                || peaks.find(other => other.driftStep === peak.driftStep - 1);
            const [port] = selectPorts({ ...land, islandId, islandGroupId, reliefRegionId }, context, 1, neighborPeak?.cellIndex);
            if (!port) continue;
            ports.push(port);
            islands.push({ ...island, portId: port.coastalNodeId, seaRegionId: port.seaRegionId, sourceBasinId: port.sourceBasinId });
            used.add(land);
        }

        return {
            outputId: 'coastalAccessTopology',
            sourceMaskFieldId: mask.fieldId,
            worldBounds: { width, height },
            ports,
            islands,
            approachShorelines: findApproachShorelines([...mainlandById.values()], islands, context),
            islandGroupId: islands.length >= 2 ? islands[0].islandGroupId : null,
            sourceHotspotSeedId: hotspotChain?.hotspotSeedId || null,
            summary: {
                continentPortCount: ports.length - islands.length,
                islandPortCount: islands.length,
                unsupportedHotspotPeakCount: peaks.length - islands.length
            }
        };
    }

    Object.assign(macro, { buildCoastalAccessTopology, forEachCardinalNeighbor, cellPoint, cellDistance });
})();
