(() => {
    const stateSchema = window.Game.systems.stateSchema;
    window.Game.state = stateSchema ? stateSchema.createInitialState() : {};
})();
