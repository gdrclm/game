(() => {
    const game = window.Game;
    const phase0 = game.systems.worldgenPhase0 = game.systems.worldgenPhase0 || {};
    const debugArtifactKinds = Object.freeze([
        'worldSeedProfileSnapshot',
        'derivedWorldTendenciesSnapshot',
        'worldSubSeedMapSnapshot',
        'validationReport',
        'jsonSnapshot',
        'jsonSummary',
        'markdownSummary'
    ]);
    const WORLD_SEED_PROFILE_AXIS_FIELD_IDS = Object.freeze([
        'conflictPressure',
        'dynastyPressure',
        'maritimeDependence',
        'environmentalVolatility',
        'collapseIntensity',
        'religiousInertia',
        'institutionalPlasticity',
        'migrationPressure',
        'centralizationBias',
        'memoryPersistence',
        'heroicAgencyBias',
        'routeFragilityBias',
        'culturalPermeability'
    ]);

    function deepFreeze(value) {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
            return value;
        }

        Object.freeze(value);
        Object.values(value).forEach((nestedValue) => {
            deepFreeze(nestedValue);
        });

        return value;
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function hasOwn(objectValue, key) {
        return Boolean(objectValue) && Object.prototype.hasOwnProperty.call(objectValue, key);
    }

    function unwrapDebugInput(input = {}) {
        if (!isPlainObject(input)) {
            return {};
        }

        if (isPlainObject(input.phase0Bundle)) {
            return input.phase0Bundle;
        }

        if (isPlainObject(input.bundle)) {
            return input.bundle;
        }

        return input;
    }

    function pickComponent(input, canonicalKey, aliasKeys = []) {
        if (!isPlainObject(input)) {
            return {};
        }

        if (Object.prototype.hasOwnProperty.call(input, canonicalKey)) {
            return input[canonicalKey];
        }

        for (const aliasKey of aliasKeys) {
            if (Object.prototype.hasOwnProperty.call(input, aliasKey)) {
                return input[aliasKey];
            }
        }

        return {};
    }

    function normalizePhase0DebugBundle(input = {}) {
        const source = unwrapDebugInput(input);
        const validationInput = pickComponent(source, 'validationReport', [
            'report',
            'phase0ValidationReport'
        ]);
        const normalizedValidationReport = typeof phase0.buildPhase0ValidationReport === 'function'
            ? phase0.buildPhase0ValidationReport(validationInput)
            : validationInput;

        if (typeof phase0.assemblePhase0Bundle !== 'function') {
            throw new Error('[worldgen/phase0] Debug summary exporter requires assemblePhase0Bundle().');
        }

        return phase0.assemblePhase0Bundle({
            worldSeedProfile: pickComponent(source, 'worldSeedProfile', [
                'profile',
                'seedProfile'
            ]),
            derivedWorldTendencies: pickComponent(source, 'derivedWorldTendencies', [
                'tendencies',
                'derivedTendencies'
            ]),
            worldSubSeedMap: pickComponent(source, 'worldSubSeedMap', [
                'subSeedMap',
                'subSeeds'
            ]),
            validationReport: normalizedValidationReport
        });
    }

    function normalizePhase0SnapshotBundle(input = {}) {
        const source = unwrapDebugInput(input);

        if (typeof phase0.assemblePhase0Bundle !== 'function') {
            throw new Error('[worldgen/phase0] JSON snapshot exporter requires assemblePhase0Bundle().');
        }

        return phase0.assemblePhase0Bundle({
            worldSeedProfile: pickComponent(source, 'worldSeedProfile', [
                'profile',
                'seedProfile'
            ]),
            derivedWorldTendencies: pickComponent(source, 'derivedWorldTendencies', [
                'tendencies',
                'derivedTendencies'
            ]),
            worldSubSeedMap: pickComponent(source, 'worldSubSeedMap', [
                'subSeedMap',
                'subSeeds'
            ]),
            validationReport: pickComponent(source, 'validationReport', [
                'report',
                'phase0ValidationReport'
            ])
        });
    }

    function getPhase0DebugArtifactKinds() {
        return debugArtifactKinds.slice();
    }

    function getWorldSeedProfileAxisFieldIds() {
        if (typeof phase0.getWorldSeedProfileAxisFieldIds === 'function') {
            const fieldIds = phase0.getWorldSeedProfileAxisFieldIds();
            if (Array.isArray(fieldIds) && fieldIds.length > 0) {
                return fieldIds.slice();
            }
        }

        return WORLD_SEED_PROFILE_AXIS_FIELD_IDS.slice();
    }

    function formatAxisLabel(fieldId) {
        return `${fieldId}`
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/^./, (firstCharacter) => firstCharacter.toUpperCase());
    }

    function formatScoreValue(value) {
        return Number(value).toFixed(3);
    }

    function getValidationStatusLabel(isValid) {
        return isValid ? 'valid' : 'invalid';
    }

    function buildAxisEntries(worldSeedProfile) {
        return getWorldSeedProfileAxisFieldIds().map((fieldId) => {
            return {
                fieldId,
                label: formatAxisLabel(fieldId),
                value: Number(worldSeedProfile[fieldId])
            };
        });
    }

    function sortAxisEntriesByValue(axisEntries, direction = 'desc') {
        const multiplier = direction === 'asc' ? 1 : -1;

        return axisEntries.slice().sort((leftEntry, rightEntry) => {
            if (leftEntry.value === rightEntry.value) {
                return leftEntry.label.localeCompare(rightEntry.label);
            }

            return (leftEntry.value - rightEntry.value) * multiplier;
        });
    }

    function formatAxisHighlightLine(label, axisEntries) {
        return axisEntries.length
            ? `- ${label}: ${axisEntries.map((axisEntry) => `\`${axisEntry.label} ${formatScoreValue(axisEntry.value)}\``).join(', ')}`
            : `- ${label}: none`;
    }

    function formatStringList(label, values) {
        return values.length
            ? `- ${label}: ${values.map((value) => `\`${value}\``).join(', ')}`
            : `- ${label}: none`;
    }

    function buildMarkdownTable(headers, rows) {
        return [
            `| ${headers.join(' | ')} |`,
            `| ${headers.map((_, index) => index === headers.length - 1 ? '---:' : '---').join(' | ')} |`,
            ...rows.map((row) => `| ${row.join(' | ')} |`)
        ].join('\n');
    }

    function getPhaseSubSeedRegistryEntries() {
        if (typeof phase0.getPhaseSubSeedNamespaceRegistry === 'function') {
            const registryEntries = phase0.getPhaseSubSeedNamespaceRegistry();
            if (Array.isArray(registryEntries) && registryEntries.length > 0) {
                return registryEntries.slice().sort((leftEntry, rightEntry) => {
                    if (leftEntry.phaseNumber === rightEntry.phaseNumber) {
                        return `${leftEntry.namespaceId}`.localeCompare(`${rightEntry.namespaceId}`);
                    }

                    return Number(leftEntry.phaseNumber) - Number(rightEntry.phaseNumber);
                });
            }
        }

        return [];
    }

    function buildSubSeedEntries(worldSubSeedMap) {
        const registryEntries = getPhaseSubSeedRegistryEntries();
        if (registryEntries.length > 0) {
            return registryEntries.map((registryEntry) => {
                return {
                    phaseNumber: Number(registryEntry.phaseNumber),
                    phaseLabel: `${registryEntry.phaseLabel}`,
                    namespaceId: `${registryEntry.namespaceId}`,
                    contractKey: `${registryEntry.contractKey}`,
                    seed: worldSubSeedMap[registryEntry.contractKey]
                };
            });
        }

        return Object.keys(worldSubSeedMap).sort().map((contractKey) => {
            return {
                phaseNumber: null,
                phaseLabel: contractKey,
                namespaceId: contractKey,
                contractKey,
                seed: worldSubSeedMap[contractKey]
            };
        });
    }

    function toDeterministicJsonValue(value) {
        if (Array.isArray(value)) {
            return value.map((entry) => toDeterministicJsonValue(entry));
        }

        if (value && typeof value === 'object') {
            return Object.keys(value).sort((leftKey, rightKey) => {
                return leftKey.localeCompare(rightKey);
            }).reduce((normalizedObject, key) => {
                normalizedObject[key] = toDeterministicJsonValue(value[key]);
                return normalizedObject;
            }, {});
        }

        return value;
    }

    function buildPhase0DebugSummaryExport(input = {}) {
        const bundle = normalizePhase0DebugBundle(input);
        const worldSeedProfile = bundle.worldSeedProfile;
        const derivedWorldTendencies = bundle.derivedWorldTendencies;
        const worldSubSeedMap = bundle.worldSubSeedMap;
        const validationReport = bundle.validationReport;

        return deepFreeze({
            phaseId: phase0.phaseId || 'phase0',
            phaseVersion: phase0.phaseVersion || 'phase0-v1',
            worldSeed: worldSeedProfile.worldSeed,
            worldTone: worldSeedProfile.worldTone,
            isValid: validationReport.isValid,
            tendencies: {
                likelyWorldPattern: derivedWorldTendencies.likelyWorldPattern,
                likelyConflictMode: derivedWorldTendencies.likelyConflictMode,
                likelyCollapseMode: derivedWorldTendencies.likelyCollapseMode,
                likelyReligiousPattern: derivedWorldTendencies.likelyReligiousPattern,
                likelyArchipelagoRole: derivedWorldTendencies.likelyArchipelagoRole
            },
            scores: { ...validationReport.scores },
            diagnostics: {
                warnings: validationReport.warnings.slice(),
                rerollAdvice: validationReport.rerollAdvice.slice(),
                blockedDownstreamPhases: validationReport.blockedDownstreamPhases.slice()
            },
            subSeedSummary: {
                macroGeographySeed: worldSubSeedMap.macroGeographySeed,
                registeredNamespaceCount: Object.keys(worldSubSeedMap).length
            }
        });
    }

    function buildPhase0MarkdownSummary(input = {}) {
        const bundle = normalizePhase0DebugBundle(input);
        const summary = buildPhase0DebugSummaryExport(bundle);
        const axisEntries = buildAxisEntries(bundle.worldSeedProfile);
        const highestAxes = sortAxisEntriesByValue(axisEntries, 'desc').slice(0, 3);
        const lowestAxes = sortAxisEntriesByValue(axisEntries, 'asc').slice(0, 3);
        const subSeedEntries = buildSubSeedEntries(bundle.worldSubSeedMap);
        const axisTable = buildMarkdownTable(
            ['Axis', 'Value'],
            axisEntries.map((axisEntry) => [axisEntry.label, formatScoreValue(axisEntry.value)])
        );
        const validationScoreTable = buildMarkdownTable(
            ['Score', 'Value'],
            [
                ['Expressiveness', formatScoreValue(summary.scores.expressiveness)],
                ['Controlled extremeness', formatScoreValue(summary.scores.controlledExtremeness)],
                ['Derived readability', formatScoreValue(summary.scores.derivedReadability)],
                ['Archipelago potential', formatScoreValue(summary.scores.archipelagoPotential)],
                ['Downstream usability', formatScoreValue(summary.scores.downstreamUsability)]
            ]
        );
        const downstreamSeedTable = buildMarkdownTable(
            ['Phase', 'Namespace', 'Seed'],
            subSeedEntries.map((subSeedEntry) => {
                const phaseLabel = subSeedEntry.phaseNumber === null
                    ? subSeedEntry.phaseLabel
                    : `${subSeedEntry.phaseNumber} — ${subSeedEntry.phaseLabel}`;

                return [
                    phaseLabel,
                    `\`${subSeedEntry.namespaceId}\``,
                    `\`${subSeedEntry.seed}\``
                ];
            })
        );

        return [
            '# Phase 0 Debug Summary',
            '',
            '## Overview',
            `- World seed: \`${summary.worldSeed}\``,
            `- World tone: \`${summary.worldTone}\``,
            `- Validation status: \`${getValidationStatusLabel(summary.isValid)}\``,
            `- Registered downstream seeds: \`${subSeedEntries.length}\``,
            '',
            '## Derived Layer',
            `- World pattern: \`${summary.tendencies.likelyWorldPattern}\``,
            `- Conflict mode: \`${summary.tendencies.likelyConflictMode}\``,
            `- Collapse mode: \`${summary.tendencies.likelyCollapseMode}\``,
            `- Religious pattern: \`${summary.tendencies.likelyReligiousPattern}\``,
            `- Archipelago role: \`${summary.tendencies.likelyArchipelagoRole}\``,
            '',
            '## Profile Highlights',
            formatAxisHighlightLine('Highest axes', highestAxes),
            formatAxisHighlightLine('Lowest axes', lowestAxes),
            '',
            '## Profile Axes',
            axisTable,
            '',
            '## Validation Scores',
            validationScoreTable,
            '',
            '## Diagnostics',
            formatStringList('Warnings', summary.diagnostics.warnings),
            formatStringList('Blocked downstream phases', summary.diagnostics.blockedDownstreamPhases),
            formatStringList('Reroll advice', summary.diagnostics.rerollAdvice),
            '',
            '## Downstream Seeds',
            downstreamSeedTable
        ].join('\n');
    }

    function buildPhase0JsonSnapshotExport(input = {}) {
        const bundle = normalizePhase0SnapshotBundle(input);

        return deepFreeze({
            exportKind: 'phase0.json_snapshot',
            phaseId: phase0.phaseId || 'phase0',
            phaseVersion: phase0.phaseVersion || 'phase0-v1',
            bundle: {
                worldSeedProfile: bundle.worldSeedProfile,
                derivedWorldTendencies: bundle.derivedWorldTendencies,
                worldSubSeedMap: bundle.worldSubSeedMap,
                validationReport: bundle.validationReport
            }
        });
    }

    function serializePhase0JsonSnapshot(input = {}) {
        const jsonSnapshot = buildPhase0JsonSnapshotExport(input);
        return JSON.stringify(toDeterministicJsonValue(jsonSnapshot), null, 2);
    }

    function buildPhase0DebugArtifactBundle(input = {}) {
        const bundle = normalizePhase0DebugBundle(input);
        const jsonSnapshot = buildPhase0JsonSnapshotExport(bundle);
        const jsonSummary = buildPhase0DebugSummaryExport(bundle);
        const markdownSummary = buildPhase0MarkdownSummary(bundle);

        return deepFreeze({
            artifactKinds: getPhase0DebugArtifactKinds(),
            worldSeedProfileSnapshot: bundle.worldSeedProfile,
            derivedWorldTendenciesSnapshot: bundle.derivedWorldTendencies,
            worldSubSeedMapSnapshot: bundle.worldSubSeedMap,
            validationReport: bundle.validationReport,
            jsonSnapshot,
            jsonSummary,
            markdownSummary
        });
    }

    if (typeof phase0.registerModule === 'function') {
        phase0.registerModule('debugArtifacts', {
            entry: 'buildPhase0DebugArtifactBundle',
            file: 'js/worldgen/phase0/debug/index.js',
            description: 'Debug summary exporter for Phase 0 with markdown/json-friendly outputs for review/debug usage and no visual debug UI.',
            stub: false
        });
    }

    Object.assign(phase0, {
        getPhase0DebugArtifactKinds,
        buildPhase0JsonSnapshotExport,
        buildPhase0DebugSummaryExport,
        buildPhase0DebugArtifactBundle,
        buildPhase0MarkdownSummary,
        serializePhase0JsonSnapshot
    });
})();
