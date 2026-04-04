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
        targetHeight: 64,
        frames: {
            north: {
                src: 'assets/hero/top.png',
                sourceX: 170,
                sourceY: 80,
                sourceWidth: 684,
                sourceHeight: 840,
                footX: 342,
                footY: 758,
                flipX: false
            },
            south: {
                src: 'assets/hero/bottom.png',
                sourceX: 170,
                sourceY: 80,
                sourceWidth: 684,
                sourceHeight: 840,
                footX: 342,
                footY: 758,
                flipX: false
            },
            east: {
                src: 'assets/hero/side.png',
                sourceX: 170,
                sourceY: 80,
                sourceWidth: 684,
                sourceHeight: 840,
                footX: 342,
                footY: 758,
                flipX: true
            },
            west: {
                src: 'assets/hero/side.png',
                sourceX: 170,
                sourceY: 80,
                sourceWidth: 684,
                sourceHeight: 840,
                footX: 342,
                footY: 758,
                flipX: false
            },
            northWest: {
                src: 'assets/hero/top_side.png',
                sourceX: 170,
                sourceY: 80,
                sourceWidth: 684,
                sourceHeight: 840,
                footX: 342,
                footY: 758,
                flipX: false
            },
            northEast: {
                src: 'assets/hero/top_side.png',
                sourceX: 170,
                sourceY: 80,
                sourceWidth: 684,
                sourceHeight: 840,
                footX: 342,
                footY: 758,
                flipX: true
            },
            southEast: {
                src: 'assets/hero/side_bottom.png',
                sourceX: 170,
                sourceY: 80,
                sourceWidth: 684,
                sourceHeight: 840,
                footX: 342,
                footY: 758,
                flipX: true
            },
            southWest: {
                src: 'assets/hero/side_bottom.png',
                sourceX: 170,
                sourceY: 80,
                sourceWidth: 684,
                sourceHeight: 840,
                footX: 342,
                footY: 758,
                flipX: false
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
