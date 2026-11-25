(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};

    function intakeMasterConstraints(input) {
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            throw new Error('[worldgen/macro] Phase 0 handoff is required.');
        }
        const summary = input.outputs && input.outputs.phase1SafeSummaryBundle
            ? input.outputs.phase1SafeSummaryBundle : input;
        const handoff = summary.phase1Input || summary;
        if (!handoff.worldSeedProfile || !handoff.derivedWorldTendencies
            || !Number.isInteger(handoff.macroGeographySeed)
            || handoff.macroGeographySeed < 0 || handoff.macroGeographySeed > 0xffffffff) {
            throw new Error('[worldgen/macro] Incomplete Phase 0 handoff.');
        }
        const profile = macro.ingestMacroSeedProfile(handoff);
        macro.assertMacroSeedProfile(profile);
        if (profile.macroSeed !== handoff.macroGeographySeed
            || profile.worldSeed !== handoff.worldSeedProfile.worldSeed) {
            throw new Error('[worldgen/macro] Seed drift in Phase 0 handoff.');
        }
        return profile;
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('masterConstraintsIntake', {
            entry: 'intakeMasterConstraints',
            file: 'js/worldgen/macro/master-constraints-intake.js',
            description: 'Validated Phase 0 master constraints intake.'
        });
    }

    if (typeof macro.registerPipelineStep === 'function') {
        macro.registerPipelineStep('masterConstraintsIntake', {
            moduleId: 'masterConstraintsIntake',
            file: 'js/worldgen/macro/master-constraints-intake.js',
            description: 'Validated pipeline entry for master constraints intake.'
        });
    }

    Object.assign(macro, {
        intakeMasterConstraints
    });
})();
