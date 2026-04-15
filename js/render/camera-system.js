function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

const reusableProjectionPoint = { x: 0, y: 0 };

function projectIsoTo(x, y, out = {}) {
    const { tileWidth, tileHeight } = window.Game.config;

    out.x = (x - y) * tileWidth / 2;
    out.y = (x + y) * tileHeight / 2;
    return out;
}

function projectIso(x, y) {
    return projectIsoTo(x, y, {});
}

function isoToScreenTo(x, y, out = {}) {
    projectIsoTo(x, y, out);
    out.x += window.Game.camera.offset.x;
    out.y += window.Game.camera.offset.y;
    return out;
}

function isoToScreen(x, y) {
    return isoToScreenTo(x, y, {});
}

function centerCameraOn(position) {
    const game = window.Game;
    const worldPos = projectIsoTo(position.x, position.y, reusableProjectionPoint);

    game.camera.offset.x = game.canvas.width / 2 - worldPos.x;
    game.camera.offset.y = game.canvas.height / 2 - worldPos.y;
    game.camera.target.x = game.camera.offset.x;
    game.camera.target.y = game.camera.offset.y;
}

function updateCamera(focusPos) {
    const game = window.Game;
    const worldPos = projectIsoTo(focusPos.x, focusPos.y, reusableProjectionPoint);

    game.camera.target.x = game.canvas.width / 2 - worldPos.x;
    game.camera.target.y = game.canvas.height / 2 - worldPos.y;
    game.camera.offset.x += (game.camera.target.x - game.camera.offset.x) * game.camera.lerpFactor;
    game.camera.offset.y += (game.camera.target.y - game.camera.offset.y) * game.camera.lerpFactor;
}

function isCameraSettled() {
    const game = window.Game;
    const tolerance = 0.5;

    return (
        Math.abs(game.camera.target.x - game.camera.offset.x) < tolerance &&
        Math.abs(game.camera.target.y - game.camera.offset.y) < tolerance
    );
}

function stopCameraAnimation() {
    const state = window.Game.state;

    if (state.cameraAnimationRequestId) {
        cancelAnimationFrame(state.cameraAnimationRequestId);
        state.cameraAnimationRequestId = null;
    }
}

function getZoom() {
    const game = window.Game;
    const rawZoom = Number.isFinite(game.camera.zoom) ? game.camera.zoom : 1;

    return clamp(rawZoom, game.config.cameraZoomMin || 0.7, game.config.cameraZoomMax || 1.4);
}

function setZoom(zoom) {
    const game = window.Game;
    const safeZoom = clamp(
        Number.isFinite(zoom) ? zoom : 1,
        game.config.cameraZoomMin || 0.7,
        game.config.cameraZoomMax || 1.4
    );

    game.camera.zoom = safeZoom;
    return safeZoom;
}

window.Game.systems.camera = {
    projectIso,
    projectIsoTo,
    isoToScreen,
    isoToScreenTo,
    centerCameraOn,
    updateCamera,
    isCameraSettled,
    stopCameraAnimation,
    getZoom,
    setZoom
};
