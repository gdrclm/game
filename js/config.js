const gameConfig = {
    tileWidth: 64,
    tileHeight: 32,
    chunkSize: 21,
    viewDistance: 2,
    canvasWidth: 1200,
    canvasHeight: 800,
    maxPathLength: 2000,
    maxMoveCellsPerTurn: 5,
    moveDurationMs: 100,
    maxMovementStepsPerFrame: 6,
    cameraLerpFactor: 0.12,
    playerSprite: {
        src: 'assets/character_idle.png',
        targetHeight: 64,
        frames: {
            north: {
                sourceX: 191,
                sourceY: 128,
                sourceWidth: 262,
                sourceHeight: 378,
                footX: 137.5,
                footY: 377,
                flipX: false
            },
            south: {
                sourceX: 621,
                sourceY: 128,
                sourceWidth: 264,
                sourceHeight: 378,
                footX: 124,
                footY: 377,
                flipX: false
            },
            east: {
                sourceX: 1100,
                sourceY: 129,
                sourceWidth: 221,
                sourceHeight: 377,
                footX: 106.5,
                footY: 376,
                flipX: false
            },
            west: {
                sourceX: 1100,
                sourceY: 129,
                sourceWidth: 221,
                sourceHeight: 377,
                footX: 106.5,
                footY: 376,
                flipX: true
            },
            northWest: {
                sourceX: 240,
                sourceY: 595,
                sourceWidth: 229,
                sourceHeight: 354,
                footX: 113.5,
                footY: 353,
                flipX: false
            },
            northEast: {
                sourceX: 1089,
                sourceY: 595,
                sourceWidth: 234,
                sourceHeight: 354,
                footX: 108.79,
                footY: 353,
                flipX: false
            },
            southEast: {
                sourceX: 684,
                sourceY: 595,
                sourceWidth: 225,
                sourceHeight: 355,
                footX: 69,
                footY: 354,
                flipX: false
            },
            southWest: {
                sourceX: 684,
                sourceY: 595,
                sourceWidth: 225,
                sourceHeight: 355,
                footX: 69,
                footY: 354,
                flipX: true
            }
        }
    },
    worldSeed: null,
    riverChance: 0.35,
    rocksPerChunkMin: 3,
    rocksPerChunkMax: 8,
    rockPlacementAttempts: 100,
    chunkPreloadRadius: 1,
    chunkLoadMargin: 3,
    chunkUnloadDistance: 3,
    maxFrameDeltaMs: 48
};

const colors = {
    bridge: '#8B4513',
    grass: '#97fc97',
    water: '#5bc0de',
    player: '#d9534f',
    route: 'rgba(255, 165, 0, 0.5)',
    rock: '#8B4513',
    rockDark: '#5D2906'
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = gameConfig.canvasWidth;
canvas.height = gameConfig.canvasHeight;

window.Game = {
    config: gameConfig,
    colors,
    canvas,
    ctx,
    assets: {},
    camera: {
        offset: { x: 0, y: 0 },
        target: { x: 0, y: 0 },
        lerpFactor: gameConfig.cameraLerpFactor
    },
    state: null,
    debug: {
        enabled: true,
        element: document.getElementById('debugPanel')
    },
    systems: {}
};
