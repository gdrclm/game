(() => {
    const macro = window.Game.systems.worldgenMacro;

    function visitNeighbors(index, width, size, visit) {
        const x = index % width;
        if (x > 0) visit(index - 1);
        if (x < width - 1) visit(index + 1);
        if (index >= width) visit(index - width);
        if (index + width < size) visit(index + width);
    }

    function distanceFromLand(land, width) {
        const distance = new Int32Array(land.length).fill(-1);
        const queue = [];
        for (let index = 0; index < land.length; index += 1) {
            if (land[index]) {
                queue.push(index);
                distance[index] = 0;
            }
        }
        for (let cursor = 0; cursor < queue.length; cursor += 1) {
            const index = queue[cursor];
            visitNeighbors(index, width, land.length, neighbor => {
                if (distance[neighbor] < 0) {
                    distance[neighbor] = distance[index] + 1;
                    queue.push(neighbor);
                }
            });
        }
        return distance;
    }

    function locateHotspotPeaks(hotspots, bounds, openWater, distance, elevation, cutoff) {
        const { width, height } = bounds;
        const scale = Math.min(width, height);
        const tracks = [];
        for (const hotspot of hotspots) {
            if (hotspot.sourcePlateClass === 'continental') continue;
            const { seedPoint, trailVector, hotspotStrength } = hotspot;
            const baseRadius = scale * (0.031 + hotspotStrength * 0.025);
            const spacing = scale * (0.079 + hotspot.sourceSignals.motionMagnitude * 0.04);
            // A plume can emerge on either flank of its drift line. Keep the search
            // within the plate-scale trail envelope, favoring less offset and shallower crust.
            for (const offset of [0, -0.08, 0.08, -0.16, 0.16, -0.24, 0.24]) {
                let run = [];
                for (let step = -4; step <= 4; step += 1) {
                    const x = Math.round(seedPoint.x + trailVector.x * step * spacing - trailVector.y * offset * scale);
                    const y = Math.round(seedPoint.y + trailVector.y * step * spacing + trailVector.x * offset * scale);
                    const radius = baseRadius * (1 - Math.abs(step) * 0.07);
                    const cellIndex = y * width + x;
                    const margin = Math.ceil(radius + 2);
                    const eligible = x >= margin && y >= margin && x < width - margin && y < height - margin
                        && openWater[cellIndex] && distance[cellIndex] >= margin
                        && distance[cellIndex] <= scale * 0.58;
                    if (eligible) {
                        const waterDepth = cutoff - elevation[cellIndex];
                        run.push({ x, y, cellIndex, radius, driftStep: step, waterDepth });
                        continue;
                    }
                    if (run.length >= 3) tracks.push({ hotspot, offset, peaks: run });
                    run = [];
                }
                if (run.length >= 3) tracks.push({ hotspot, offset, peaks: run });
            }
        }

        for (const track of tracks) {
            const depth = track.peaks.reduce((sum, peak) => sum + peak.waterDepth, 0) / track.peaks.length;
            const driftOffset = Math.min(...track.peaks.map(peak => Math.abs(peak.driftStep)));
            track.support = track.hotspot.hotspotStrength - depth * 0.6 - driftOffset * 0.025 - Math.abs(track.offset) * 0.32;
        }
        return tracks.sort((a, b) => b.support - a.support);
    }

    function raiseOffshoreHotspotChain(elevation, shoreline, bounds, hotspotSeeds, collectComponents) {
        if (!hotspotSeeds?.length || Math.min(bounds.width, bounds.height) < 32) {
            return { elevation, hotspotChain: null };
        }
        const { land, cutoff } = shoreline;
        const { width, height } = bounds;
        const distance = distanceFromLand(land, width);
        const openWater = new Uint8Array(land.length);
        collectComponents(land, width, height, 0).filter(body => body.touchesBorder)
            .forEach(body => body.cells.forEach(cell => { openWater[cell] = 1; }));
        const selected = locateHotspotPeaks(hotspotSeeds, bounds, openWater, distance, elevation, cutoff)[0];
        if (!selected) return { elevation, hotspotChain: null };

        const raised = elevation.slice();
        for (const peak of selected.peaks) {
            const { x, y, radius } = peak;
            const extent = Math.ceil(radius);
            for (let localY = y - extent; localY <= y + extent; localY += 1) {
                for (let localX = x - extent; localX <= x + extent; localX += 1) {
                    const index = localY * width + localX;
                    if (!openWater[index] || distance[index] < 2) continue;
                    const radialSupport = 1 - Math.hypot(localX - x, localY - y) / radius;
                    if (radialSupport <= 0) continue;
                    const uplift = (peak.waterDepth + 0.11 + selected.hotspot.hotspotStrength * 0.13)
                        * radialSupport * (2 - radialSupport);
                    raised[index] = Math.min(1, Math.max(raised[index], elevation[index] + uplift));
                }
            }
        }
        return {
            elevation: raised,
            hotspotChain: {
                hotspotSeedId: selected.hotspot.hotspotSeedId,
                sourcePlateId: selected.hotspot.sourcePlateId,
                trailVector: selected.hotspot.trailVector,
                lateralOffset: selected.offset,
                peaks: selected.peaks
            }
        };
    }

    macro.raiseOffshoreHotspotChain = raiseOffshoreHotspotChain;
})();
