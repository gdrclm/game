(() => {
    const macro = window.Game.systems.worldgenMacro;

    function bendHotspotTrack(track, bounds, openWater, distance, elevation, cutoff) {
        const { width, height } = bounds;
        const scale = Math.min(width, height);
        const { trailVector } = track.hotspot;
        const crossTrack = { x: -trailVector.y, y: trailVector.x };
        const statesByStep = [];
        for (const peak of track.peaks) {
            const states = [];
            const maxShift = Math.floor(Math.min(scale * 0.03, peak.radius * 0.7));
            for (let shift = -maxShift; shift <= maxShift; shift += 1) {
                if (Math.abs(track.offset * scale + shift) > scale * 0.24 + 0.00001) continue;
                const x = Math.round(peak.x + crossTrack.x * shift);
                const y = Math.round(peak.y + crossTrack.y * shift);
                const cellIndex = y * width + x;
                const margin = Math.ceil(peak.radius + 2);
                if (x < margin || y < margin || x >= width - margin || y >= height - margin
                    || !openWater[cellIndex] || distance[cellIndex] < margin || distance[cellIndex] > scale * 0.58) continue;
                // Broad shallow support matters more than a single unusually high grid cell.
                const meanCrustElevation = cell => (
                    elevation[cell] * 4 + elevation[cell - 1] + elevation[cell + 1]
                    + elevation[cell - width] + elevation[cell + width]
                ) / 8;
                const crustSupportGain = meanCrustElevation(cellIndex) - meanCrustElevation(peak.cellIndex);
                const candidate = {
                    ...peak, x, y, cellIndex, waterDepth: cutoff - elevation[cellIndex],
                    unbentCellIndex: peak.cellIndex, crossTrackShift: shift, crustSupportGain
                };
                const support = crustSupportGain - 0.0006 * shift ** 2;
                const previousStates = statesByStep.at(-1);
                if (!previousStates) {
                    states.push({ support, path: [candidate] });
                    continue;
                }
                let best = null;
                for (const previous of previousStates) {
                    const change = shift - previous.path.at(-1).crossTrackShift;
                    if (Math.abs(change) > 2) continue;
                    const continuitySupport = previous.support + support - 0.0015 * change ** 2;
                    if (!best || continuitySupport > best.support) {
                        best = { support: continuitySupport, path: [...previous.path, candidate] };
                    }
                }
                if (best) states.push(best);
            }
            statesByStep.push(states);
        }
        const [selected] = statesByStep.at(-1).sort((a, b) => b.support - a.support);
        return selected.support > 0 ? selected.path : track.peaks;
    }

    macro.bendHotspotTrack = bendHotspotTrack;
})();
