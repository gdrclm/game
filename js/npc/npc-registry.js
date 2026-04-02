(() => {
    const npcRegistry = window.Game.systems.npcRegistry = window.Game.systems.npcRegistry || {};

    const npcDefinitions = {
        merchant: {
            kind: 'merchant',
            label: 'Странствующий торговец',
            defaultDialogueId: 'merchantGreeting'
        }
    };

    function ensureArtisanDefinitions() {
        const bagUpgradeData = window.Game.systems.bagUpgradeData || null;
        const artisanDefinitions = bagUpgradeData && bagUpgradeData.artisanDefinitions
            ? bagUpgradeData.artisanDefinitions
            : {};

        Object.values(artisanDefinitions).forEach((definition) => {
            if (!definition || !definition.npcKind) {
                return;
            }

            npcDefinitions[definition.npcKind] = {
                kind: definition.npcKind,
                label: definition.label || definition.npcKind,
                defaultDialogueId: definition.dialogueId || 'artisanGreeting'
            };
        });
    }

    function getNpcDefinition(kind) {
        ensureArtisanDefinitions();
        return npcDefinitions[kind] || null;
    }

    function getNpcDefinitionByEncounter(encounter) {
        return encounter
            ? getNpcDefinition(encounter.npcKind || encounter.kind)
            : null;
    }

    Object.assign(npcRegistry, {
        npcDefinitions,
        getNpcDefinition,
        getNpcDefinitionByEncounter
    });
})();
