function projectIso(x, y) {
    const { tileWidth, tileHeight } = window.Game.config;

    return {
        x: (x - y) * tileWidth / 2,
        y: (x + y) * tileHeight / 2
    };
}

function isoToScreen(x, y) {
    const worldPos = projectIso(x, y);

    return {
        x: worldPos.x + window.Game.camera.offset.x,
        y: worldPos.y + window.Game.camera.offset.y
    };
}

function centerCameraOn(position) {
    const game = window.Game;
    const worldPos = projectIso(position.x, position.y);

    game.camera.offset.x = game.canvas.width / 2 - worldPos.x;
    game.camera.offset.y = game.canvas.height / 2 - worldPos.y;
    game.camera.target.x = game.camera.offset.x;
    game.camera.target.y = game.camera.offset.y;
}

function updateCamera(focusPos) {
    const game = window.Game;
    const worldPos = projectIso(focusPos.x, focusPos.y);

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

window.Game.systems.camera = {
    projectIso,
    isoToScreen,
    centerCameraOn,
    updateCamera,
    isCameraSettled,
    stopCameraAnimation
};
