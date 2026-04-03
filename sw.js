const APP_VERSION = '20260403o';
const STATIC_CACHE_NAME = `iso-game-static-${APP_VERSION}`;
const RUNTIME_CACHE_NAME = `iso-game-runtime-${APP_VERSION}`;
const CACHE_PREFIX = 'iso-game-';
const PRECACHE_URLS = [
    'index.html',
    'manifest.webmanifest',
    'css/style.css',
    'assets/character_idle.png',
    'assets/pwa/apple-touch-icon.png',
    'assets/pwa/favicon-64.png',
    'assets/pwa/icon-192.png',
    'assets/pwa/icon-192-maskable.png',
    'assets/pwa/icon-512.png',
    'assets/pwa/icon-512-maskable.png',
    'js/config.js',
    'js/state/game-state-schema.js',
    'js/game-state.js',
    'js/state/save-load.js',
    'js/utils.js',
    'js/content-registry.js',
    'js/world/chunk-store.js',
    'js/world/tile-query.js',
    'js/world-system.js',
    'js/inventory/item-catalog.js',
    'js/inventory/item-registry.js',
    'js/economy/pricing.js',
    'js/economy/reward-scaling.js',
    'js/quests/quest-registry.js',
    'js/quests/bag-upgrade-data.js',
    'js/quests/bag-upgrade-runtime.js',
    'js/quests/quest-runtime.js',
    'js/economy/shop-runtime.js',
    'js/loot-system.js',
    'js/expedition-system.js',
    'js/expedition/expedition-shared.js',
    'js/expedition/shape-builders.js',
    'js/expedition/house-profiles.js',
    'js/expedition/island-layout.js',
    'js/expedition/progression.js',
    'js/expedition/weather-runtime.js',
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
    'js/houses/render/house-drawer.js',
    'js/houses/house-runtime.js',
    'js/interaction-system.js',
    'js/interactions/world-spawn-runtime.js',
    'js/interactions/interaction-router.js',
    'js/map-generator.js',
    'js/map/topology-painter.js',
    'js/map/chunk-generator.js',
    'js/map/map-runtime.js',
    'js/render/camera-system.js',
    'js/render/chunk-renderer.js',
    'js/render/interaction-renderer.js',
    'js/render/effect-renderer.js',
    'js/render/player-renderer.js',
    'js/render/debug-renderer.js',
    'js/render/entity-renderer.js',
    'js/render/scene-renderer.js',
    'js/pathfinding.js',
    'js/movement.js',
    'js/input.js',
    'js/ui/ui-system.js',
    'js/ui/status-ui.js',
    'js/ui/inventory-ui.js',
    'js/inventory/inventory-runtime.js',
    'js/inventory/item-effects.js',
    'js/npc/npc-registry.js',
    'js/npc/npc-runtime.js',
    'js/dialogue/dialogue-registry.js',
    'js/dialogue/dialogue-runtime.js',
    'js/ui/action-ui.js',
    'js/ui/merchant-ui.js',
    'js/ui/dialogue-ui.js',
    'js/ui/quest-ui.js',
    'js/ui/map-ui.js',
    'js/init.js',
    'js/pwa.js'
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
