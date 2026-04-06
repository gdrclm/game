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
        rubble: '#d8c29c',
        soil: '#b57e56',
        grass: '#9dd26c',
        reeds: '#b7d98a',
        wood: '#bea06a',
        water: '#7ec8ea',
        fish: '#8fd9ff',
        berries: '#d86f87',
        well: '#7ec8ea'
    };
    const MAP_ZOOM_MIN = 0.75;
    const MAP_ZOOM_BASE_MAX = 4;
    const MAP_ZOOM_PER_ISLAND = 0.45;
    const MAP_ZOOM_HARD_MAX = 10;
    const MAP_ZOOM_STEP = 1.25;
    const MAP_HOVER_DELAY_MS = 2000;
    const MOBILE_BREAKPOINT = 760;
    const MAP_POINTER_MOVE_THRESHOLD = 6;

    let elements = null;
    let eventsBound = false;
    let mapZoom = 1;
    let hasManualMapPan = false;
    let mapPanOffsetX = 0;
    let mapPanOffsetY = 0;
    let lastRenderedLayout = null;
    let lastRenderedBounds = null;
    let lastRenderedTileIndex = new Map();
    let activeDragPointerId = null;
    let lastDragClientX = 0;
    let lastDragClientY = 0;
    let dragStartClientX = 0;
    let dragStartClientY = 0;
    let didMapPointerMove = false;
    let mapPointerCanPan = false;
    let mapHoverTimerId = null;
    let mapHoverTileKey = '';
    let mapHoverCanvasX = 0;
    let mapHoverCanvasY = 0;
    let selectedMapIslandIndex = null;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function isDesktopViewport() {
        return !window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
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
            mapZoomValue: document.getElementById('mapZoomValue'),
            mapIslandBadge: document.getElementById('mapIslandBadge'),
            mapHoverCard: document.getElementById('mapHoverCard'),
            mapHoverCardTile: document.getElementById('mapHoverCardTile'),
            mapHoverCardIsland: document.getElementById('mapHoverCardIsland')
        };
        return elements;
    }

    function clearMapHoverTimer() {
        if (mapHoverTimerId !== null) {
            window.clearTimeout(mapHoverTimerId);
            mapHoverTimerId = null;
        }
    }

    function hideMapHoverCard() {
        const refs = elements || queryElements();

        if (refs.mapHoverCard) {
            refs.mapHoverCard.hidden = true;
            refs.mapHoverCard.setAttribute('aria-hidden', 'true');
        }
    }

    function hideSelectedMapIslandBadge() {
        const refs = elements || queryElements();

        if (refs.mapIslandBadge) {
            refs.mapIslandBadge.hidden = true;
            refs.mapIslandBadge.setAttribute('aria-hidden', 'true');
        }
    }

    function syncSelectedMapIslandBadge() {
        const refs = elements || queryElements();

        if (!refs.mapIslandBadge) {
            return;
        }

        if (!Number.isFinite(selectedMapIslandIndex)) {
            hideSelectedMapIslandBadge();
            return;
        }

        refs.mapIslandBadge.textContent = `Выбран остров ${Math.floor(selectedMapIslandIndex)}`;
        refs.mapIslandBadge.hidden = false;
        refs.mapIslandBadge.setAttribute('aria-hidden', 'false');
    }

    function resetMapHoverState() {
        clearMapHoverTimer();
        mapHoverTileKey = '';
        hideMapHoverCard();
    }

    function resetSelectedMapIsland() {
        selectedMapIslandIndex = null;
        hideSelectedMapIslandBadge();
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

        if (refs.mapCanvas) {
            refs.mapCanvas.addEventListener('pointerdown', handleMapPointerDown);
            refs.mapCanvas.addEventListener('pointermove', handleMapPointerMove);
            refs.mapCanvas.addEventListener('pointerup', handleMapPointerUp);
            refs.mapCanvas.addEventListener('pointercancel', handleMapPointerUp);
            refs.mapCanvas.addEventListener('lostpointercapture', handleMapPointerUp);
            refs.mapCanvas.addEventListener('pointerleave', handleMapPointerLeave);
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

    function getVisitedIslandCount() {
        const visitedIslandIds = game.state.visitedIslandIds || {};
        const discoveredCount = Object.values(visitedIslandIds).reduce((count, isVisited) => (
            isVisited ? count + 1 : count
        ), 0);

        return Math.max(1, discoveredCount || 1);
    }

    function getMapZoomMax(stats = null) {
        const discoveredIslands = Math.max(
            getVisitedIslandCount(),
            stats && Number.isFinite(stats.islandCount) ? stats.islandCount : 1
        );

        return clamp(
            MAP_ZOOM_BASE_MAX + (discoveredIslands - 1) * MAP_ZOOM_PER_ISLAND,
            MAP_ZOOM_MIN,
            MAP_ZOOM_HARD_MAX
        );
    }

    function updateZoomControls(stats = null) {
        const refs = elements || queryElements();
        const zoomMax = getMapZoomMax(stats);

        if (refs.mapZoomValue) {
            refs.mapZoomValue.textContent = `${Math.round(mapZoom * 100)}%`;
        }

        if (refs.mapZoomIn) {
            refs.mapZoomIn.disabled = mapZoom >= zoomMax - 0.001;
        }

        if (refs.mapZoomOut) {
            refs.mapZoomOut.disabled = mapZoom <= MAP_ZOOM_MIN + 0.001;
        }
    }

    function setMapZoom(nextZoom, options = {}) {
        const clampedZoom = clamp(nextZoom, MAP_ZOOM_MIN, getMapZoomMax());
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
            resetMapPan();
            resetMapHoverState();
            resetSelectedMapIsland();
            setMapZoom(mapZoom, { silent: true });
            const runtime = getMapRuntime();
            if (runtime && typeof runtime.captureVisibleWorld === 'function') {
                const focusChunkX = Math.floor(game.state.playerPos.x / game.config.chunkSize);
                const focusChunkY = Math.floor(game.state.playerPos.y / game.config.chunkSize);
                runtime.captureVisibleWorld(focusChunkX, focusChunkY);
            }
        } else {
            stopMapDrag();
            resetMapHoverState();
            resetSelectedMapIsland();
        }

        bridge.renderAfterStateChange();
        return nextValue;
    }

    function resetMapPan() {
        hasManualMapPan = false;
        mapPanOffsetX = 0;
        mapPanOffsetY = 0;
        stopMapDrag();
    }

    function stopMapDrag() {
        const refs = elements || queryElements();
        activeDragPointerId = null;
        didMapPointerMove = false;
        mapPointerCanPan = false;

        if (refs.mapCanvas) {
            refs.mapCanvas.classList.remove('is-dragging');
        }
    }

    function getMapBookmarksByKey() {
        if (!game.state.mapBookmarksByKey || typeof game.state.mapBookmarksByKey !== 'object' || Array.isArray(game.state.mapBookmarksByKey)) {
            game.state.mapBookmarksByKey = {};
        }

        return game.state.mapBookmarksByKey;
    }

    function getMapBookmarks() {
        return Object.values(getMapBookmarksByKey())
            .filter((bookmark) => bookmark && Number.isFinite(bookmark.x) && Number.isFinite(bookmark.y));
    }

    function toggleMapBookmark(entry) {
        if (!entry || !Number.isFinite(entry.x) || !Number.isFinite(entry.y)) {
            return false;
        }

        const bookmarksByKey = getMapBookmarksByKey();
        const key = `${entry.x},${entry.y}`;

        if (bookmarksByKey[key]) {
            delete bookmarksByKey[key];
            return false;
        }

        bookmarksByKey[key] = {
            x: entry.x,
            y: entry.y,
            islandIndex: Number.isFinite(entry.islandIndex) ? entry.islandIndex : null,
            tileType: entry.tileType === 'house'
                ? 'house'
                : (entry.baseTileType || entry.tileType || 'unloaded')
        };
        return true;
    }

    function buildTileIndex(exploredTiles) {
        return exploredTiles.reduce((index, entry) => {
            index.set(`${entry.x},${entry.y}`, entry);
            return index;
        }, new Map());
    }

    function getMapPointerPosition(event) {
        const refs = elements || queryElements();

        if (!refs.mapCanvas) {
            return null;
        }

        const rect = refs.mapCanvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    function resolveHoveredMapTile(canvasX, canvasY) {
        if (!lastRenderedLayout || !lastRenderedBounds || !lastRenderedTileIndex || lastRenderedTileIndex.size === 0) {
            return null;
        }

        const localX = (canvasX - lastRenderedLayout.offsetX) / lastRenderedLayout.cellSize;
        const localY = (canvasY - lastRenderedLayout.offsetY) / lastRenderedLayout.cellSize;

        if (localX < 0 || localY < 0 || localX >= lastRenderedLayout.worldWidth || localY >= lastRenderedLayout.worldHeight) {
            return null;
        }

        const worldX = lastRenderedBounds.minX + Math.floor(localX);
        const worldY = lastRenderedBounds.minY + Math.floor(localY);
        const key = `${worldX},${worldY}`;
        const entry = lastRenderedTileIndex.get(key) || null;

        if (!entry) {
            return null;
        }

        return { key, entry };
    }

    function positionMapHoverCard(canvasX, canvasY) {
        const refs = elements || queryElements();

        if (!refs.mapHoverCard || !refs.mapCanvas || !refs.mapCanvas.parentElement) {
            return;
        }

        const wrap = refs.mapCanvas.parentElement;
        const wrapWidth = wrap.clientWidth;
        const wrapHeight = wrap.clientHeight;
        const offsetX = refs.mapCanvas.offsetLeft + canvasX;
        const offsetY = refs.mapCanvas.offsetTop + canvasY;
        const cardWidth = refs.mapHoverCard.offsetWidth || 180;
        const cardHeight = refs.mapHoverCard.offsetHeight || 64;
        const nextLeft = clamp(offsetX + 18, 8, Math.max(8, wrapWidth - cardWidth - 8));
        const nextTop = clamp(offsetY + 18, 8, Math.max(8, wrapHeight - cardHeight - 8));

        refs.mapHoverCard.style.left = `${Math.round(nextLeft)}px`;
        refs.mapHoverCard.style.top = `${Math.round(nextTop)}px`;
    }

    function showMapHoverCard(entry, canvasX, canvasY) {
        const refs = elements || queryElements();

        if (!refs.mapHoverCard || !refs.mapHoverCardTile || !refs.mapHoverCardIsland) {
            return;
        }

        const tileType = entry.tileType === 'house'
            ? 'house'
            : (entry.baseTileType || entry.tileType || 'unloaded');
        const tileLabel = bridge.getTileLabel(tileType);

        refs.mapHoverCardTile.textContent = `Клетка: ${tileLabel}`;
        refs.mapHoverCardIsland.textContent = Number.isFinite(entry.islandIndex)
            ? `Остров ${entry.islandIndex}`
            : 'Остров не определён';
        refs.mapHoverCard.hidden = false;
        refs.mapHoverCard.setAttribute('aria-hidden', 'false');
        positionMapHoverCard(canvasX, canvasY);
    }

    function scheduleMapHoverCard(tileKey, canvasX, canvasY) {
        clearMapHoverTimer();
        mapHoverTileKey = tileKey;
        mapHoverCanvasX = canvasX;
        mapHoverCanvasY = canvasY;

        mapHoverTimerId = window.setTimeout(() => {
            mapHoverTimerId = null;

            if (!isMapOpen() || activeDragPointerId !== null) {
                return;
            }

            const hovered = resolveHoveredMapTile(mapHoverCanvasX, mapHoverCanvasY);
            if (!hovered || hovered.key !== mapHoverTileKey) {
                return;
            }

            showMapHoverCard(hovered.entry, mapHoverCanvasX, mapHoverCanvasY);
        }, MAP_HOVER_DELAY_MS);
    }

    function handleDesktopMapHover(event) {
        if (!isMapOpen() || activeDragPointerId !== null || event.pointerType !== 'mouse' || !isDesktopViewport()) {
            resetMapHoverState();
            return;
        }

        const pointerPosition = getMapPointerPosition(event);
        if (!pointerPosition) {
            resetMapHoverState();
            return;
        }

        const hovered = resolveHoveredMapTile(pointerPosition.x, pointerPosition.y);
        if (!hovered) {
            resetMapHoverState();
            return;
        }

        if (hovered.key === mapHoverTileKey) {
            mapHoverCanvasX = pointerPosition.x;
            mapHoverCanvasY = pointerPosition.y;

            const refs = elements || queryElements();
            if (refs.mapHoverCard && !refs.mapHoverCard.hidden) {
                positionMapHoverCard(pointerPosition.x, pointerPosition.y);
            }

            return;
        }

        hideMapHoverCard();
        scheduleMapHoverCard(hovered.key, pointerPosition.x, pointerPosition.y);
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

    function isIslandLandEntry(entry) {
        if (!entry) {
            return false;
        }

        if (entry.tileType === 'house') {
            return true;
        }

        const baseTileType = entry.baseTileType || entry.tileType || '';
        return baseTileType !== 'water' && baseTileType !== 'unloaded';
    }

    function resolveClickedIslandIndex(entry) {
        if (!entry || !isIslandLandEntry(entry) || !Number.isFinite(entry.islandIndex)) {
            return null;
        }

        return Math.max(1, Math.floor(entry.islandIndex));
    }

    function selectMapIsland(entry) {
        const islandIndex = resolveClickedIslandIndex(entry);
        selectedMapIslandIndex = islandIndex;
        syncSelectedMapIslandBadge();
        return islandIndex;
    }

    function hasSameIslandLandNeighbor(tileIndex, islandIndex, worldX, worldY) {
        const neighbor = tileIndex.get(`${worldX},${worldY}`);
        return Boolean(
            neighbor
            && Number.isFinite(neighbor.islandIndex)
            && Math.floor(neighbor.islandIndex) === islandIndex
            && isIslandLandEntry(neighbor)
        );
    }

    function drawSelectedIslandOutline(ctx, exploredTiles, tileIndex, bounds, layout, islandIndex) {
        if (!Number.isFinite(islandIndex) || !Array.isArray(exploredTiles) || exploredTiles.length === 0 || !tileIndex || tileIndex.size === 0) {
            return;
        }

        const normalizedIslandIndex = Math.floor(islandIndex);
        const segments = [];

        exploredTiles.forEach((entry) => {
            if (!entry || !isIslandLandEntry(entry) || Math.floor(entry.islandIndex) !== normalizedIslandIndex) {
                return;
            }

            const left = getCanvasX(entry.x, bounds, layout);
            const top = getCanvasY(entry.y, bounds, layout);
            const right = left + layout.cellSize;
            const bottom = top + layout.cellSize;

            if (!hasSameIslandLandNeighbor(tileIndex, normalizedIslandIndex, entry.x, entry.y - 1)) {
                segments.push([left, top, right, top]);
            }

            if (!hasSameIslandLandNeighbor(tileIndex, normalizedIslandIndex, entry.x + 1, entry.y)) {
                segments.push([right, top, right, bottom]);
            }

            if (!hasSameIslandLandNeighbor(tileIndex, normalizedIslandIndex, entry.x, entry.y + 1)) {
                segments.push([left, bottom, right, bottom]);
            }

            if (!hasSameIslandLandNeighbor(tileIndex, normalizedIslandIndex, entry.x - 1, entry.y)) {
                segments.push([left, top, left, bottom]);
            }
        });

        if (segments.length === 0) {
            return;
        }

        const traceSegments = () => {
            ctx.beginPath();
            segments.forEach(([startX, startY, endX, endY]) => {
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
            });
        };
        const glowWidth = Math.max(4, layout.cellSize * 0.5);
        const coreWidth = Math.max(2, layout.cellSize * 0.2);

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        traceSegments();
        ctx.strokeStyle = 'rgba(159, 255, 120, 0.9)';
        ctx.lineWidth = glowWidth;
        ctx.shadowColor = 'rgba(179, 255, 125, 0.92)';
        ctx.shadowBlur = Math.max(10, layout.cellSize * 1.35);
        ctx.stroke();

        traceSegments();
        ctx.strokeStyle = '#ebffad';
        ctx.lineWidth = coreWidth;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.restore();
    }

    function drawBackground(ctx, width, height) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#102018');
        gradient.addColorStop(1, '#08100c');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    function drawBookmarkMarker(ctx, centerX, centerY, cellSize) {
        const scale = 3;
        const flagWidth = Math.max(24, cellSize * 0.68 * scale);
        const flagHeight = Math.max(30, cellSize * 0.92 * scale);
        const halfWidth = flagWidth / 2;
        const topY = centerY - flagHeight * 0.58;
        const bottomY = topY + flagHeight;
        const notchY = bottomY - Math.max(3, flagHeight * 0.24);

        ctx.save();
        ctx.shadowColor = 'rgba(255, 110, 140, 0.34)';
        ctx.shadowBlur = Math.max(10, cellSize * 0.9);
        ctx.beginPath();
        ctx.moveTo(centerX - halfWidth, topY);
        ctx.lineTo(centerX + halfWidth, topY);
        ctx.lineTo(centerX + halfWidth, bottomY);
        ctx.lineTo(centerX, notchY);
        ctx.lineTo(centerX - halfWidth, bottomY);
        ctx.closePath();
        ctx.fillStyle = '#ff7d8d';
        ctx.fill();
        ctx.strokeStyle = '#7a2330';
        ctx.lineWidth = Math.max(2, cellSize * 0.18);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY - flagHeight * 0.14, Math.max(4, cellSize * 0.26), 0, Math.PI * 2);
        ctx.fillStyle = '#fff4cf';
        ctx.fill();

        ctx.restore();
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
        const canPanX = mapWidth > availableWidth;
        const canPanY = mapHeight > availableHeight;
        const centeredOffsetX = Math.floor((contextState.width - mapWidth) / 2);
        const centeredOffsetY = Math.floor((contextState.height - mapHeight) / 2);
        const minOffsetX = canPanX ? contextState.width - padding - mapWidth : centeredOffsetX;
        const maxOffsetX = canPanX ? padding : centeredOffsetX;
        const minOffsetY = canPanY ? contextState.height - padding - mapHeight : centeredOffsetY;
        const maxOffsetY = canPanY ? padding : centeredOffsetY;
        const desiredOffsetX = canPanX
            ? contextState.width / 2 - ((game.state.playerPos.x - bounds.minX) + 0.5) * cellSize
            : centeredOffsetX;
        const desiredOffsetY = canPanY
            ? contextState.height / 2 - ((game.state.playerPos.y - bounds.minY) + 0.5) * cellSize
            : centeredOffsetY;
        const preferredOffsetX = hasManualMapPan && canPanX ? mapPanOffsetX : desiredOffsetX;
        const preferredOffsetY = hasManualMapPan && canPanY ? mapPanOffsetY : desiredOffsetY;
        const offsetX = Math.round(clamp(preferredOffsetX, minOffsetX, maxOffsetX));
        const offsetY = Math.round(clamp(preferredOffsetY, minOffsetY, maxOffsetY));

        return {
            padding,
            worldWidth,
            worldHeight,
            cellSize,
            mapWidth,
            mapHeight,
            offsetX,
            offsetY,
            canPanX,
            canPanY,
            minOffsetX,
            maxOffsetX,
            minOffsetY,
            maxOffsetY
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
        syncSelectedMapIslandBadge();

        if (!Array.isArray(exploredTiles) || exploredTiles.length === 0) {
            lastRenderedLayout = null;
            lastRenderedBounds = null;
            lastRenderedTileIndex = new Map();
            resetMapHoverState();
            hideSelectedMapIslandBadge();
            if (refs.mapCanvas) {
                refs.mapCanvas.classList.remove('is-pannable', 'is-dragging');
            }
            refs.mapPanelSummary.textContent = 'Разведанных мест пока нет.';
            drawEmptyState(contextState.ctx, contextState.width, contextState.height);
            return;
        }

        const bounds = getWorldBounds(exploredTiles);
        const layout = buildMapLayout(bounds, contextState);
        const markers = buildMarkerSets(exploredTiles);
        const stats = buildMapStats(exploredTiles);
        const bookmarks = getMapBookmarks();
        const playerX = getCanvasX(game.state.playerPos.x, bounds, layout) + layout.cellSize / 2;
        const playerY = getCanvasY(game.state.playerPos.y, bounds, layout) + layout.cellSize / 2;
        const ctx = contextState.ctx;
        const isPannable = layout.canPanX || layout.canPanY;

        lastRenderedLayout = layout;
        lastRenderedBounds = bounds;
        lastRenderedTileIndex = buildTileIndex(exploredTiles);
        resetMapHoverState();

        if (hasManualMapPan) {
            mapPanOffsetX = layout.offsetX;
            mapPanOffsetY = layout.offsetY;
        }

        if (refs.mapCanvas) {
            refs.mapCanvas.classList.toggle('is-pannable', isPannable);
            refs.mapCanvas.classList.toggle('is-dragging', isPannable && activeDragPointerId !== null);
        }

        refs.mapPanelSummary.textContent = `Разведано клеток: ${exploredTiles.length} · домов: ${stats.houseCount} · квестодателей: ${stats.questCount} · ресурсов: ${stats.resourceCount}`;
        updateZoomControls(stats);

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

        bookmarks.forEach((bookmark) => {
            if (
                bookmark.x < bounds.minX
                || bookmark.x > bounds.maxX
                || bookmark.y < bounds.minY
                || bookmark.y > bounds.maxY
            ) {
                return;
            }

            const drawX = getCanvasX(bookmark.x, bounds, layout) + layout.cellSize / 2;
            const drawY = getCanvasY(bookmark.y, bounds, layout) + layout.cellSize / 2;
            drawBookmarkMarker(ctx, drawX, drawY, layout.cellSize);
        });

        drawSelectedIslandOutline(
            ctx,
            exploredTiles,
            lastRenderedTileIndex,
            bounds,
            layout,
            selectedMapIslandIndex
        );

        ctx.fillStyle = '#f8f3d0';
        ctx.beginPath();
        ctx.arc(playerX, playerY, Math.max(3, layout.cellSize * 0.42), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#203528';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function handleMapPointerDown(event) {
        if (!isMapOpen() || !lastRenderedLayout) {
            return;
        }

        resetMapHoverState();

        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }

        const refs = elements || queryElements();
        mapPanOffsetX = lastRenderedLayout.offsetX;
        mapPanOffsetY = lastRenderedLayout.offsetY;
        activeDragPointerId = event.pointerId;
        lastDragClientX = event.clientX;
        lastDragClientY = event.clientY;
        dragStartClientX = event.clientX;
        dragStartClientY = event.clientY;
        didMapPointerMove = false;
        mapPointerCanPan = Boolean(lastRenderedLayout.canPanX || lastRenderedLayout.canPanY);

        if (refs.mapCanvas && typeof refs.mapCanvas.setPointerCapture === 'function') {
            refs.mapCanvas.setPointerCapture(event.pointerId);
        }

        event.preventDefault();
    }

    function handleMapPointerMove(event) {
        handleDesktopMapHover(event);

        if (activeDragPointerId === null || event.pointerId !== activeDragPointerId || !lastRenderedLayout) {
            return;
        }

        if (!didMapPointerMove) {
            const totalDeltaX = event.clientX - dragStartClientX;
            const totalDeltaY = event.clientY - dragStartClientY;

            if (Math.hypot(totalDeltaX, totalDeltaY) < MAP_POINTER_MOVE_THRESHOLD) {
                return;
            }

            didMapPointerMove = true;
            lastDragClientX = event.clientX;
            lastDragClientY = event.clientY;

            if (mapPointerCanPan) {
                const refs = elements || queryElements();
                hasManualMapPan = true;
                if (refs.mapCanvas) {
                    refs.mapCanvas.classList.add('is-dragging');
                }
            }

            if (!mapPointerCanPan) {
                return;
            }
        }

        if (!mapPointerCanPan) {
            return;
        }

        const deltaX = event.clientX - lastDragClientX;
        const deltaY = event.clientY - lastDragClientY;
        lastDragClientX = event.clientX;
        lastDragClientY = event.clientY;

        if (lastRenderedLayout.canPanX) {
            mapPanOffsetX += deltaX;
        }

        if (lastRenderedLayout.canPanY) {
            mapPanOffsetY += deltaY;
        }

        renderMapPanel();
        event.preventDefault();
    }

    function handleMapPointerUp(event) {
        const refs = elements || queryElements();
        const isActivePointer = activeDragPointerId !== null && event.pointerId === activeDragPointerId;
        const shouldToggleBookmark = isActivePointer && !didMapPointerMove && event.type === 'pointerup' && isDesktopViewport();
        const pointerPosition = shouldToggleBookmark
            ? getMapPointerPosition(event)
            : null;

        if (isActivePointer && refs.mapCanvas && typeof refs.mapCanvas.releasePointerCapture === 'function') {
            try {
                refs.mapCanvas.releasePointerCapture(event.pointerId);
            } catch (error) {
                // Pointer capture may already be released by the browser.
            }
        }

        stopMapDrag();

        if (!shouldToggleBookmark || !pointerPosition) {
            return;
        }

        const hovered = resolveHoveredMapTile(pointerPosition.x, pointerPosition.y);
        if (!hovered) {
            return;
        }

        selectMapIsland(hovered.entry);
        toggleMapBookmark(hovered.entry);
        renderMapPanel();
    }

    function handleMapPointerLeave() {
        resetMapHoverState();
    }

    function syncMapState() {
        const refs = elements || queryElements();
        bindEvents();
        setMapZoom(mapZoom, { silent: true });
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
        } else {
            resetMapHoverState();
            hideSelectedMapIslandBadge();
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
