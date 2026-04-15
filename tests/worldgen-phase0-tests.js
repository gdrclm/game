(() => {
    const game = window.Game;
    const summaryElement = document.getElementById('summary');
    const resultsElement = document.getElementById('results');
    const tests = [];

    function addTest(group, name, fn) {
        tests.push({ group, name, fn });
    }

    function stableStringify(value) {
        if (Array.isArray(value)) {
            return `[${value.map(stableStringify).join(',')}]`;
        }

        if (!value || typeof value !== 'object') {
            return JSON.stringify(value);
        }

        return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    }

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed.');
        }
    }

    function assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}.`);
        }
    }

    function assertDeepEqual(actual, expected, message) {
        if (stableStringify(actual) !== stableStringify(expected)) {
            throw new Error(message || `Expected ${stableStringify(expected)}, got ${stableStringify(actual)}.`);
        }
    }

    function getPhase0Api() {
        const worldgen = game && game.systems ? game.systems.worldgen : null;
        if (worldgen && typeof worldgen.getPhase0PublicApi === 'function') {
            return worldgen.getPhase0PublicApi();
        }

        const phase0 = game && game.systems ? game.systems.worldgenPhase0 : null;
        assert(phase0, 'Phase 0 runtime is unavailable in test harness.');
        return phase0;
    }

    function getPhase0ContractsRuntime() {
        const phase0 = game && game.systems ? game.systems.worldgenPhase0 : null;
        assert(phase0, 'Phase 0 contract runtime is unavailable in test harness.');
        return phase0;
    }

    function buildPhase0Run(baseSeed, options = {}) {
        const phase0Api = getPhase0Api();
        const normalizedInput = phase0Api.normalizePhase0Input(baseSeed, options);
        const normalizedOptions = {
            worldPresetMode: normalizedInput.worldPresetMode,
            hardConstraintsProfile: normalizedInput.hardConstraintsProfile
        };
        const worldSeedProfile = phase0Api.buildWorldSeedProfile(
            normalizedInput.baseRandomSeed,
            normalizedOptions
        );
        const derivedWorldTendencies = phase0Api.deriveWorldTendencies(worldSeedProfile);
        const worldSubSeedMap = phase0Api.deriveWorldSubSeedMap(
            normalizedInput.baseRandomSeed,
            worldSeedProfile
        );
        const validationReport = phase0Api.buildPhase0ValidationReport({
            worldSeedProfile,
            derivedWorldTendencies,
            worldSubSeedMap
        });
        const phase0Bundle = phase0Api.assemblePhase0Bundle({
            worldSeedProfile,
            derivedWorldTendencies,
            worldSubSeedMap,
            validationReport
        });

        return {
            normalizedInput,
            worldSeedProfile,
            derivedWorldTendencies,
            worldSubSeedMap,
            validationReport,
            phase0Bundle,
            debugSummary: phase0Api.buildPhase0DebugSummaryExport(phase0Bundle),
            markdownSummary: phase0Api.buildPhase0MarkdownSummary(phase0Bundle),
            jsonSnapshot: phase0Api.buildPhase0JsonSnapshotExport(phase0Bundle),
            serializedSnapshot: phase0Api.serializePhase0JsonSnapshot(phase0Bundle),
            phase1SafeSummaryBundle: typeof phase0Api.buildPhase1SafeSummaryBundle === 'function'
                ? phase0Api.buildPhase1SafeSummaryBundle(phase0Bundle)
                : null,
            frozenOutputWrappers: typeof phase0Api.buildFrozenPhase0OutputWrappers === 'function'
                ? phase0Api.buildFrozenPhase0OutputWrappers(phase0Bundle)
                : null
        };
    }

    function assertStablePhase0Run(leftRun, rightRun, label) {
        assertDeepEqual(leftRun.normalizedInput, rightRun.normalizedInput, `${label}: normalized input must be stable.`);
        assertDeepEqual(leftRun.worldSeedProfile, rightRun.worldSeedProfile, `${label}: WorldSeedProfile must be stable.`);
        assertDeepEqual(leftRun.derivedWorldTendencies, rightRun.derivedWorldTendencies, `${label}: DerivedWorldTendencies must be stable.`);
        assertDeepEqual(leftRun.worldSubSeedMap, rightRun.worldSubSeedMap, `${label}: WorldSubSeedMap must be stable.`);
        assertDeepEqual(leftRun.validationReport, rightRun.validationReport, `${label}: Phase0ValidationReport must be stable.`);
        assertDeepEqual(leftRun.phase0Bundle, rightRun.phase0Bundle, `${label}: assembled Phase 0 bundle must be stable.`);
        assertDeepEqual(leftRun.debugSummary, rightRun.debugSummary, `${label}: debug summary export must be stable.`);
        assertDeepEqual(leftRun.jsonSnapshot, rightRun.jsonSnapshot, `${label}: JSON snapshot export must be stable.`);
        assertEqual(leftRun.markdownSummary, rightRun.markdownSummary, `${label}: markdown summary must be stable.`);
        assertEqual(leftRun.serializedSnapshot, rightRun.serializedSnapshot, `${label}: serialized JSON snapshot must be stable.`);
        assertDeepEqual(leftRun.phase1SafeSummaryBundle, rightRun.phase1SafeSummaryBundle, `${label}: Phase 1-safe summary bundle must be stable.`);
        assertDeepEqual(leftRun.frozenOutputWrappers, rightRun.frozenOutputWrappers, `${label}: frozen output wrappers must be stable.`);
    }

    addTest('1. seed stability', 'Одинаковый seed даёт идентичный полный Phase 0 output', () => {
        const firstRun = buildPhase0Run(12345);
        const secondRun = buildPhase0Run(12345);

        assertStablePhase0Run(firstRun, secondRun, 'same-seed base run');
    });

    addTest('2. option stability', 'Одинаковый seed и одинаковые options остаются детерминированными', () => {
        const options = {
            worldPresetMode: 'Maritime Frontier',
            hardConstraintsProfile: {
                maritimeDependence: 0.91,
                routeFragilityBias: 0.73
            }
        };
        const firstRun = buildPhase0Run(54321, options);
        const secondRun = buildPhase0Run(54321, options);

        assertEqual(firstRun.normalizedInput.worldPresetMode, 'maritime_frontier', 'Preset mode should normalize deterministically.');
        assertDeepEqual(firstRun.normalizedInput.hardConstraintsProfile, {
            maritimeDependence: 0.91,
            routeFragilityBias: 0.73
        }, 'Hard constraints should normalize deterministically.');
        assertStablePhase0Run(firstRun, secondRun, 'same-seed same-options run');
    });

    addTest('3. contract conformance', 'Canonical Phase 0 outputs проходят официальные contract validators и assertions', () => {
        const phase0Contracts = getPhase0ContractsRuntime();
        const validators = typeof phase0Contracts.getPhase0ContractValidators === 'function'
            ? phase0Contracts.getPhase0ContractValidators()
            : {};
        const assertions = typeof phase0Contracts.getPhase0ContractAssertions === 'function'
            ? phase0Contracts.getPhase0ContractAssertions()
            : {};
        const phase0Run = buildPhase0Run(12345, {
            worldPresetMode: 'Maritime Frontier',
            hardConstraintsProfile: {
                maritimeDependence: 0.91,
                routeFragilityBias: 0.73
            }
        });

        assert(typeof validators.validateWorldSeedProfile === 'function', 'WorldSeedProfile validator should be available.');
        assert(typeof validators.validateDerivedWorldTendencies === 'function', 'DerivedWorldTendencies validator should be available.');
        assert(typeof validators.validateWorldSubSeedMap === 'function', 'WorldSubSeedMap validator should be available.');
        assert(typeof validators.validatePhase0ValidationReport === 'function', 'Phase0ValidationReport validator should be available.');

        const worldSeedProfileValidation = validators.validateWorldSeedProfile(phase0Run.worldSeedProfile);
        const derivedWorldTendenciesValidation = validators.validateDerivedWorldTendencies(phase0Run.derivedWorldTendencies);
        const worldSubSeedMapValidation = validators.validateWorldSubSeedMap(phase0Run.worldSubSeedMap);
        const validationReportValidation = validators.validatePhase0ValidationReport(phase0Run.validationReport);

        assert(worldSeedProfileValidation.isValid === true, `WorldSeedProfile contract should pass: ${stableStringify(worldSeedProfileValidation.errors)}`);
        assert(derivedWorldTendenciesValidation.isValid === true, `DerivedWorldTendencies contract should pass: ${stableStringify(derivedWorldTendenciesValidation.errors)}`);
        assert(worldSubSeedMapValidation.isValid === true, `WorldSubSeedMap contract should pass: ${stableStringify(worldSubSeedMapValidation.errors)}`);
        assert(validationReportValidation.isValid === true, `Phase0ValidationReport contract should pass: ${stableStringify(validationReportValidation.errors)}`);

        assert(typeof assertions.assertWorldSeedProfile === 'function', 'WorldSeedProfile assertion should be available.');
        assert(typeof assertions.assertDerivedWorldTendencies === 'function', 'DerivedWorldTendencies assertion should be available.');
        assert(typeof assertions.assertWorldSubSeedMap === 'function', 'WorldSubSeedMap assertion should be available.');
        assert(typeof assertions.assertPhase0ValidationReport === 'function', 'Phase0ValidationReport assertion should be available.');

        assertEqual(assertions.assertWorldSeedProfile(phase0Run.worldSeedProfile), phase0Run.worldSeedProfile, 'WorldSeedProfile assertion should return the same object.');
        assertEqual(assertions.assertDerivedWorldTendencies(phase0Run.derivedWorldTendencies), phase0Run.derivedWorldTendencies, 'DerivedWorldTendencies assertion should return the same object.');
        assertEqual(assertions.assertWorldSubSeedMap(phase0Run.worldSubSeedMap), phase0Run.worldSubSeedMap, 'WorldSubSeedMap assertion should return the same object.');
        assertEqual(assertions.assertPhase0ValidationReport(phase0Run.validationReport), phase0Run.validationReport, 'Phase0ValidationReport assertion should return the same object.');
    });

    addTest('4. phase1-safe summary export', 'Phase 1-safe summary bundle экспортируется детерминированно и без geography logic', () => {
        const phase0Api = getPhase0Api();
        const firstRun = buildPhase0Run(12345);
        const secondRun = buildPhase0Run(12345);
        const summaryBundle = firstRun.phase1SafeSummaryBundle;

        assert(typeof phase0Api.getPhase1SafeSummaryBundleContract === 'function', 'Phase 1-safe summary contract accessor should be available.');
        assert(typeof phase0Api.buildPhase1SafeSummaryBundle === 'function', 'Phase 1-safe summary builder should be available.');
        assert(summaryBundle, 'Phase 1-safe summary bundle should be produced.');
        assertDeepEqual(summaryBundle, secondRun.phase1SafeSummaryBundle, 'Phase 1-safe summary bundle should be deterministic.');
        assertEqual(summaryBundle.exportKind, 'phase0.phase1_safe_summary_bundle', 'Phase 1-safe summary bundle should expose the official export kind.');
        assertEqual(summaryBundle.freezePoint, 'A', 'Phase 1-safe summary bundle should point to Freeze Point A.');
        assertEqual(summaryBundle.immutable, true, 'Phase 1-safe summary bundle should declare immutable upstream truth.');
        assertEqual(summaryBundle.phase1Input.macroGeographySeed, firstRun.worldSubSeedMap.macroGeographySeed, 'Phase 1-safe summary bundle should expose macroGeographySeed.');
        assertDeepEqual(summaryBundle.phase1Input.worldSeedProfile, firstRun.worldSeedProfile, 'Phase 1-safe summary bundle should expose WorldSeedProfile unchanged.');
        assertDeepEqual(summaryBundle.phase1Input.derivedWorldTendencies, firstRun.derivedWorldTendencies, 'Phase 1-safe summary bundle should expose DerivedWorldTendencies unchanged.');
        assertEqual(summaryBundle.summary.worldSeed, firstRun.worldSeedProfile.worldSeed, 'Phase 1-safe summary should carry world seed.');
        assertEqual(summaryBundle.summary.worldTone, firstRun.worldSeedProfile.worldTone, 'Phase 1-safe summary should carry world tone.');
    });

    addTest('5. frozen output wrappers', 'Frozen output wrappers задают immutable handoff semantics без изменения payload', () => {
        const phase0Api = getPhase0Api();
        const firstRun = buildPhase0Run(12345);
        const secondRun = buildPhase0Run(12345);
        const frozenOutputWrappers = firstRun.frozenOutputWrappers;

        assert(typeof phase0Api.getFrozenPhase0OutputWrappersContract === 'function', 'Frozen output wrappers contract accessor should be available.');
        assert(typeof phase0Api.buildFrozenPhase0OutputWrappers === 'function', 'Frozen output wrappers builder should be available.');
        assert(frozenOutputWrappers, 'Frozen output wrappers should be produced.');
        assertDeepEqual(frozenOutputWrappers, secondRun.frozenOutputWrappers, 'Frozen output wrappers should be deterministic.');
        assertEqual(frozenOutputWrappers.exportKind, 'phase0.frozen_output_wrappers', 'Frozen output wrappers should expose the official export kind.');
        assertEqual(frozenOutputWrappers.freezePoint, 'A', 'Frozen output wrappers should point to Freeze Point A.');
        assertEqual(frozenOutputWrappers.handoffSemantics, 'read_only_frozen', 'Frozen output wrappers should expose immutable handoff semantics.');
        assertEqual(frozenOutputWrappers.immutable, true, 'Frozen output wrappers should declare immutable payload semantics.');
        assert(Object.isFrozen(frozenOutputWrappers), 'Frozen output wrapper root should be frozen.');
        assert(Object.isFrozen(frozenOutputWrappers.outputs), 'Frozen output wrapper outputs bag should be frozen.');
        assert(Object.isFrozen(frozenOutputWrappers.outputs.phase0Bundle), 'Wrapped Phase 0 bundle should be frozen.');
        assert(Object.isFrozen(frozenOutputWrappers.outputs.phase1SafeSummaryBundle), 'Wrapped Phase 1-safe summary bundle should be frozen.');
        assertDeepEqual(frozenOutputWrappers.outputs.phase0Bundle, firstRun.phase0Bundle, 'Frozen output wrappers should preserve the canonical Phase 0 bundle payload.');
        assertDeepEqual(frozenOutputWrappers.outputs.phase1SafeSummaryBundle, firstRun.phase1SafeSummaryBundle, 'Frozen output wrappers should preserve the canonical Phase 1-safe summary payload.');
    });

    function renderResults(results) {
        const groupedResults = results.reduce((groups, result) => {
            if (!groups[result.group]) {
                groups[result.group] = [];
            }

            groups[result.group].push(result);
            return groups;
        }, {});

        resultsElement.innerHTML = '';
        Object.entries(groupedResults).forEach(([groupName, groupResults]) => {
            const groupElement = document.createElement('section');
            groupElement.className = 'group';

            const titleElement = document.createElement('h2');
            titleElement.textContent = groupName;
            groupElement.appendChild(titleElement);

            groupResults.forEach((result) => {
                const resultElement = document.createElement('div');
                resultElement.className = `test ${result.status}`;
                resultElement.textContent = result.status === 'pass'
                    ? `${result.name} — OK`
                    : `${result.name} — ${result.error}`;
                groupElement.appendChild(resultElement);
            });

            resultsElement.appendChild(groupElement);
        });
    }

    function runTests() {
        const results = [];

        tests.forEach((testCase) => {
            try {
                testCase.fn();
                results.push({
                    group: testCase.group,
                    name: testCase.name,
                    status: 'pass'
                });
            } catch (error) {
                results.push({
                    group: testCase.group,
                    name: testCase.name,
                    status: 'fail',
                    error: error && error.message ? error.message : String(error)
                });
            }
        });

        const passedCount = results.filter((result) => result.status === 'pass').length;
        const failedCount = results.length - passedCount;
        summaryElement.textContent = `Всего: ${results.length}. Пройдено: ${passedCount}. Провалено: ${failedCount}.`;
        renderResults(results);
    }

    runTests();
})();
