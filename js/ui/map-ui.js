(() => {
    const game = window.Game;
    const mapUi = game.systems.mapUi = game.systems.mapUi || {};
    const bridge = game.systems.uiBridge;

    if (!bridge) {
        return;
    }

    const MAP_TILE_COLORS = {
        grass: '#6d8654',
        trail: '#a18b63',
        shore: '#c5bb87',
        water: '#4d789b',
        bridge: '#856143',
        reeds: '#768e64',
        rubble: '#847361',
        mud: '#6f5848',
        rock: '#72685f',
        house: '#9c764c',
        unloaded: '#33403a'
    };
    const MAP_RESOURCE_COLORS = {
        stone: '#ccb78e',
        soil: '#b57e56',
        grass: '#9dd26c',
        berries: '#d86f87',
        well: '#7ec8ea'
    };
    const MAP_ZOOM_MIN = 0.75;
    const MAP_ZOOM_MAX = 6;
    const MAP_ZOOM_STEP = 1.25;

    let elements = null;
    let eventsBound = false;
    let mapZoom = 1;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getMapRuntime() {
        return game.systems.mapRuntime || null;
    }

    function ensureMapButton() {
        const pauseButton = document.getElementById('pauseButton');
        if (!pauseButton || document.getElementById('mapButton')) {
            return;
        }

        const mapButton = document.createElement('button');
        mapButton.id = 'mapButton';
        mapButton.className = 'hud-button';
        mapButton.type = 'button';
        mapButton.textContent = 'Карта';
        pauseButton.parentNode.insertBefore(mapButton, pauseButton);
    }

    function queryElements() {
        ensureMapButton();
        elements = {
            mapPanel: document.getElementById('mapPanel'),
            mapPanelTitle: document.getElementById('mapPanelTitle'),
            mapPanelSummary: document.getElementById('mapPanelSummary'),
            mapPanelClose: document.getElementById('mapPanelClose'),
            mapButton: document.getElementById('mapButton'),
            mapCanvas: document.getElementById('mapCanvas'),
            mapZoomIn: document.getElementById('mapZoomIn'),
            mapZoomOut: document.getElementById('mapZoomOut'),
            mapZoomValue: document.getElementById('mapZoomValue')
        };
        return elements;
    }

    function bindEvents() {
        if (eventsBound) {
            return;
        }

        const refs = queryElements();

        if (refs.mapButton) {
            refs.mapButton.addEventListener('click', () => {
                toggleMapPanel();
            });
        }

        if (refs.mapPanelClose) {
            refs.mapPanelClose.addEventListener('click', () => {
                toggleMapPanel(false);
            });
        }

        if (refs.mapZoomIn) {
            refs.mapZoomIn.addEventListener('click', () => {
                changeMapZoom(1);
            });
        }

        if (refs.mapZoomOut) {
            refs.mapZoomOut.addEventListener('click', () => {
                changeMapZoom(-1);
            });
        }

        eventsBound = true;
    }

    function isMapOpen() {
        return Boolean(game.state.isMapOpen);
    }

    function getMapContext() {
        const refs = elements || queryElements();
        if (!refs.mapCanvas) {
            return null;
        }

        const width = Math.max(320, Math.round(refs.mapCanvas.clientWidth || refs.mapCanvas.width || 320));
        const height = Math.max(320, Math.round(refs.mapCanvas.clientHeight || refs.mapCanvas.height || 320));

        if (refs.mapCanvas.width !== width || refs.mapCanvas.height !== height) {
            refs.mapCanvas.width = width;
            refs.mapCanvas.height = height;
        }

        return {
            canvas: refs.mapCanvas,
            ctx: refs.mapCanvas.getContext('2d'),
            width,
            height
        };
    }

    function updateZoomControls() {
        const refs = elements || queryElements();

        if (refs.mapZoomValue) {
            refs.mapZoomValue.textContent = `${Math.round(mapZoom * 100)}%`;
        }

        if (refs.mapZoomIn) {
            refs.mapZoomIn.disabled = mapZoom >= MAP_ZOOM_MAX - 0.001;
        }

        if (refs.mapZoomOut) {
            refs.mapZoomOut.disabled = mapZoom <= MAP_ZOOM_MIN + 0.001;
        }
    }

    function setMapZoom(nextZoom, options = {}) {
        const clampedZoom = clamp(nextZoom, MAP_ZOOM_MIN, MAP_ZOOM_MAX);
        mapZoom = clampedZoom;
        updateZoomControls();

        if (!options.silent && isMapOpen()) {
            renderMapPanel();
        }

        return mapZoom;
    }

    function changeMapZoom(direction) {
        if (direction > 0) {
            return setMapZoom(mapZoom * MAP_ZOOM_STEP);
        }

        return setMapZoom(mapZoom / MAP_ZOOM_STEP);
    }

    function toggleMapPanel(forceValue) {
        const nextValue = typeof forceValue === 'boolean'
            ? forceValue
            : !isMapOpen();

        if (nextValue && game.state.isMoving) {
            bridge.setActionMessage('Сначала нужно завершить движение, а потом открывать карту.');
            bridge.renderAfterStateChange();
            return false;
        }

        game.state.isMapOpen = nextValue;

        if (nextValue) {
            const runtime = getMapRuntime();
            if (runtime && typeof runtime.captureVisibleWorld === 'function') {
                const focusChunkX = Math.floor(game.state.playerPos.x / game.config.chunkSize);
                const focusChunkY = Math.floor(game.state.playerPos.y / game.config.chunkSize);
                runtime.captureVisibleWorld(focusChunkX, focusChunkY);
            }
        }

        bridge.renderAfterStateChange();
        return nextValue;
    }

    function getTileColor(entry) {
        if (!entry) {
            return MAP_TILE_COLORS.unloaded;
        }

        if (entry.tileType === 'house') {
            return MAP_TILE_COLORS.house;
        }

        return MAP_TILE_COLORS[entry.baseTileType] || MAP_TILE_COLORS[entry.tileType] || MAP_TILE_COLORS.unloaded;
    }

    function drawBackground(ctx, width, height) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#102018');
        gradient.addColorStop(1, '#08100c');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    function drawEmptyState(ctx, width, height) {
        drawBackground(ctx, width, height);
        ctx.fillStyle = 'rgba(255, 248, 219, 0.88)';
        ctx.font = '600 18px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Карта заполняется по мере разведки архипелага.', width / 2, height / 2 - 14);
        ctx.font = '14px Georgia, serif';
        ctx.fillStyle = 'rgba(255, 248, 219, 0.66)';
        ctx.fillText('Пройди несколько экранов, и туман войны начнет отступать.', width / 2, height / 2 + 14);
    }

    function buildMapStats(exploredTiles) {
        const islandIds = new Set();
        const houseIds = new Set();
        const questHouseIds = new Set();
        const resourcePoints = new Set();

        exploredTiles.forEach((entry) => {
            if (Number.isFinite(entry.islandIndex)) {
                islandIds.add(entry.islandIndex);
            }

            if (entry.houseId && entry.houseKind !== 'well' && entry.houseKind !== 'forage') {
                houseIds.add(entry.houseId);
            }

            if (entry.isQuestGiver && entry.houseId) {
                questHouseIds.add(entry.houseId);
            }

            if (entry.resourceKind) {
                resourcePoints.add(`${entry.resourceKind}:${entry.x},${entry.y}`);
            }

            if ((entry.houseKind === 'well' || entry.houseKind === 'forage') && entry.houseId) {
                resourcePoints.add(`${entry.houseKind}:${entry.houseId}`);
            }
        });

        return {
            islandCount: islandIds.size,
            houseCount: houseIds.size,
            questCount: questHouseIds.size,
            resourceCount: resourcePoints.size
        };
    }

    function buildMarkerSets(exploredTiles) {
        const houseMarkers = new Map();
        const questMarkers = new Map();
        const resourceMarkers = new Map();

        exploredTiles.forEach((entry) => {
            if (entry.houseId) {
                if (entry.houseKind === 'well' || entry.houseKind === 'forage') {
                    resourceMarkers.set(`poi:${entry.houseId}`, {
                        x: entry.houseMarkerX,
                        y: entry.houseMarkerY,
                        resourceKind: entry.houseKind === 'well' ? 'well' : 'berries'
                    });
                } else if (!houseMarkers.has(entry.houseId)) {
                    houseMarkers.set(entry.houseId, {
                        x: entry.houseMarkerX,
                        y: entry.houseMarkerY
                    });
                }

                if (entry.isQuestGiver) {
                    questMarkers.set(entry.houseId, {
                        x: entry.houseMarkerX,
                        y: entry.houseMarkerY
                    });
                }
            }

            if (entry.resourceKind) {
                resourceMarkers.set(`tile:${entry.resourceKind}:${entry.x},${entry.y}`, {
                    x: entry.x,
                    y: entry.y,
                    resourceKind: entry.resourceKind
                });
            }
        });

        return {
            houseMarkers: Array.from(houseMarkers.values()),
            questMarkers: Array.from(questMarkers.values()),
            resourceMarkers: Array.from(resourceMarkers.values())
        };
    }

    function getWorldBounds(exploredTiles) {
        return exploredTiles.reduce((bounds, entry) => {
            bounds.minX = Math.min(bounds.minX, entry.x);
            bounds.maxX = Math.max(bounds.maxX, entry.x);
            bounds.minY = Math.min(bounds.minY, entry.y);
            bounds.maxY = Math.max(bounds.maxY, entry.y);
            return bounds;
        }, {
            minX: game.state.playerPos.x,
            maxX: game.state.playerPos.x,
            minY: game.state.playerPos.y,
            maxY: game.state.playerPos.y
        });
    }

    function buildMapLayout(bounds, contextState) {
        const worldWidth = Math.max(1, bounds.maxX - bounds.minX + 1);
        const worldHeight = Math.max(1, bounds.maxY - bounds.minY + 1);
        const padding = 20;
        const availableWidth = Math.max(1, contextState.width - padding * 2);
        const availableHeight = Math.max(1, contextState.height - padding * 2);
        const fitCellSize = Math.max(1, Math.min(14, Math.floor(Math.min(availableWidth / worldWidth, availableHeight / worldHeight))));
        const cellSize = Math.max(1, fitCellSize * mapZoom);
        const mapWidth = worldWidth * cellSize;
        const mapHeight = worldHeight * cellSize;
        const minOffsetX = contextState.width - padding - mapWidth;
        const maxOffsetX = padding;
        const minOffsetY = contextState.height - padding - mapHeight;
        const maxOffsetY = padding;
        let offsetX = Math.floor((contextState.width - mapWidth) / 2);
        let offsetY = Math.floor((contextState.height - mapHeight) / 2);

        if (mapWidth > availableWidth) {
            const desiredOffsetX = contextState.width / 2 - ((game.state.playerPos.x - bounds.minX) + 0.5) * cellSize;
            offsetX = Math.round(clamp(desiredOffsetX, minOffsetX, maxOffsetX));
        }

        if (mapHeight > availableHeight) {
            const desiredOffsetY = contextState.height / 2 - ((game.state.playerPos.y - bounds.minY) + 0.5) * cellSize;
            offsetY = Math.round(clamp(desiredOffsetY, minOffsetY, maxOffsetY));
        }

        return {
            padding,
            worldWidth,
            worldHeight,
            cellSize,
            mapWidth,
            mapHeight,
            offsetX,
            offsetY
        };
    }

    function getCanvasX(worldX, bounds, layout) {
        return layout.offsetX + (worldX - bounds.minX) * layout.cellSize;
    }

    function getCanvasY(worldY, bounds, layout) {
        return layout.offsetY + (worldY - bounds.minY) * layout.cellSize;
    }

    function renderMapPanel() {
        const refs = elements || queryElements();
        const contextState = getMapContext();

        if (!refs.mapPanel || !contextState || !contextState.ctx) {
            return;
        }

        updateZoomControls();

        const runtime = getMapRuntime();
        const exploredTiles = runtime && typeof runtime.getExploredTiles === 'function'
            ? runtime.getExploredTiles()
            : [];
        const progression = bridge.getCurrentProgression();
        const title = progression
            ? `Архипелаг · остров ${progression.islandIndex}`
            : 'Архипелаг';

        refs.mapPanelTitle.textContent = title;

        if (!Array.isArray(exploredTiles) || exploredTiles.length === 0) {
            refs.mapPanelSummary.textContent = 'Разведанных мест пока нет.';
            drawEmptyState(contextState.ctx, contextState.width, contextState.height);
            return;
        }

        const bounds = getWorldBounds(exploredTiles);
        const layout = buildMapLayout(bounds, contextState);
        const markers = buildMarkerSets(exploredTiles);
        const stats = buildMapStats(exploredTiles);
        const playerX = getCanvasX(game.state.playerPos.x, bounds, layout) + layout.cellSize / 2;
        const playerY = getCanvasY(game.state.playerPos.y, bounds, layout) + layout.cellSize / 2;
        const ctx = contextState.ctx;

        refs.mapPanelSummary.textContent = `Разведано клеток: ${exploredTiles.length} · островов: ${stats.islandCount} · домов: ${stats.houseCount} · квестодателей: ${stats.questCount} · ресурсов: ${stats.resourceCount}`;

        drawBackground(ctx, contextState.width, contextState.height);

        exploredTiles.forEach((entry) => {
            const drawX = getCanvasX(entry.x, bounds, layout);
            const drawY = getCanvasY(entry.y, bounds, layout);

            ctx.fillStyle = getTileColor(entry);
            ctx.fillRect(drawX, drawY, layout.cellSize, layout.cellSize);
        });

        markers.resourceMarkers.forEach((marker) => {
            const drawX = getCanvasX(marker.x, bounds, layout) + layout.cellSize / 2;
            const drawY = getCanvasY(marker.y, bounds, layout) + layout.cellSize / 2;

            ctx.fillStyle = MAP_RESOURCE_COLORS[marker.resourceKind] || MAP_RESOURCE_COLORS.stone;
            ctx.fillRect(
                Math.round(drawX - Math.max(2, layout.cellSize * 0.28)),
                Math.round(drawY - Math.max(2, layout.cellSize * 0.28)),
                Math.max(4, Math.round(layout.cellSize * 0.55)),
                Math.max(4, Math.round(layout.cellSize * 0.55))
            );
        });

        markers.houseMarkers.forEach((marker) => {
            const drawX = getCanvasX(marker.x, bounds, layout) + layout.cellSize / 2;
            const drawY = getCanvasY(marker.y, bounds, layout) + layout.cellSize / 2;
            const radius = Math.max(4, layout.cellSize * 0.45);

            ctx.fillStyle = '#d6b47d';
            ctx.beginPath();
            ctx.moveTo(drawX, drawY - radius);
            ctx.lineTo(drawX + radius, drawY);
            ctx.lineTo(drawX, drawY + radius);
            ctx.lineTo(drawX - radius, drawY);
            ctx.closePath();
            ctx.fill();
        });

        markers.questMarkers.forEach((marker) => {
            const drawX = getCanvasX(marker.x, bounds, layout) + layout.cellSize / 2;
            const drawY = getCanvasY(marker.y, bounds, layout) + layout.cellSize / 2;
            const radius = Math.max(3, layout.cellSize * 0.38);

            ctx.strokeStyle = '#f5de81';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
            ctx.stroke();
        });

        ctx.fillStyle = '#f8f3d0';
        ctx.beginPath();
        ctx.arc(playerX, playerY, Math.max(3, layout.cellSize * 0.42), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#203528';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function syncMapState() {
        const refs = elements || queryElements();
        bindEvents();
        updateZoomControls();

        if (!refs.mapPanel) {
            return;
        }

        const shouldShow = isMapOpen() && !game.state.isGameOver;

        refs.mapPanel.hidden = !shouldShow;
        if (refs.mapButton) {
            refs.mapButton.classList.toggle('hud-button--available', shouldShow);
        }

        if (shouldShow) {
            renderMapPanel();
        }
    }

    Object.assign(mapUi, {
        isMapOpen,
        renderMapPanel,
        setMapZoom,
        changeMapZoom,
        syncMapState,
        toggleMapPanel
    });
})();
