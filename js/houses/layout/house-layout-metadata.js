(() => {
    const houseLayout = window.Game.systems.houseLayout;
    const footprintLayoutCache = new Map();

    function buildWallSegments(wallRecords, type) {
        const buckets = new Map();

        wallRecords
            .filter((wall) => wall.type === type)
            .forEach((wall) => {
                const bucketKey = type === 'south' ? `${wall.cell.y}` : `${wall.cell.x}`;
                if (!buckets.has(bucketKey)) {
                    buckets.set(bucketKey, []);
                }
                buckets.get(bucketKey).push(wall);
            });

        return Array.from(buckets.values()).flatMap((bucket) => {
            bucket.sort((first, second) => (
                type === 'south'
                    ? first.cell.x - second.cell.x
                    : first.cell.y - second.cell.y
            ));

            return bucket.reduce((segments, wall, index) => {
                if (index === 0) {
                    return [[wall]];
                }

                const previous = bucket[index - 1];
                const isConsecutive = type === 'south'
                    ? wall.cell.x === previous.cell.x + 1
                    : wall.cell.y === previous.cell.y + 1;

                if (!isConsecutive) {
                    segments.push([]);
                }

                segments[segments.length - 1].push(wall);
                return segments;
            }, []);
        });
    }

    function chooseDoorWall(southSegments, eastSegments) {
        const allSegments = southSegments.concat(eastSegments);

        if (allSegments.length === 0) {
            return null;
        }

        const bestSegment = allSegments
            .slice()
            .sort((first, second) => {
                const firstDepth = first.reduce((maxDepth, wall) => Math.max(maxDepth, wall.cell.x + wall.cell.y), 0);
                const secondDepth = second.reduce((maxDepth, wall) => Math.max(maxDepth, wall.cell.x + wall.cell.y), 0);
                return (second.length - first.length) || (secondDepth - firstDepth);
            })[0];

        return bestSegment[Math.floor(bestSegment.length / 2)];
    }

    function pickWindowWalls(segments, doorWall) {
        const uniqueWalls = new Map();

        segments.forEach((segment) => {
            const available = segment.filter((wall) => wall.key !== (doorWall && doorWall.key));
            const targetCount = Math.min(
                available.length,
                available.length >= 5 ? 3 : available.length >= 3 ? 2 : 1
            );

            for (let index = 0; index < targetCount; index++) {
                const ratio = targetCount === 1 ? 0.5 : index / (targetCount - 1);
                const wall = available[Math.round(ratio * (available.length - 1))];
                if (wall) {
                    uniqueWalls.set(wall.key, wall);
                }
            }
        });

        return Array.from(uniqueWalls.values());
    }

    function buildRoofSpans(footprint, roofRunsAlongX) {
        const spanBuckets = new Map();

        footprint.cells.forEach((cell) => {
            const index = roofRunsAlongX ? cell.y : cell.x;
            const coordinate = roofRunsAlongX ? cell.x : cell.y;

            if (!spanBuckets.has(index)) {
                spanBuckets.set(index, []);
            }

            spanBuckets.get(index).push(coordinate);
        });

        return Array.from(spanBuckets.entries())
            .sort((first, second) => first[0] - second[0])
            .map(([index, coordinates]) => ({
                index,
                start: Math.min(...coordinates),
                end: Math.max(...coordinates)
            }));
    }

    function buildFootprintLayout(footprint) {
        const cellSet = new Set(footprint.cells.map((cell) => houseLayout.tileKey(cell.x, cell.y)));
        const wallRecords = [];

        footprint.cells.forEach((cell) => {
            if (!cellSet.has(houseLayout.tileKey(cell.x, cell.y + 1))) {
                wallRecords.push({ type: 'south', key: `south:${cell.x},${cell.y}`, cell });
            }

            if (!cellSet.has(houseLayout.tileKey(cell.x + 1, cell.y))) {
                wallRecords.push({ type: 'east', key: `east:${cell.x},${cell.y}`, cell });
            }
        });

        const southSegments = buildWallSegments(wallRecords, 'south');
        const eastSegments = buildWallSegments(wallRecords, 'east');
        const doorWall = chooseDoorWall(southSegments, eastSegments);

        return {
            cellSet,
            wallRecords,
            southSegments,
            eastSegments,
            doorWall,
            windowWalls: pickWindowWalls(southSegments.concat(eastSegments), doorWall),
            roofSpans: {
                alongX: buildRoofSpans(footprint, true),
                alongY: buildRoofSpans(footprint, false)
            }
        };
    }

    function getFootprintLayout(footprint) {
        if (!footprintLayoutCache.has(footprint.signature)) {
            footprintLayoutCache.set(footprint.signature, buildFootprintLayout(footprint));
        }

        return footprintLayoutCache.get(footprint.signature);
    }

    houseLayout.getFootprintLayout = getFootprintLayout;
})();
