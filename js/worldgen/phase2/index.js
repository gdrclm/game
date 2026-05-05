(() => {
    const game = window.Game;
    const worldgen = game.systems.worldgen = game.systems.worldgen || {};
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const SKELETON_STATUS = 'contract_first_stub';
    const CANONICAL_PATH = 'js/worldgen/phase2/';
    const SKELETON_GROUP_IDS = Object.freeze([
        'contracts',
        'intake',
        'binding',
        'normalization',
        'pressure',
        'recovery',
        'rhythm',
        'summaries',
        'validation',
        'rebalance',
        'debug',
        'export',
        'orchestration',
        'tests'
    ]);

    function getPhase2SkeletonStatus() {
        return Object.freeze({
            phaseId: 'phase2',
            status: SKELETON_STATUS,
            canonicalPath: CANONICAL_PATH,
            uiCoupling: false,
            implementsFieldLogic: false,
            groups: SKELETON_GROUP_IDS.slice()
        });
    }

    function getPhase2PublicApi() {
        return Object.freeze({
            getPhase2SkeletonStatus
        });
    }

    Object.assign(phase2, {
        getPhase2SkeletonStatus,
        getPhase2PublicApi
    });

    worldgen.phase2 = phase2;
    worldgen.getPhase2PublicApi = getPhase2PublicApi;
})();
