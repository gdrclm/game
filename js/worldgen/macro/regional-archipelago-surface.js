(() => {
    const macro = window.Game.systems.worldgenMacro;
    const SUBDIVISION = 8;
    const COASTAL_ACTION_RANGE = 0.057;
    const ELEVATION_ENCODING = 'float32-le-base64';

    function encodeRegionalElevation(signed) {
        const bytes = new Uint8Array(signed.length * Float32Array.BYTES_PER_ELEMENT);
        const view = new DataView(bytes.buffer);
        for (let cell = 0; cell < signed.length; cell += 1) view.setFloat32(cell * 4, signed[cell], true);
        const pieces = [];
        const chunk = 16384;
        for (let offset = 0; offset < bytes.length; offset += chunk) {
            pieces.push(String.fromCharCode(...bytes.subarray(offset, offset + chunk)));
        }
        return { encoding: ELEVATION_ENCODING, samplesBase64: btoa(pieces.join('')) };
    }

    function decodeRegionalElevation(regional) {
        const raster = regional?.elevationRaster;
        const size = regional?.grid?.width * regional?.grid?.height;
        const byteCount = size * Float32Array.BYTES_PER_ELEMENT;
        if (raster?.encoding !== ELEVATION_ENCODING || !Number.isSafeInteger(byteCount) || byteCount <= 0
            || typeof raster.samplesBase64 !== 'string' || raster.samplesBase64.length !== Math.ceil(byteCount / 3) * 4) return null;
        let bytes;
        try {
            bytes = atob(raster.samplesBase64);
        } catch {
            return null;
        }
        if (bytes.length !== byteCount) return null;
        const buffer = Uint8Array.from(bytes, byte => byte.charCodeAt(0));
        const view = new DataView(buffer.buffer);
        const signed = new Float32Array(size);
        for (let cell = 0; cell < size; cell += 1) signed[cell] = view.getFloat32(cell * 4, true);
        return signed.every(Number.isFinite) ? signed : null;
    }

    function sample(values, width, height, x, y) {
        const left = Math.max(0, Math.min(width - 1, Math.floor(x)));
        const top = Math.max(0, Math.min(height - 1, Math.floor(y)));
        const right = Math.min(width - 1, left + 1);
        const bottom = Math.min(height - 1, top + 1);
        const dx = Math.max(0, Math.min(1, x - left));
        const dy = Math.max(0, Math.min(1, y - top));
        return (values[top * width + left] * (1 - dx) + values[top * width + right] * dx) * (1 - dy)
            + (values[bottom * width + left] * (1 - dx) + values[bottom * width + right] * dx) * dy;
    }

    function monotoneTangent(left, right) {
        // Flat or turning samples have a horizontal tangent. On monotone
        // runs the harmonic mean limits the steeper neighboring slope.
        return left * right > 0 ? 2 * left * right / (left + right) : 0;
    }

    function sampleMonotone(previous, left, right, next, fraction) {
        if (fraction === 0) return left;
        const slope = right - left;
        const from = monotoneTangent(left - previous, slope);
        const to = monotoneTangent(slope, next - right);
        const quadratic = 3 * slope - 2 * from - to;
        const cubic = from + to - 2 * slope;
        return left + fraction * (from + fraction * (quadratic + fraction * cubic));
    }

    function createDirectionalBedSampler(bed, grid) {
        const { width, height, values } = bed;
        const rows = new Float64Array(grid.width * height);
        for (let column = 0; column < grid.width; column += 1) {
            const x = grid.originX + column / grid.subdivision;
            const left = Math.floor(x);
            const right = Math.min(width - 1, left + 1);
            const previous = Math.max(0, left - 1);
            const next = Math.min(width - 1, right + 1);
            for (let row = 0; row < height; row += 1) {
                const offset = row * width;
                rows[row * grid.width + column] = sampleMonotone(values[offset + previous], values[offset + left],
                    values[offset + right], values[offset + next], x - left);
            }
        }
        return (column, y) => {
            const top = Math.floor(y);
            const bottom = Math.min(height - 1, top + 1);
            return sampleMonotone(rows[Math.max(0, top - 1) * grid.width + column], rows[top * grid.width + column],
                rows[bottom * grid.width + column], rows[Math.min(height - 1, bottom + 1) * grid.width + column], y - top);
        };
    }

    function createRegionalBedSampler(bed, grid) {
        const { width, height, values } = bed;
        const transposed = new Float64Array(values.length);
        for (let row = 0; row < height; row += 1) {
            for (let column = 0; column < width; column += 1) {
                transposed[column * height + row] = values[row * width + column];
            }
        }
        const horizontalFirst = createDirectionalBedSampler(bed, grid);
        const verticalFirst = createDirectionalBedSampler({ width: height, height: width, values: transposed },
            { width: grid.height, originX: grid.originY, subdivision: grid.subdivision });
        // Both reconstructions stay within the four parent heights. Averaging
        // removes the axis preference of applying the limiter in one order.
        return (row, column, x, y) => (horizontalFirst(column, y) + verticalFirst(row, x)) / 2;
    }

    function inlandInfluence(height) {
        const fraction = Math.max(0, Math.min(1, (height - COASTAL_ACTION_RANGE) / COASTAL_ACTION_RANGE));
        return fraction * fraction * (3 - 2 * fraction);
    }

    function unitAt(seed, x, y) {
        let value = (seed ^ Math.imul(x + 1, 0x9e3779b1) ^ Math.imul(y + 1, 0x85ebca77)) >>> 0;
        value = Math.imul(value ^ (value >>> 16), 0x7feb352d) >>> 0;
        value = Math.imul(value ^ (value >>> 15), 0x846ca68b) >>> 0;
        return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
    }

    function texture(seed, x, y) {
        const left = Math.floor(x);
        const bottom = Math.floor(y);
        const smooth = fraction => fraction * fraction * (3 - 2 * fraction);
        const dx = smooth(x - left);
        const dy = smooth(y - bottom);
        return (unitAt(seed, left, bottom) * (1 - dx) + unitAt(seed, left + 1, bottom) * dx) * (1 - dy)
            + (unitAt(seed, left, bottom + 1) * (1 - dx) + unitAt(seed, left + 1, bottom + 1) * dx) * dy;
    }

    function regionalBounds(islands, peaks, width, height) {
        let west = width - 1;
        let east = 0;
        let north = height - 1;
        let south = 0;
        for (const island of islands) {
            for (const cell of island.cellIndices) {
                west = Math.min(west, cell % width);
                east = Math.max(east, cell % width);
                north = Math.min(north, Math.floor(cell / width));
                south = Math.max(south, Math.floor(cell / width));
            }
        }
        const margin = Math.ceil(Math.max(...peaks.map(peak => peak.radius)) + 7);
        const x = Math.max(0, west - margin);
        const y = Math.max(0, north - margin);
        return { x, y, east: Math.min(width - 1, east + margin), south: Math.min(height - 1, south + margin) };
    }

    function findVents(bed, hotspot, peaks, seed, bounds) {
        const { width, height, values } = bed;
        const samplesPerCell = 4;
        const sampleWidth = (bounds.east - bounds.x) * samplesPerCell;
        const sampleHeight = (bounds.south - bounds.y) * samplesPerCell;
        const potential = new Float64Array(sampleWidth * sampleHeight);
        const carrier = new Array(potential.length);
        const permeability = new Float64Array(potential.length);
        const coordinate = (origin, index) => origin + (index + 0.5) / samplesPerCell;
        for (let row = 0; row < sampleHeight; row += 1) {
            for (let column = 0; column < sampleWidth; column += 1) {
                const centerX = coordinate(bounds.x, column);
                const centerY = coordinate(bounds.y, row);
                const index = row * sampleWidth + column;
                const base = sample(values, width, height, centerX, centerY);
                let closest = null;
                let radial = Infinity;
                for (const peak of peaks) {
                    const distance = Math.hypot(centerX - peak.x, centerY - peak.y) / peak.radius;
                    if (distance < radial) {
                        closest = peak;
                        radial = distance;
                    }
                }
                if (radial < 0.6 || radial > 1.72 || base >= 0.04) continue;
                const parentUplift = hotspot[closest.cellIndex];
                const crustSupport = Math.max(0, 1 - ((radial - 1) / 0.72) ** 2);
                const feeding = texture(seed ^ 0x3d226ab1, centerX / 0.78, centerY / 0.93);
                // Regional branch vents obtain magma from the resolved edifice.
                // The branch can remain submerged when the same uplift meets deeper crust.
                const rise = parentUplift * crustSupport * (0.14 + 0.54 * feeding ** 2);
                potential[index] = rise;
                carrier[index] = closest;
                permeability[index] = feeding;
            }
        }

        const vents = [];
        for (let row = 1; row < sampleHeight - 1; row += 1) {
            for (let column = 1; column < sampleWidth - 1; column += 1) {
                const index = row * sampleWidth + column;
                const rise = potential[index];
                if (rise <= 0.009) continue;
                const neighbors = [-sampleWidth - 1, -sampleWidth, -sampleWidth + 1, -1, 1, sampleWidth - 1, sampleWidth, sampleWidth + 1];
                if (neighbors.some(offset => potential[index + offset] >= rise)) continue;
                const x = coordinate(bounds.x, column);
                const y = coordinate(bounds.y, row);
                if (rise <= -sample(values, width, height, x, y) * 0.45) continue;
                vents.push({
                    ventId: `regional_vent_${bounds.x * samplesPerCell + column}_${bounds.y * samplesPerCell + row}`,
                    parentPeakCell: carrier[index].cellIndex, x, y, rise,
                    radius: 0.29 + permeability[index] * 0.49
                });
            }
        }
        const resolvedVolume = hotspot.reduce((sum, value) => sum + value, 0);
        const unresolvedVolume = vents.reduce((sum, row) => sum + Math.PI * row.rise * row.radius ** 2 / 2, 0);
        if (unresolvedVolume <= resolvedVolume) return vents;
        return vents.map(vent => ({ ...vent, rise: vent.rise * resolvedVolume / unresolvedVolume }));
    }

    function buildVentRaster(vents, grid) {
        const raster = new Float64Array(grid.width * grid.height);
        const strongest = new Float64Array(raster.length);
        const ventByCell = new Int32Array(raster.length).fill(-1);
        for (const [index, vent] of vents.entries()) {
            const centerX = (vent.x - grid.originX) * grid.subdivision;
            const centerY = (vent.y - grid.originY) * grid.subdivision;
            const radius = vent.radius * grid.subdivision;
            for (let y = Math.max(0, Math.ceil(centerY - radius)); y <= Math.min(grid.height - 1, centerY + radius); y += 1) {
                for (let x = Math.max(0, Math.ceil(centerX - radius)); x <= Math.min(grid.width - 1, centerX + radius); x += 1) {
                    const support = Math.max(0, 1 - Math.hypot(centerX - x, centerY - y) / radius);
                    const cell = y * grid.width + x;
                    const contribution = vent.rise * support * (2 - support);
                    raster[cell] += contribution;
                    if (contribution > strongest[cell]) {
                        strongest[cell] = contribution;
                        ventByCell[cell] = index;
                    }
                }
            }
        }
        return { raster, ventByCell };
    }

    function buildRegionalArchipelagoSurface({ bed, hotspotUplift, fracture, storm, seafloor, topology, chain,
        regionalSeed, waterPaths = [], processScale = 1, scaleByPeak = new Map() }) {
        if (!bed?.values?.length || !topology?.islands?.length || !chain?.peaks?.length) return null;
        const { width, height, values } = bed;
        const bounds = regionalBounds(topology.islands, chain.peaks, width, height);
        const edgeKey = (left, right) => Math.min(left, right) * values.length + Math.max(left, right);
        const waterEdges = new Set();
        for (const path of waterPaths) {
            for (let index = 1; index < path.length; index += 1) {
                waterEdges.add(edgeKey(path[index - 1], path[index]));
            }
        }
        const grid = {
            originX: bounds.x, originY: bounds.y, subdivision: SUBDIVISION,
            width: (bounds.east - bounds.x) * SUBDIVISION + 1,
            height: (bounds.south - bounds.y) * SUBDIVISION + 1
        };
        const size = grid.width * grid.height;
        const vents = processScale > 0 ? findVents(bed, hotspotUplift, chain.peaks, regionalSeed, bounds)
            .map(vent => ({ ...vent, rise: vent.rise * processScale * (scaleByPeak.get(vent.parentPeakCell) ?? 1) }))
            .filter(vent => vent.rise > 0) : [];
        const constrainedPeaks = chain.peaks.filter(peak => scaleByPeak.has(peak.cellIndex));
        const { raster: ventRaster, ventByCell } = buildVentRaster(vents, grid);
        const signed = new Float32Array(size);
        const inherited = new Float32Array(size);
        const mechanisms = new Uint8Array(size);
        const sampleBed = createRegionalBedSampler(bed, grid);
        const coastalBoundary = seafloor ? new Uint8Array(size) : null;
        const trace = chain.trailVector;
        const faultNoise = (x, y) => texture(regionalSeed ^ 0x5e42ff, (x * trace.x + y * trace.y) * 2.4,
            (trace.y * x - trace.x * y) * 4.1);
        const waveNoise = (x, y) => texture(regionalSeed ^ 0x37ad72, x * 3.3, y * 3.3);

        for (let row = 0; row < grid.height; row += 1) {
            for (let column = 0; column < grid.width; column += 1) {
                const fine = row * grid.width + column;
                const x = bounds.x + column / SUBDIVISION;
                const y = bounds.y + row / SUBDIVISION;
                const inheritedBed = sample(values, width, height, x, y);
                let base = inheritedBed;
                // Keep the existing inherited bed wherever fault and wave
                // processes can shape the shoreline, including submerged vents.
                if (inheritedBed > COASTAL_ACTION_RANGE) {
                    const inlandBed = sampleBed(row, column, x, y);
                    base += (inlandBed - inheritedBed) * inlandInfluence(inheritedBed) * inlandInfluence(inlandBed);
                }
                inherited[fine] = base;
                if (coastalBoundary && (row === 0 || row === grid.height - 1 || column === 0 || column === grid.width - 1)) {
                    const parentCell = Math.round(y) * width + Math.round(x);
                    const form = seafloor.valueEncoding[seafloor.values[parentCell]];
                    coastalBoundary[fine] = Number(form !== 'land' && form !== 'inland_water');
                }
                if (row % SUBDIVISION === 0 && column % SUBDIVISION === 0) {
                    signed[fine] = base;
                    continue;
                }
                const left = column - column % SUBDIVISION;
                const top = row - row % SUBDIVISION;
                const dx = (column - left) / SUBDIVISION;
                const dy = (row - top) / SUBDIVISION;
                const interpolate = (a, b, c, d) => (a * (1 - dx) + b * dx) * (1 - dy) + (c * (1 - dx) + d * dx) * dy;
                const residual = (noise) => noise(x, y) - interpolate(
                    noise(Math.floor(x), Math.floor(y)), noise(Math.floor(x) + 1, Math.floor(y)),
                    noise(Math.floor(x), Math.floor(y) + 1), noise(Math.floor(x) + 1, Math.floor(y) + 1)
                );
                const coast = Math.max(0, 1 - Math.abs(base) / COASTAL_ACTION_RANGE);
                // Keep unaffected portions of the chain outside the local
                // restraint used to preserve an inherited water separation.
                const localScale = constrainedPeaks.reduce((scale, peak) => {
                    const distance = Math.hypot(x - peak.x, y - peak.y) / peak.radius;
                    const influence = Math.max(0, Math.min(1, (1.72 - distance) / 0.72));
                    return Math.min(scale, 1 - (1 - scaleByPeak.get(peak.cellIndex)) * influence);
                }, 1) * processScale;
                // Conserve parent elevations by tapering uplift close to shared
                // samples. A volcanic vent contributes no local excavation.
                const distanceToAnchor = Math.hypot(Math.min(dx, 1 - dx), Math.min(dy, 1 - dy));
                const taper = Math.min(1, distanceToAnchor / 0.3);
                const volcanic = ventRaster[fine] * taper * taper * (3 - 2 * taper);
                const fault = localScale * coast * sample(fracture, width, height, x, y) * 0.036 * residual(faultNoise);
                const wave = localScale * coast * (0.15 + sample(storm, width, height, x, y))
                    * 0.022 * Math.max(0, residual(waveNoise));
                const proposed = base + volcanic + fault - wave;
                const macroX = Math.floor(x);
                const macroY = Math.floor(y);
                const northwest = values[macroY * width + macroX];
                const northeast = values[macroY * width + Math.min(width - 1, macroX + 1)];
                const southwest = values[Math.min(height - 1, macroY + 1) * width + macroX];
                const southeast = values[Math.min(height - 1, macroY + 1) * width + Math.min(width - 1, macroX + 1)];
                const parentIndex = macroY * width + macroX;
                const protectedVertical = !dx && ((northwest > 0 && southwest > 0)
                    || waterEdges.has(edgeKey(parentIndex, parentIndex + width)));
                const protectedHorizontal = !dy && ((northwest > 0 && northeast > 0)
                    || waterEdges.has(edgeKey(parentIndex, parentIndex + 1)));
                // Preserve measured macro passages and land connectivity. Other
                // water edges can evolve with their regional coastal geometry.
                if (protectedVertical || protectedHorizontal) {
                    signed[fine] = (base > 0) === (proposed > 0) ? proposed : base;
                } else if (dx === dy && northwest <= 0 && southeast <= 0 && northeast > 0 && southwest > 0) {
                    signed[fine] = Math.min(proposed, northwest * (1 - dx) + southeast * dx);
                    if (base > 0) mechanisms[fine] = 4;
                } else if (dx + dy === 1 && northeast <= 0 && southwest <= 0 && northwest > 0 && southeast > 0) {
                    signed[fine] = Math.min(proposed, northeast * dx + southwest * dy);
                    if (base > 0) mechanisms[fine] = 4;
                } else {
                    signed[fine] = proposed;
                }
                if (mechanisms[fine] === 0 && (signed[fine] > 0) !== (base > 0)) {
                    mechanisms[fine] = Math.abs(volcanic) > Math.max(Math.abs(fault), wave) ? 1
                        : Math.abs(fault) > wave ? 2 : 3;
                }
            }
        }
        return { grid, signed, inherited, mechanisms, vents, ventByCell, coastalBoundary };
    }

    macro.buildRegionalArchipelagoSurface = buildRegionalArchipelagoSurface;
    macro.encodeRegionalElevation = encodeRegionalElevation;
    macro.decodeRegionalElevation = decodeRegionalElevation;
})();
