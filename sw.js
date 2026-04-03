const APP_VERSION = '20260403m';
const STATIC_CACHE_NAME = `iso-game-static-${APP_VERSION}`;
const RUNTIME_CACHE_NAME = `iso-game-runtime-${APP_VERSION}`;
const CACHE_PREFIX = 'iso-game-';
const PRECACHE_URLS = [
    'index.html',
    'manifest.webmanifest?v=20260403m',
    'css/style.css?v=20260403j',
    'assets/character_idle.png',
    'assets/pwa/apple-touch-icon.png?v=20260403m',
    'assets/pwa/favicon-64.png?v=20260403m',
    'assets/pwa/icon-192.png?v=20260403m',
    'assets/pwa/icon-192-maskable.png?v=20260403m',
    'assets/pwa/icon-512.png?v=20260403m',
    'assets/pwa/icon-512-maskable.png?v=20260403m',
    'js/config.js',
    'js/state/game-state-schema.js?v=20260402e',
    'js/game-state.js',
    'js/state/save-load.js',
    'js/utils.js',
    'js/content-registry.js?v=20260329h',
    'js/world/chunk-store.js',
    'js/world/tile-query.js',
    'js/world-system.js',
    'js/inventory/item-catalog.js?v=20260402aa',
    'js/inventory/item-registry.js?v=20260402m',
    'js/economy/pricing.js',
    'js/economy/reward-scaling.js',
    'js/quests/quest-registry.js',
    'js/quests/bag-upgrade-data.js?v=20260402aa',
    'js/quests/bag-upgrade-runtime.js?v=20260402aa',
    'js/quests/quest-runtime.js?v=20260402e',
    'js/economy/shop-runtime.js?v=20260402m',
    'js/loot-system.js?v=20260402m',
    'js/expedition-system.js?v=20260402a',
    'js/expedition/expedition-shared.js',
    'js/expedition/shape-builders.js',
    'js/expedition/house-profiles.js?v=20260402aa',
    'js/expedition/island-layout.js?v=20260402i',
    'js/expedition/progression.js',
    'js/expedition/weather-runtime.js?v=20260402b',
    'js/expedition/bridge-runtime.js',
    'js/effects-system.js',
    'js/houses/layout/house-layout-core.js',
    'js/houses/layout/house-footprints.js',
    'js/houses/layout/house-layout-metadata.js',
    'js/houses/layout/house-placement.js',
    'js/houses/render/house-palettes.js',
    'js/houses/render/house-svg-utils.js',
    'js/houses/render/house-body-builder.js',
    'js/houses/render/house-interior-builder.js',
    'js/houses/render/house-roof-builder.js',
    'js/houses/render/house-svg-builder.js',
    'js/houses/render/house-variant-cache.js',
    'js/houses/render/house-drawer.js?v=20260402i',
    'js/houses/house-runtime.js',
    'js/interaction-system.js',
    'js/interactions/world-spawn-runtime.js?v=20260402aa',
    'js/interactions/interaction-router.js?v=20260402e',
    'js/map-generator.js',
    'js/map/topology-painter.js',
    'js/map/chunk-generator.js?v=20260402i',
    'js/map/map-runtime.js?v=20260402aa',
    'js/render/camera-system.js',
    'js/render/chunk-renderer.js?v=20260402h',
    'js/render/interaction-renderer.js?v=20260402aa',
    'js/render/effect-renderer.js',
    'js/render/player-renderer.js',
    'js/render/debug-renderer.js?v=20260402b',
    'js/render/entity-renderer.js?v=20260329i',
    'js/render/scene-renderer.js?v=20260402c',
    'js/pathfinding.js',
    'js/movement.js?v=20260402b',
    'js/input.js?v=20260402c',
    'js/ui/ui-system.js?v=20260402l',
    'js/ui/status-ui.js?v=20260402g',
    'js/ui/inventory-ui.js?v=20260402n',
    'js/inventory/inventory-runtime.js',
    'js/inventory/item-effects.js?v=20260402m',
    'js/npc/npc-registry.js?v=20260402aa',
    'js/npc/npc-runtime.js?v=20260402aa',
    'js/dialogue/dialogue-registry.js?v=20260402aa',
    'js/dialogue/dialogue-runtime.js',
    'js/ui/action-ui.js?v=20260402r',
    'js/ui/merchant-ui.js?v=20260402m',
    'js/ui/dialogue-ui.js',
    'js/ui/quest-ui.js?v=20260402aa',
    'js/ui/map-ui.js?v=20260402e',
    'js/init.js',
    'js/pwa.js?v=20260403a'
];

function toAbsoluteUrl(path) {
    return new URL(path, self.registration.scope).toString();
}

function normalizeUrl(input) {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const scopeUrl = new URL(self.registration.scope);

    if (url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopeUrl.pathname)) {
        return null;
    }

    url.hash = '';
    url.search = '';

    if (url.pathname === scopeUrl.pathname) {
        url.pathname = `${scopeUrl.pathname}index.html`;
    }

    return url.toString();
}

async function storeResponse(cache, requestUrl, response) {
    await cache.put(requestUrl, response.clone());

    const normalizedUrl = normalizeUrl(requestUrl);

    if (normalizedUrl && normalizedUrl !== requestUrl) {
        await cache.put(normalizedUrl, response.clone());
    }
}

async function precacheUrl(cache, relativeUrl) {
    const absoluteUrl = toAbsoluteUrl(relativeUrl);
    const response = await fetch(absoluteUrl, { cache: 'no-cache' });

    if (!response.ok) {
        throw new Error(`Precache failed for ${relativeUrl}`);
    }

    await storeResponse(cache, absoluteUrl, response);
}

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(STATIC_CACHE_NAME);
        await Promise.all(PRECACHE_URLS.map((url) => precacheUrl(cache, url)));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();

        await Promise.all(
            cacheNames
                .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== STATIC_CACHE_NAME && cacheName !== RUNTIME_CACHE_NAME)
                .map((cacheName) => caches.delete(cacheName))
        );

        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
        return;
    }

    const requestUrl = new URL(request.url);
    const sameOrigin = requestUrl.origin === self.location.origin;

    if (request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    if (!sameOrigin && !['font', 'image', 'style'].includes(request.destination)) {
        return;
    }

    event.respondWith(handleAssetRequest(request, event));
});

async function handleNavigationRequest(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(RUNTIME_CACHE_NAME);
        await storeResponse(cache, request.url, response.clone());
        return response;
    } catch (error) {
        return (
            await caches.match(request)
            || await caches.match(normalizeUrl(request.url))
            || await caches.match(toAbsoluteUrl('index.html'))
            || Response.error()
        );
    }
}

async function handleAssetRequest(request, event) {
    const cachedResponse = await caches.match(request) || await caches.match(normalizeUrl(request.url));
    const networkResponsePromise = fetchAndCache(request);

    if (cachedResponse) {
        event.waitUntil(networkResponsePromise.catch(() => undefined));
        return cachedResponse;
    }

    try {
        return await networkResponsePromise;
    } catch (error) {
        return cachedResponse || Response.error();
    }
}

async function fetchAndCache(request) {
    const response = await fetch(request);

    if (response.ok || response.type === 'opaque') {
        const cache = await caches.open(RUNTIME_CACHE_NAME);
        await storeResponse(cache, request.url, response.clone());
    }

    return response;
}
