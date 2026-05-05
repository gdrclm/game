(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const GROUP_ID = 'recovery';
    const STUB = Object.freeze({
        groupId: GROUP_ID,
        status: 'contract_first_stub',
        canonicalPath: 'js/worldgen/phase2/recovery/',
        uiCoupling: false,
        implementsFieldLogic: false,
        purpose: 'Recovery and relief entry point kept separate from pressure and rhythm synthesis.'
    });

    function getPhase2RecoveryModuleStub() {
        return STUB;
    }

    phase2.__contractFirstStubs = phase2.__contractFirstStubs || {};
    phase2.__contractFirstStubs[GROUP_ID] = STUB;

    Object.assign(phase2, {
        getPhase2RecoveryModuleStub
    });
})();
