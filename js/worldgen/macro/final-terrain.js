(() => {
    const macro = window.Game.systems.worldgenMacro;
    const QUANTUM = 0.000001;
    const SCALE = 'normalized_macro_elevation_offset_from_sea_level';
    const LAND_FORMS = ['water', 'coastal_lowland', 'lowland', 'plain', 'hill', 'plateau', 'mountain', 'basin', 'incised_valley', 'slope'];
    const SEA_FORMS = ['land', 'inland_water', 'shelf', 'continental_slope', 'open_basin', 'deep_basin', 'submarine_ridge', 'volcanic_flank'];
    const SURFACE_ORIGINS = ['original', 'cleanup_submergence', 'cleanup_fill', 'marine_carving', 'marine_accretion'];
    const round = value => Math.round(value * 1e6) / 1e6;

    function distances(width, land, seedCell, allowEdge) {
        const distance = new Int32Array(land.length).fill(-1);
        const source = new Int32Array(land.length).fill(-1);
        const queue = new Int32Array(land.length);
        let tail = 0;
        for (let cell = 0; cell < land.length; cell += 1) {
            if (!seedCell(cell)) continue;
            distance[cell] = 0;
            source[cell] = cell;
            queue[tail++] = cell;
        }
        for (let cursor = 0; cursor < tail; cursor += 1) {
            const cell = queue[cursor];
            macro.forEachCardinalNeighbor(cell, width, land.length, neighbor => {
                if (distance[neighbor] >= 0 || !allowEdge(cell, neighbor)) return;
                source[neighbor] = source[cell];
                distance[neighbor] = distance[cell] + 1;
                queue[tail++] = neighbor;
            });
        }
        return { distance, source };
    }

    function describeSurface(width, source, clean, final) {
        const land = final.values.map(value => Number(value >= final.threshold));
        const { distance, source: donor } = distances(width, land,
            cell => Number(source[cell] > 0) === land[cell], (a, b) => land[a] === land[b]);
        const origins = new Array(land.length);
        const signed = source.map((value, cell) => {
            const isLand = land[cell];
            const cleanLand = Number(clean.values[cell] >= clean.threshold);
            const originalLand = Number(value > 0);
            origins[cell] = 0;
            if (originalLand === isLand) return isLand ? value : Math.min(-QUANTUM, value);
            origins[cell] = cleanLand === isLand ? (isLand ? 2 : 1) : (isLand ? 4 : 3);
            // Carry the closest unchanged bank/bed into the modified cells, tapering
            // with distance. The old crossing bounds the change close to the shore.
            const donorMagnitude = donor[cell] < 0 ? 0 : Math.abs(source[donor[cell]]) / (1 + distance[cell]);
            const magnitude = Math.max(QUANTUM, round(Math.min(Math.abs(value), donorMagnitude)));
            return isLand ? magnitude : -magnitude;
        });
        return { land, signed, origins };
    }

    function sampleShape(cell, width, height, signed, land) {
        const x = cell % width;
        const y = Math.floor(cell / width);
        const center = signed[cell];
        let min = center;
        let max = center;
        let mean = 0;
        let count = 0;
        let slope = 0;
        for (let dy = -2; dy <= 2; dy += 1) {
            for (let dx = -2; dx <= 2; dx += 1) {
                if ((!dx && !dy) || x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) continue;
                const sample = cell + dx + dy * width;
                if (land[sample] !== land[cell]) continue;
                const value = signed[sample];
                min = Math.min(min, value);
                max = Math.max(max, value);
                mean += value;
                count += 1;
                if (Math.abs(dx) + Math.abs(dy) === 1) slope = Math.max(slope, Math.abs(center - value));
            }
        }
        return { slope, relief: max - min, position: count ? center - mean / count : 0 };
    }

    function landForm(elevation, distance, shape, mountain, plateau, depression) {
        const { slope, relief, position } = shape;
        if (elevation >= 0.05 && relief >= 0.027 && (mountain >= 0.52 || elevation >= 0.22)) return 6;
        if (elevation >= 0.065 && relief < 0.037 && plateau >= 0.39) return 5;
        if (position <= -0.009 && relief >= 0.033 && depression >= 0.27) return 8;
        if (position < -0.003 && depression >= 0.38 && slope < 0.02) return 7;
        if (distance <= 3 && elevation <= 0.028 && relief < 0.038) return 1;
        if (slope >= 0.021) return 9;
        if (relief >= 0.024 && position >= 0.001) return 4;
        if (elevation <= 0.045 && relief < 0.027) return 2;
        return 3;
    }

    function oceanForm(depth, distance, shape, isOcean, volcanic, uplift, ridge) {
        const { slope, relief, position } = shape;
        if (!isOcean) return 1;
        if (volcanic && relief >= 0.013) return 7;
        if (distance >= 4 && position >= 0.005 && relief >= 0.018 && (ridge >= 0.25 || uplift >= 0.25)) return 6;
        if (distance <= 9 && depth <= 0.042 && slope <= 0.018) return 2;
        if (distance <= 17 && depth <= 0.15) return 3;
        return depth >= 0.13 ? 5 : 4;
    }

    function buildFinalTerrain(input, finalMask) {
        const relief = input.reliefElevation?.outputs?.fields;
        const tectonics = input.tectonicSkeleton?.outputs?.fields;
        const elevation = relief?.seaLevelAppliedElevationField;
        if (!elevation?.relativeElevationValues) return null;
        const source = elevation.relativeElevationValues;
        const { width, height, values } = finalMask;
        const { land, signed, origins } = describeSurface(width, source, relief.landmassCleanupMaskField, finalMask);
        const { distance: fromLand } = distances(width, land, cell => land[cell], () => true);
        const { distance: fromWater } = distances(width, land, cell => !land[cell], () => true);
        const { distance: fromOcean } = distances(width, land,
            cell => !land[cell] && (cell < width || cell >= width * (height - 1)
                || cell % width === 0 || cell % width === width - 1),
            (a, b) => !land[b]);
        const hotspotUplift = elevation.hotspotUpliftValues || new Array(values.length).fill(0);
        const ridge = tectonics?.ridgeDirectionField;
        const slope = new Array(values.length);
        const localRelief = new Array(values.length);
        const landForms = new Array(values.length).fill(0);
        const seaForms = new Array(values.length).fill(0);
        for (let cell = 0; cell < values.length; cell += 1) {
            const shape = sampleShape(cell, width, height, signed, land);
            slope[cell] = round(shape.slope);
            localRelief[cell] = round(shape.relief);
            if (land[cell]) {
                landForms[cell] = landForm(signed[cell], fromWater[cell], shape,
                    relief.mountainAmplificationField?.values[cell] || 0,
                    relief.plateauCandidateField?.values[cell] || 0,
                    relief.basinDepressionField?.values[cell] || 0);
            } else {
                seaForms[cell] = oceanForm(-signed[cell], fromLand[cell], shape, fromOcean[cell] >= 0,
                    hotspotUplift[cell] > 0.006,
                    tectonics?.upliftField?.values[cell] || 0,
                    ridge ? Math.hypot(ridge.xValues[cell], ridge.yValues[cell]) : 0);
            }
        }
        const encode = (fieldId, values, range, valueEncoding, sourceFieldIds) => ({
            fieldId, width, height, values, range, valueEncoding, sourceFieldIds
        });
        return {
            preMarineRelativeElevationField: encode('preMarineRelativeElevationField', source, [-1, 1], SCALE,
                [elevation.fieldId]),
            offshoreHotspotUpliftField: encode('offshoreHotspotUpliftField', hotspotUplift, [0, 1],
                'normalized_macro_elevation_change_from_hotspot_uplift', ['preMarineRelativeElevationField']),
            finalRelativeElevationField: encode('finalRelativeElevationField', signed, [-1, 1], SCALE,
                ['preMarineRelativeElevationField', relief.landmassCleanupMaskField.fieldId, finalMask.fieldId]),
            finalSurfaceOriginField: encode('finalSurfaceOriginField', origins, [0, SURFACE_ORIGINS.length - 1],
                SURFACE_ORIGINS, ['preMarineRelativeElevationField', relief.landmassCleanupMaskField.fieldId, finalMask.fieldId]),
            finalSurfaceSlopeField: encode('finalSurfaceSlopeField', slope, [0, 1], 'maximum_cardinal_offset_per_cell',
                ['finalRelativeElevationField']),
            finalLocalReliefField: encode('finalLocalReliefField', localRelief, [0, 1], 'same_medium_5_by_5_elevation_span',
                ['finalRelativeElevationField']),
            macroLandformField: encode('macroLandformField', landForms, [0, LAND_FORMS.length - 1], LAND_FORMS,
                ['finalRelativeElevationField', 'finalSurfaceSlopeField', 'finalLocalReliefField',
                    'mountainAmplificationField', 'plateauCandidateField', 'basinDepressionField']),
            macroSeafloorFormField: encode('macroSeafloorFormField', seaForms, [0, SEA_FORMS.length - 1], SEA_FORMS,
                ['finalRelativeElevationField', 'finalSurfaceSlopeField', 'finalLocalReliefField', finalMask.fieldId,
                    'upliftField', 'ridgeDirectionField', 'offshoreHotspotUpliftField'])
        };
    }

    macro.buildFinalTerrain = buildFinalTerrain;
})();
