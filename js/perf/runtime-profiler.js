(() => {
    const game = window.Game;
    const perf = game.systems.perf = game.systems.perf || {};
    const METRIC_NAMES = [
        'renderScene',
        'drawWorld',
        'drawSceneEntities',
        'pathfinding',
        'generateChunk',
        'captureVisibleWorld',
        'refreshDirty'
    ];
    const FRAME_STAT_NAMES = [
        'loadedChunks',
        'drawnChunks',
        'routeVisibleSteps',
        'routePreviewSteps',
        'interactionsDrawn',
        'housePartsDrawn',
        'invalidatedChunkCaches'
    ];
    const SAMPLE_LIMIT = 240;

    let enabled = false;
    let frameOpen = false;
    let lastFrameTimestamp = null;
    let panelElement = null;
    let frameSeries = createSeries();
    let metricSeries = createRegistry(METRIC_NAMES);
    let frameStatSeries = createRegistry(FRAME_STAT_NAMES);
    let currentFrameStats = createFrameStats();
    let lastFrameStats = createFrameStats();
    let activeScenarioName = '';
    let lastScenarioReport = null;
    let lastBaselineReport = null;
    const scenarioDefinitions = {
        idleStanding: {
            key: 'idleStanding',
            label: 'idle standing',
            renderDurationMs: 1800
        },
        longRoutePreview: {
            key: 'longRoutePreview',
            label: 'long route preview',
            renderDurationMs: 1800,
            minPathLength: 28,
            requireChunkCrossing: false,
            searchRadius: 8
        },
        longMovementAcrossChunkBorders: {
            key: 'longMovementAcrossChunkBorders',
            label: 'long movement across chunk borders',
            minPathLength: 36,
            maxPathLength: 72,
            requireChunkCrossing: true,
            searchRadius: 10,
            maxTurns: 12,
            timeoutMs: 25000
        }
    };

    function createSeries() {
        return {
            last: 0,
            max: 0,
            total: 0,
            count: 0,
            samples: []
        };
    }

    function createRegistry(names) {
        return names.reduce((registry, name) => {
            registry[name] = createSeries();
            return registry;
        }, {});
    }

    function createFrameStats() {
        return FRAME_STAT_NAMES.reduce((stats, name) => {
            stats[name] = 0;
            return stats;
        }, {});
    }

    function getNow() {
        return typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
    }

    function recordSample(series, value) {
        const normalizedValue = Math.max(0, Number(value) || 0);

        series.last = normalizedValue;
        series.max = Math.max(series.max, normalizedValue);
        series.total += normalizedValue;
        series.count += 1;
        series.samples.push(normalizedValue);

        if (series.samples.length > SAMPLE_LIMIT) {
            series.samples.shift();
        }
    }

    function getAverage(series) {
        return series.count > 0 ? (series.total / series.count) : 0;
    }

    function getPercentile(series, percentile) {
        if (!series.samples.length) {
            return 0;
        }

        const sortedSamples = series.samples.slice().sort((left, right) => left - right);
        const clampedPercentile = Math.max(0, Math.min(1, percentile));
        const index = Math.min(
            sortedSamples.length - 1,
            Math.max(0, Math.ceil(sortedSamples.length * clampedPercentile) - 1)
        );

        return sortedSamples[index];
    }

    function formatMs(value) {
        return `${value.toFixed(2)} ms`;
    }

    function cloneSerializable(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function getLoadedChunkCount() {
        const state = game.state || null;

        if (!state) {
            return 0;
        }

        if (Number.isFinite(state.loadedChunkCount)) {
            return state.loadedChunkCount;
        }

        return state.loadedChunks ? Object.keys(state.loadedChunks).length : 0;
    }

    function getVisibleRouteStepCount() {
        const route = game.state && Array.isArray(game.state.route) ? game.state.route : [];
        return route.length;
    }

    function getPreviewRouteStepCount() {
        const visibleSteps = getVisibleRouteStepCount();
        const previewSteps = game.state && Number.isFinite(game.state.routePreviewLength)
            ? game.state.routePreviewLength
            : visibleSteps;

        return Math.max(visibleSteps, previewSteps);
    }

    function createPanel() {
        if (panelElement && document.body.contains(panelElement)) {
            return panelElement;
        }

        const host = document.getElementById('sceneViewport') || document.body;
        const nextPanel = document.createElement('pre');
        nextPanel.id = 'perfPanel';
        nextPanel.className = 'overlay-card overlay-card--debug overlay-card--perf';
        nextPanel.hidden = true;
        host.appendChild(nextPanel);
        panelElement = nextPanel;
        return panelElement;
    }

    function hidePanel() {
        if (panelElement) {
            panelElement.hidden = true;
        }
    }

    function getMetricSummary(name) {
        const series = metricSeries[name] || createSeries();

        return {
            last: series.last,
            avg: getAverage(series),
            max: series.max,
            count: series.count,
            p95: getPercentile(series, 0.95)
        };
    }

    function getFrameSummary() {
        const avgFrameTime = getAverage(frameSeries);

        return {
            lastMs: frameSeries.last,
            avgMs: avgFrameTime,
            p95Ms: getPercentile(frameSeries, 0.95),
            maxMs: frameSeries.max,
            fps: avgFrameTime > 0 ? (1000 / avgFrameTime) : 0,
            samples: frameSeries.count
        };
    }

    function getFrameStatSummary(name) {
        const series = frameStatSeries[name] || createSeries();

        return {
            last: series.last,
            avg: getAverage(series),
            max: series.max,
            count: series.count
        };
    }

    function setFrameStat(name, value) {
        if (!enabled || !Object.prototype.hasOwnProperty.call(currentFrameStats, name)) {
            return 0;
        }

        currentFrameStats[name] = Math.max(0, Number(value) || 0);
        return currentFrameStats[name];
    }

    function incrementFrameStat(name, delta = 1) {
        if (!enabled || !Object.prototype.hasOwnProperty.call(currentFrameStats, name)) {
            return 0;
        }

        currentFrameStats[name] += Math.max(0, Number(delta) || 0);
        return currentFrameStats[name];
    }

    function syncFrameStateFromGame() {
        setFrameStat('loadedChunks', getLoadedChunkCount());
        setFrameStat('routeVisibleSteps', getVisibleRouteStepCount());
        setFrameStat('routePreviewSteps', getPreviewRouteStepCount());
    }

    function reset() {
        frameSeries = createSeries();
        metricSeries = createRegistry(METRIC_NAMES);
        frameStatSeries = createRegistry(FRAME_STAT_NAMES);
        currentFrameStats = createFrameStats();
        lastFrameStats = createFrameStats();
        frameOpen = false;
        lastFrameTimestamp = null;
        updatePanel();
    }

    function recordFrame(timestamp) {
        if (!enabled || !Number.isFinite(timestamp)) {
            return 0;
        }

        if (frameOpen) {
            finishFrame();
        }

        if (Number.isFinite(lastFrameTimestamp)) {
            recordSample(frameSeries, timestamp - lastFrameTimestamp);
        }

        lastFrameTimestamp = timestamp;
        currentFrameStats = createFrameStats();
        syncFrameStateFromGame();
        frameOpen = true;
        return frameSeries.last;
    }

    function finishFrame() {
        if (!enabled || !frameOpen) {
            return { ...lastFrameStats };
        }

        syncFrameStateFromGame();
        lastFrameStats = { ...currentFrameStats };
        FRAME_STAT_NAMES.forEach((name) => {
            recordSample(frameStatSeries[name], lastFrameStats[name]);
        });
        frameOpen = false;
        return { ...lastFrameStats };
    }

    function recordMetric(name, durationMs) {
        if (!enabled || !metricSeries[name]) {
            return durationMs;
        }

        recordSample(metricSeries[name], durationMs);
        return durationMs;
    }

    function start(name) {
        if (!enabled) {
            return null;
        }

        return {
            name,
            startedAt: getNow()
        };
    }

    function end(token) {
        if (!token || !enabled) {
            return 0;
        }

        return recordMetric(token.name, getNow() - token.startedAt);
    }

    function measure(name, callback) {
        if (!enabled) {
            return callback();
        }

        const token = start(name);

        try {
            return callback();
        } finally {
            end(token);
        }
    }

    function buildPanelText() {
        const frame = getFrameSummary();
        const frameStats = frameOpen ? { ...currentFrameStats } : { ...lastFrameStats };
        const lines = [
            'Perf',
            'window.__perf = false',
            'run: window.Game.systems.perf.runBaseline()',
            `FPS avg: ${frame.fps.toFixed(1)}`,
            `Frame avg/p95/max: ${formatMs(frame.avgMs)} / ${formatMs(frame.p95Ms)} / ${formatMs(frame.maxMs)}`,
            `Chunks loaded/drawn: ${frameStats.loadedChunks} / ${frameStats.drawnChunks}`,
            `Route steps visible/preview: ${frameStats.routeVisibleSteps} / ${frameStats.routePreviewSteps}`,
            `Interactions / house parts: ${frameStats.interactionsDrawn} / ${frameStats.housePartsDrawn}`,
            `Chunk cache invalidations: ${frameStats.invalidatedChunkCaches}`
        ];

        if (activeScenarioName) {
            lines.splice(2, 0, `Scenario: ${activeScenarioName}`);
        }

        METRIC_NAMES.forEach((name) => {
            const summary = getMetricSummary(name);
            lines.push(
                `${name}: last ${formatMs(summary.last)} | avg ${formatMs(summary.avg)} | max ${formatMs(summary.max)}`
            );
        });

        return lines.join('\n');
    }

    function updatePanel() {
        if (!enabled) {
            return;
        }

        const element = createPanel();
        element.hidden = false;
        element.textContent = buildPanelText();
    }

    function getSnapshot() {
        return {
            enabled,
            frame: getFrameSummary(),
            frameStats: {
                ...(frameOpen ? currentFrameStats : lastFrameStats)
            },
            frameStatSummaries: FRAME_STAT_NAMES.reduce((snapshot, name) => {
                snapshot[name] = getFrameStatSummary(name);
                return snapshot;
            }, {}),
            metrics: METRIC_NAMES.reduce((snapshot, name) => {
                snapshot[name] = getMetricSummary(name);
                return snapshot;
            }, {}),
            activeScenarioName,
            lastScenarioReport,
            lastBaselineReport
        };
    }

    function waitForAnimationFrames(count = 1) {
        const targetCount = Math.max(1, Math.floor(count));

        return new Promise((resolve) => {
            let remaining = targetCount;

            function onFrame() {
                remaining -= 1;

                if (remaining <= 0) {
                    resolve();
                    return;
                }

                requestAnimationFrame(onFrame);
            }

            requestAnimationFrame(onFrame);
        });
    }

    function waitForCondition(predicate, options = {}) {
        const timeoutMs = Math.max(1000, Number(options.timeoutMs) || 10000);
        const label = typeof options.label === 'string' && options.label.trim()
            ? options.label.trim()
            : 'condition';
        const startedAt = getNow();

        return new Promise((resolve, reject) => {
            function tick() {
                if (predicate()) {
                    resolve(true);
                    return;
                }

                if ((getNow() - startedAt) >= timeoutMs) {
                    reject(new Error(`Timed out waiting for ${label}.`));
                    return;
                }

                requestAnimationFrame(tick);
            }

            tick();
        });
    }

    function captureScenarioSource() {
        const saveLoad = game.systems.saveLoad || null;

        if (!saveLoad || typeof saveLoad.buildSaveSnapshot !== 'function') {
            throw new Error('Save/load snapshot builder is unavailable.');
        }

        return {
            snapshot: cloneSerializable(saveLoad.buildSaveSnapshot(game.state)),
            worldSeed: Number.isFinite(game.config.worldSeed) ? game.config.worldSeed : null
        };
    }

    async function restoreScenarioSource(source) {
        const lifecycle = game.systems.gameLifecycle || null;

        if (!source || !source.snapshot || !lifecycle || typeof lifecycle.initGame !== 'function') {
            throw new Error('Game lifecycle restore is unavailable.');
        }

        lifecycle.initGame({
            snapshot: cloneSerializable(source.snapshot),
            worldSeed: source.worldSeed
        });

        await waitForAnimationFrames(4);
    }

    function buildCandidateChunks(maxRadius = 8) {
        const expedition = game.systems.expedition || null;
        const world = game.systems.world || null;

        if (!expedition || !world || typeof expedition.getIslandChunkRecord !== 'function') {
            return [];
        }

        const playerPos = game.state.playerPos || { x: 0, y: 0 };
        const playerChunk = world.getChunkCoordinatesForWorld(playerPos.x, playerPos.y);
        const candidates = [];

        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let offsetY = -radius; offsetY <= radius; offsetY++) {
                for (let offsetX = -radius; offsetX <= radius; offsetX++) {
                    if (Math.max(Math.abs(offsetX), Math.abs(offsetY)) !== radius) {
                        continue;
                    }

                    const chunkX = playerChunk.chunkX + offsetX;
                    const chunkY = playerChunk.chunkY + offsetY;

                    if (!expedition.getIslandChunkRecord(chunkX, chunkY)) {
                        continue;
                    }

                    candidates.push({
                        chunkX,
                        chunkY,
                        distance: Math.abs(offsetX) + Math.abs(offsetY)
                    });
                }
            }
        }

        return candidates.sort((left, right) => right.distance - left.distance);
    }

    function findTraversableTileInChunk(chunkX, chunkY) {
        const world = game.systems.world || null;
        const pathfinding = game.systems.pathfinding || null;

        if (!world || !pathfinding || typeof world.getChunk !== 'function' || typeof pathfinding.canMoveTo !== 'function') {
            return null;
        }

        const chunk = world.getChunk(chunkX, chunkY, { generateIfMissing: true });

        if (!chunk || !Array.isArray(chunk.data)) {
            return null;
        }

        const chunkSize = game.config.chunkSize;
        const center = Math.floor(chunkSize / 2);
        const probes = [
            { localX: center, localY: center },
            { localX: center + 2, localY: center },
            { localX: center - 2, localY: center },
            { localX: center, localY: center + 2 },
            { localX: center, localY: center - 2 }
        ];

        for (const probe of probes) {
            if (
                probe.localX < 0 || probe.localX >= chunkSize
                || probe.localY < 0 || probe.localY >= chunkSize
            ) {
                continue;
            }

            const worldX = chunkX * chunkSize + probe.localX;
            const worldY = chunkY * chunkSize + probe.localY;

            if (pathfinding.canMoveTo(worldX, worldY)) {
                return { x: worldX, y: worldY };
            }
        }

        for (let localY = 0; localY < chunkSize; localY++) {
            for (let localX = 0; localX < chunkSize; localX++) {
                const worldX = chunkX * chunkSize + localX;
                const worldY = chunkY * chunkSize + localY;

                if (pathfinding.canMoveTo(worldX, worldY)) {
                    return { x: worldX, y: worldY };
                }
            }
        }

        return null;
    }

    function countRouteChunks(path = []) {
        const world = game.systems.world || null;

        if (!world || typeof world.getChunkCoordinatesForWorld !== 'function') {
            return 0;
        }

        const uniqueChunks = new Set();
        path.forEach((step) => {
            const { chunkX, chunkY } = world.getChunkCoordinatesForWorld(step.x, step.y);
            uniqueChunks.add(`${chunkX},${chunkY}`);
        });
        return uniqueChunks.size;
    }

    function findScenarioTarget(definition = {}) {
        const world = game.systems.world || null;
        const pathfinding = game.systems.pathfinding || null;

        if (!world || !pathfinding || typeof pathfinding.findPathResult !== 'function') {
            throw new Error('Scenario target search is unavailable.');
        }

        const playerPos = game.state.playerPos || { x: 0, y: 0 };
        const startX = Math.round(playerPos.x);
        const startY = Math.round(playerPos.y);
        const minPathLength = Math.max(8, Number(definition.minPathLength) || 24);
        const maxPathLength = Number.isFinite(definition.maxPathLength)
            ? Math.max(minPathLength, Number(definition.maxPathLength))
            : Infinity;
        const requireChunkCrossing = Boolean(definition.requireChunkCrossing);
        const candidates = buildCandidateChunks(Math.max(2, Number(definition.searchRadius) || 8));

        for (const candidate of candidates) {
            const tile = findTraversableTileInChunk(candidate.chunkX, candidate.chunkY);

            if (!tile) {
                continue;
            }

            const pathResult = pathfinding.findPathResult(startX, startY, tile.x, tile.y);
            const uniqueChunks = countRouteChunks(pathResult.path);

            if (pathResult.path.length < minPathLength) {
                continue;
            }

            if (pathResult.path.length > maxPathLength) {
                continue;
            }

            if (requireChunkCrossing && uniqueChunks < 2) {
                continue;
            }

            return {
                target: tile,
                pathLength: pathResult.path.length,
                totalCost: pathResult.totalCost,
                uniqueChunks
            };
        }

        throw new Error(`Could not find target for scenario "${definition.label || definition.key || 'unknown'}".`);
    }

    function setScenarioTarget(target) {
        const interactions = game.systems.interactions || null;
        const interaction = interactions && typeof interactions.getInteractionAtWorld === 'function'
            ? interactions.getInteractionAtWorld(target.x, target.y, { generateIfMissing: false })
            : null;

        game.state.selectedWorldTile = {
            x: target.x,
            y: target.y
        };
        game.state.selectedWorldInteractionId = interaction ? interaction.id : null;
    }

    function isPlayerAtTarget(target) {
        return Math.round(game.state.playerPos.x) === target.x && Math.round(game.state.playerPos.y) === target.y;
    }

    async function driveRenderLoop(durationMs = 1500) {
        const render = game.systems.render || null;
        const startedAt = getNow();

        if (!render || typeof render.render !== 'function') {
            throw new Error('Render system is unavailable.');
        }

        return new Promise((resolve) => {
            function tick(now) {
                render.render();

                if ((now - startedAt) >= durationMs) {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(resolve);
                    });
                    return;
                }

                requestAnimationFrame(tick);
            }

            requestAnimationFrame(tick);
        });
    }

    function buildScenarioReport(definition, snapshot, metadata = {}) {
        const report = {
            key: definition.key,
            label: definition.label,
            capturedAt: new Date().toISOString(),
            avgFps: snapshot.frame.fps,
            p95FrameTimeMs: snapshot.frame.p95Ms,
            avgFrameTimeMs: snapshot.frame.avgMs,
            maxFrameTimeMs: snapshot.frame.maxMs,
            maxChunkGenerationSpikeMs: snapshot.metrics.generateChunk.max,
            maxPathfindingSpikeMs: snapshot.metrics.pathfinding.max,
            frameStats: {
                loadedChunks: snapshot.frameStatSummaries.loadedChunks,
                drawnChunks: snapshot.frameStatSummaries.drawnChunks,
                routeVisibleSteps: snapshot.frameStatSummaries.routeVisibleSteps,
                routePreviewSteps: snapshot.frameStatSummaries.routePreviewSteps,
                interactionsDrawn: snapshot.frameStatSummaries.interactionsDrawn,
                housePartsDrawn: snapshot.frameStatSummaries.housePartsDrawn,
                invalidatedChunkCaches: snapshot.frameStatSummaries.invalidatedChunkCaches
            },
            metrics: cloneSerializable(snapshot.metrics),
            metadata
        };

        lastScenarioReport = report;
        return report;
    }

    async function runIdleStandingScenario(definition) {
        await driveRenderLoop(definition.renderDurationMs);
        return {
            durationMs: definition.renderDurationMs
        };
    }

    async function runLongRoutePreviewScenario(definition, targetInfo) {
        const input = game.systems.input || null;

        if (!input || typeof input.planRouteToTarget !== 'function') {
            throw new Error('Input route planner is unavailable.');
        }

        setScenarioTarget(targetInfo.target);
        input.planRouteToTarget(targetInfo.target.x, targetInfo.target.y, {
            preloadTarget: true,
            showRouteWarning: false,
            clearActionMessage: false
        });
        await driveRenderLoop(definition.renderDurationMs);

        return {
            durationMs: definition.renderDurationMs,
            target: targetInfo.target,
            previewSteps: game.state.routePreviewLength,
            visibleSteps: game.state.route.length,
            uniqueChunks: targetInfo.uniqueChunks
        };
    }

    async function runLongMovementScenario(definition, targetInfo) {
        const input = game.systems.input || null;
        const movement = game.systems.movement || null;

        if (
            !input
            || !movement
            || typeof input.planRouteToTarget !== 'function'
            || typeof input.planRouteToSelectedTile !== 'function'
            || typeof movement.startMovement !== 'function'
        ) {
            throw new Error('Movement scenario dependencies are unavailable.');
        }

        setScenarioTarget(targetInfo.target);
        input.planRouteToTarget(targetInfo.target.x, targetInfo.target.y, {
            preloadTarget: true,
            showRouteWarning: false,
            clearActionMessage: false
        });

        let turnsExecuted = 0;

        while (!isPlayerAtTarget(targetInfo.target) && turnsExecuted < definition.maxTurns) {
            if (!Array.isArray(game.state.route) || game.state.route.length === 0) {
                const continuationPlan = input.planRouteToSelectedTile({
                    preloadTarget: true,
                    showRouteWarning: false,
                    clearActionMessage: false
                });

                if (!continuationPlan || !continuationPlan.hasRoute) {
                    break;
                }
            }

            movement.startMovement();
            await waitForCondition(
                () => !game.state.isMoving && !game.state.animationRequestId,
                {
                    timeoutMs: definition.timeoutMs,
                    label: `${definition.label} movement completion`
                }
            );
            turnsExecuted += 1;
            await waitForAnimationFrames(2);
        }

        await waitForAnimationFrames(4);

        return {
            target: targetInfo.target,
            turnsExecuted,
            reachedTarget: isPlayerAtTarget(targetInfo.target),
            previewSteps: game.state.routePreviewLength,
            visibleSteps: game.state.route.length,
            uniqueChunks: targetInfo.uniqueChunks
        };
    }

    async function executeScenario(definition, source) {
        let targetInfo = null;

        activeScenarioName = definition.label;
        setEnabled(false);
        await restoreScenarioSource(source);

        if (definition.key !== 'idleStanding') {
            targetInfo = findScenarioTarget(definition);
            await restoreScenarioSource(source);
        }

        setEnabled(true);
        reset();

        let metadata = {};

        if (definition.key === 'idleStanding') {
            metadata = await runIdleStandingScenario(definition);
        } else if (definition.key === 'longRoutePreview') {
            metadata = await runLongRoutePreviewScenario(definition, targetInfo);
        } else if (definition.key === 'longMovementAcrossChunkBorders') {
            metadata = await runLongMovementScenario(definition, targetInfo);
        } else {
            throw new Error(`Unknown scenario "${definition.key}".`);
        }

        finishFrame();
        updatePanel();
        const snapshot = getSnapshot();
        activeScenarioName = '';
        return buildScenarioReport(definition, snapshot, metadata);
    }

    function getScenarioDefinition(name) {
        return scenarioDefinitions[name] || null;
    }

    function logScenarioReport(report) {
        if (!report) {
            return;
        }

        console.info(
            `[perf] ${report.label}: avg FPS ${report.avgFps.toFixed(1)}, p95 ${report.p95FrameTimeMs.toFixed(2)} ms, `
            + `chunk spike ${report.maxChunkGenerationSpikeMs.toFixed(2)} ms, path spike ${report.maxPathfindingSpikeMs.toFixed(2)} ms`
        );
    }

    async function runScenario(name, options = {}) {
        const definition = getScenarioDefinition(name);

        if (!definition) {
            throw new Error(`Unknown perf scenario "${name}".`);
        }

        const previousEnabled = enabled;
        const source = options.source || captureScenarioSource();

        try {
            const report = await executeScenario(definition, source);
            logScenarioReport(report);
            return report;
        } finally {
            activeScenarioName = '';
            setEnabled(previousEnabled);
        }
    }

    async function runBaseline() {
        const previousEnabled = enabled;
        const source = captureScenarioSource();
        const scenarioOrder = [
            'idleStanding',
            'longRoutePreview',
            'longMovementAcrossChunkBorders'
        ];
        const scenarios = {};

        try {
            for (const scenarioName of scenarioOrder) {
                const definition = getScenarioDefinition(scenarioName);
                scenarios[scenarioName] = await executeScenario(definition, source);
                logScenarioReport(scenarios[scenarioName]);
            }

            lastBaselineReport = {
                capturedAt: new Date().toISOString(),
                worldSeed: source.worldSeed,
                scenarios,
                summary: {
                    avgFps: scenarioOrder.reduce((sum, name) => sum + scenarios[name].avgFps, 0) / scenarioOrder.length,
                    p95FrameTimeMs: Math.max(...scenarioOrder.map((name) => scenarios[name].p95FrameTimeMs)),
                    maxChunkGenerationSpikeMs: Math.max(...scenarioOrder.map((name) => scenarios[name].maxChunkGenerationSpikeMs)),
                    maxPathfindingSpikeMs: Math.max(...scenarioOrder.map((name) => scenarios[name].maxPathfindingSpikeMs))
                }
            };

            console.info('[perf] baseline complete', lastBaselineReport);
            return lastBaselineReport;
        } finally {
            activeScenarioName = '';
            setEnabled(previousEnabled);
        }
    }

    function setEnabled(nextEnabled) {
        const normalizedEnabled = Boolean(nextEnabled);

        if (enabled === normalizedEnabled) {
            if (enabled) {
                updatePanel();
            } else {
                hidePanel();
            }

            return enabled;
        }

        enabled = normalizedEnabled;

        if (enabled) {
            reset();
            updatePanel();
            return true;
        }

        frameOpen = false;
        lastFrameTimestamp = null;
        hidePanel();
        return false;
    }

    Object.assign(perf, {
        METRIC_NAMES,
        FRAME_STAT_NAMES,
        start,
        end,
        measure,
        reset,
        setEnabled,
        isEnabled: () => enabled,
        recordFrame,
        finishFrame,
        recordMetric,
        setFrameStat,
        incrementFrameStat,
        updatePanel,
        getMetricSummary,
        getFrameSummary,
        getFrameStatSummary,
        getSnapshot,
        scenarios: scenarioDefinitions,
        getScenarioDefinition,
        runScenario,
        runBaseline,
        getLastScenarioReport: () => lastScenarioReport,
        getLastBaselineReport: () => lastBaselineReport
    });

    Object.defineProperty(window, '__perf', {
        configurable: true,
        get() {
            return enabled;
        },
        set(value) {
            setEnabled(Boolean(value));
        }
    });
})();
