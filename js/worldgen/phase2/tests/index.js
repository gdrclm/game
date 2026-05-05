(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const GROUP_ID = 'tests';
    const PHASE_ID = 'PHASE_2';
    const TEST_HARNESS_ID = 'Phase2TestHarness';
    const TEST_HARNESS_VERSION = 'phase2-test-harness-v1';
    const STUB = Object.freeze({
        groupId: GROUP_ID,
        status: 'partial_implemented_phase2_test_harness',
        canonicalPath: 'js/worldgen/phase2/tests/',
        uiCoupling: false,
        implementsFieldLogic: false,
        purpose: 'Phase 2 smoke, regression, snapshot, and readiness test harness for semantic drift detection.'
    });
    const REPRESENTATIVE_PROFILE_FIXTURES = Object.freeze([
        Object.freeze({
            fixtureId: 'harsh_but_predictable',
            testSeed: 20101,
            planningProfile: 'harsh but predictable',
            sourcePackageId: 'phase2.fixture.predictable',
            recordType: 'reliefRegions',
            recordId: 'relief_predictable_001',
            pressureSignals: Object.freeze({
                terrainHarshness: 0.82,
                survivabilityPressure: 0.74
            }),
            rhythmSignals: Object.freeze({
                predictability: 0.79,
                temporalTrustworthiness: 0.76,
                recoveryTempo: 0.31
            }),
            dominantEnvironmentalTraits: Object.freeze([
                'terrainHarshness_pressure',
                'predictability_rhythm'
            ]),
            summary: 'Harsh burden remains high, but timing stays readable and predictable.'
        }),
        Object.freeze({
            fixtureId: 'route_volatile',
            testSeed: 20102,
            planningProfile: 'route volatile',
            sourcePackageId: 'phase2.fixture.routeVolatile',
            recordType: 'macroRoutes',
            recordId: 'route_volatile_001',
            pressureSignals: Object.freeze({
                travelExposure: 0.77,
                chokepointPressure: 0.66
            }),
            rhythmSignals: Object.freeze({
                navigationWindowReliability: 0.23,
                blockedIntervalFrequency: 0.81,
                stormCadence: 0.69
            }),
            dominantEnvironmentalTraits: Object.freeze([
                'travelExposure_pressure',
                'blockedIntervalFrequency_rhythm'
            ]),
            summary: 'Route burden and timing windows swing sharply, reducing dependable traversal plans.'
        }),
        Object.freeze({
            fixtureId: 'scarcity_cyclic',
            testSeed: 20103,
            planningProfile: 'scarcity cyclic',
            sourcePackageId: 'phase2.fixture.scarcityCyclic',
            recordType: 'climateBands',
            recordId: 'climate_scarcity_001',
            pressureSignals: Object.freeze({
                foodStress: 0.61,
                droughtPressure: 0.58
            }),
            rhythmSignals: Object.freeze({
                scarcityCadence: 0.73,
                shortageRecurrence: 0.78,
                reliefPersistence: 0.29
            }),
            dominantEnvironmentalTraits: Object.freeze([
                'foodStress_pressure',
                'scarcityCadence_rhythm'
            ]),
            summary: 'Shortages recur in readable cycles rather than as uniform permanent deprivation.'
        }),
        Object.freeze({
            fixtureId: 'low_relief_high_burden',
            testSeed: 20104,
            planningProfile: 'low relief high burden',
            sourcePackageId: 'phase2.fixture.lowRelief',
            recordType: 'reliefRegions',
            recordId: 'relief_low_001',
            pressureSignals: Object.freeze({
                survivabilityPressure: 0.86,
                supplyPressure: 0.79
            }),
            rhythmSignals: Object.freeze({
                recoveryTempo: 0.12,
                reliefPersistence: 0.09,
                environmentalForgiveness: 0.11
            }),
            dominantEnvironmentalTraits: Object.freeze([
                'survivabilityPressure_pressure',
                'recoveryTempo_rhythm'
            ]),
            summary: 'Burden dominates while recovery windows remain sparse and weak.'
        }),
        Object.freeze({
            fixtureId: 'calm_until_rupture',
            testSeed: 20105,
            planningProfile: 'calm until rupture',
            sourcePackageId: 'phase2.fixture.rupture',
            recordType: 'seaRegions',
            recordId: 'sea_rupture_001',
            pressureSignals: Object.freeze({
                catastrophePressure: 0.51
            }),
            rhythmSignals: Object.freeze({
                predictability: 0.62,
                ruptureFrequency: 0.71,
                calmToStormTransitionSharpness: 0.84
            }),
            dominantEnvironmentalTraits: Object.freeze([
                'catastrophePressure_pressure',
                'ruptureFrequency_rhythm'
            ]),
            summary: 'Surface calm gives way to sharp rupture intervals, creating deceptive stability.'
        }),
        Object.freeze({
            fixtureId: 'isolation_dominant',
            testSeed: 20106,
            planningProfile: 'isolation dominant',
            sourcePackageId: 'phase2.fixture.isolation',
            recordType: 'isolatedZones',
            recordId: 'isolated_001',
            pressureSignals: Object.freeze({
                isolationPressure: 0.83,
                supportDelayBurden: 0.8
            }),
            rhythmSignals: Object.freeze({
                environmentalForgiveness: 0.24,
                recoveryTempo: 0.27
            }),
            dominantEnvironmentalTraits: Object.freeze([
                'isolationPressure_pressure',
                'supportDelayBurden_pressure'
            ]),
            summary: 'Isolation dominates planning because help arrives late and relief remains thin.'
        })
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

    function cloneValue(value) {
        if (Array.isArray(value)) {
            return value.map((entry) => cloneValue(entry));
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
            );
        }

        return value;
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string' && value.trim() ? value.trim() : fallback;
    }

    function uniqueStrings(values = []) {
        const seen = new Set();
        return (Array.isArray(values) ? values : [])
            .map((value) => normalizeString(value))
            .filter((value) => {
                if (!value || seen.has(value)) {
                    return false;
                }

                seen.add(value);
                return true;
            });
    }

    function makeField(value, fieldId = 'field') {
        return {
            fieldId,
            type: 'phase2ScalarField',
            summary: {
                mean: Number(value)
            },
            value: Number(value)
        };
    }

    function makePressureSynthesizedFieldMap(overrides = {}) {
        return {
            survivabilityPressure: makeField(0.64, 'survivabilityPressure'),
            mobilityPressure: makeField(0.58, 'mobilityPressure'),
            supplyPressure: makeField(0.55, 'supplyPressure'),
            chokepointStress: makeField(0.43, 'chokepointStress'),
            remotenessBurden: makeField(0.36, 'remotenessBurden'),
            ecologicalBurden: makeField(0.41, 'ecologicalBurden'),
            catastropheSusceptibility: makeField(0.47, 'catastropheSusceptibility'),
            ...cloneValue(overrides)
        };
    }

    function makeRhythmSynthesizedFieldMap(overrides = {}) {
        return {
            seasonalityProfile: makeField(0.49, 'seasonalityProfile'),
            stormRhythm: makeField(0.44, 'stormRhythm'),
            navigationRhythm: makeField(0.52, 'navigationRhythm'),
            scarcityRhythm: makeField(0.46, 'scarcityRhythm'),
            predictabilityProfile: makeField(0.57, 'predictabilityProfile'),
            ruptureProfile: makeField(0.34, 'ruptureProfile'),
            recoveryProfile: makeField(0.39, 'recoveryProfile'),
            ...cloneValue(overrides)
        };
    }

    function makePressureDomains(overrides = {}) {
        return {
            climate: {
                coldPressure: makeField(0.51, 'coldPressure'),
                heatPressure: makeField(0.47, 'heatPressure'),
                humidityPressure: makeField(0.42, 'humidityPressure'),
                climateExposurePressure: makeField(0.49, 'climateExposurePressure')
            },
            terrain: {
                terrainHarshness: makeField(0.62, 'terrainHarshness'),
                slopeBurden: makeField(0.59, 'slopeBurden'),
                fragmentationBurden: makeField(0.53, 'fragmentationBurden'),
                mobilityTerrainPenalty: makeField(0.56, 'mobilityTerrainPenalty')
            },
            hydrology: {
                waterReliabilityInverse: makeField(0.45, 'waterReliabilityInverse'),
                waterStress: makeField(0.41, 'waterStress'),
                droughtPressure: makeField(0.39, 'droughtPressure'),
                floodInstability: makeField(0.37, 'floodInstability')
            },
            food: {
                foodStress: makeField(0.48, 'foodStress'),
                foodReliabilityInverse: makeField(0.44, 'foodReliabilityInverse'),
                fertilitySupportInverse: makeField(0.46, 'fertilitySupportInverse'),
                scarcityBaseline: makeField(0.43, 'scarcityBaseline')
            },
            travel: {
                travelExposure: makeField(0.57, 'travelExposure'),
                routeReliabilityInverse: makeField(0.49, 'routeReliabilityInverse'),
                movementUncertaintyPressure: makeField(0.51, 'movementUncertaintyPressure'),
                detourBurden: makeField(0.47, 'detourBurden')
            },
            chokepoints: {
                chokepointPressure: makeField(0.46, 'chokepointPressure'),
                failureImpactPressure: makeField(0.44, 'failureImpactPressure'),
                dependencyConcentration: makeField(0.42, 'dependencyConcentration')
            },
            isolation: {
                isolationPressure: makeField(0.41, 'isolationPressure'),
                supportDelayBurden: makeField(0.45, 'supportDelayBurden'),
                peripheralExposure: makeField(0.39, 'peripheralExposure'),
                accessFragility: makeField(0.4, 'accessFragility')
            },
            ecology: {
                ecologicalFragility: makeField(0.38, 'ecologicalFragility'),
                ecologicalStabilityInverse: makeField(0.36, 'ecologicalStabilityInverse'),
                regenerationWeakness: makeField(0.35, 'regenerationWeakness'),
                carryingCapacityBrittleness: makeField(0.34, 'carryingCapacityBrittleness')
            },
            catastrophe: {
                catastrophePressure: makeField(0.33, 'catastrophePressure'),
                stormBreakRisk: makeField(0.32, 'stormBreakRisk'),
                volcanicInstability: makeField(0.27, 'volcanicInstability'),
                floodBreakRisk: makeField(0.31, 'floodBreakRisk'),
                droughtBreakRisk: makeField(0.29, 'droughtBreakRisk')
            },
            ...cloneValue(overrides)
        };
    }

    function makeRhythmDomains(overrides = {}) {
        return {
            seasonality: {
                seasonalityStrength: makeField(0.53, 'seasonalityStrength'),
                annualSwingStrength: makeField(0.5, 'annualSwingStrength'),
                environmentalCycleClarity: makeField(0.56, 'environmentalCycleClarity')
            },
            storms: {
                stormCadence: makeField(0.41, 'stormCadence'),
                stormBurstClustering: makeField(0.38, 'stormBurstClustering'),
                calmToStormTransitionSharpness: makeField(0.36, 'calmToStormTransitionSharpness')
            },
            navigation: {
                navigationWindowReliability: makeField(0.57, 'navigationWindowReliability'),
                blockedIntervalFrequency: makeField(0.34, 'blockedIntervalFrequency'),
                safeRouteIntervalStrength: makeField(0.55, 'safeRouteIntervalStrength')
            },
            scarcity: {
                scarcityCadence: makeField(0.44, 'scarcityCadence'),
                deficitPersistence: makeField(0.33, 'deficitPersistence'),
                shortageRecurrence: makeField(0.48, 'shortageRecurrence')
            },
            predictability: {
                predictability: makeField(0.61, 'predictability'),
                ruptureFrequency: makeField(0.29, 'ruptureFrequency'),
                cadenceIrregularity: makeField(0.31, 'cadenceIrregularity'),
                temporalTrustworthiness: makeField(0.58, 'temporalTrustworthiness')
            },
            recovery: {
                recoveryTempo: makeField(0.42, 'recoveryTempo'),
                stabilizationInterval: makeField(0.36, 'stabilizationInterval'),
                reliefPersistence: makeField(0.39, 'reliefPersistence'),
                environmentalForgiveness: makeField(0.41, 'environmentalForgiveness')
            },
            ...cloneValue(overrides)
        };
    }

    function buildRepresentativeProfiles() {
        return REPRESENTATIVE_PROFILE_FIXTURES.map((fixture) => ({
            profileId: `${fixture.recordType}:${fixture.recordId}`,
            recordType: fixture.recordType,
            recordId: fixture.recordId,
            sourcePackageId: fixture.sourcePackageId,
            pressureSignals: cloneValue(fixture.pressureSignals),
            rhythmSignals: cloneValue(fixture.rhythmSignals),
            dominantEnvironmentalTraits: fixture.dominantEnvironmentalTraits.slice(),
            summary: fixture.summary
        }));
    }

    function createBaseInputFixture() {
        const representativeProfiles = buildRepresentativeProfiles();
        return {
            pressureFieldPackage: {
                packageId: 'pressure.fixture.base',
                sourceMacroGeographyPackageId: 'macro.fixture.base',
                sourceMacroGeographyVersion: 'macro-v1',
                recordBindingContextId: 'binding.fixture.base',
                domains: makePressureDomains(),
                synthesized: makePressureSynthesizedFieldMap(),
                summaries: {
                    pressureSummary: 'Overall pressure is led by survivabilityPressure (0.64), with field-backed support from terrainHarshness (0.62).',
                    traversalSummary: 'Traversal burden is led by mobilityPressure (0.58), with field-backed support from travelExposure (0.57).',
                    survivalSummary: 'Survival burden is led by survivabilityPressure (0.64), with field-backed support from foodStress (0.48).',
                    fragilitySummary: 'Fragility burden is led by ecologicalBurden (0.41), with field-backed support from ecologicalFragility (0.38).'
                },
                regionalProfiles: representativeProfiles.map((profile) => ({
                    ...cloneValue(profile),
                    pressureSignals: cloneValue(profile.pressureSignals),
                    rhythmSignals: {}
                })),
                summaryMetadata: {
                    pressure: {
                        pressureSemanticsOnly: true,
                        rhythmMeaningIncluded: false,
                        synthesizedFieldIds: Object.keys(makePressureSynthesizedFieldMap()),
                        supportingDomainFieldIds: [
                            'terrainHarshness',
                            'travelExposure',
                            'foodStress',
                            'ecologicalFragility'
                        ]
                    }
                },
                metadata: {},
                validationMeta: {}
            },
            environmentalRhythmPackage: {
                packageId: 'rhythm.fixture.base',
                sourceMacroGeographyPackageId: 'macro.fixture.base',
                sourceMacroGeographyVersion: 'macro-v1',
                recordBindingContextId: 'binding.fixture.base',
                domains: makeRhythmDomains(),
                synthesized: makeRhythmSynthesizedFieldMap(),
                summaries: {
                    rhythmSummary: 'Overall rhythm is shaped by predictabilityProfile (0.57), with field-backed timing support from predictability (0.61).',
                    timingSummary: 'Timing rhythm is shaped by predictabilityProfile (0.57), with field-backed cadence support from cadenceIrregularity (0.31).',
                    recoverySummary: 'Recovery rhythm is carried by recoveryProfile (0.39), with relief support from reliefPersistence (0.39).',
                    windowSummary: 'Window rhythm is shaped by navigationRhythm (0.52), with route-and-interval support from navigationWindowReliability (0.57).'
                },
                regionalProfiles: representativeProfiles.map((profile) => ({
                    ...cloneValue(profile),
                    pressureSignals: {},
                    rhythmSignals: cloneValue(profile.rhythmSignals)
                })),
                summaryMetadata: {
                    rhythm: {
                        synthesizedFieldIds: Object.keys(makeRhythmSynthesizedFieldMap()),
                        supportingDomainFieldIds: [
                            'predictability',
                            'cadenceIrregularity',
                            'reliefPersistence',
                            'navigationWindowReliability'
                        ]
                    }
                },
                metadata: {},
                validationMeta: {}
            },
            phase2InputBundle: {
                bundleId: 'phase2InputBundle:macro.fixture.base',
                sourceMacroGeographyPackageId: 'macro.fixture.base',
                sourceMacroGeographyVersion: 'macro-v1',
                sourceMacroSeed: 12345,
                filteredHandoff: {
                    sourceHandoffPackageId: 'handoff.fixture.base',
                    sourceHandoffVersion: 'handoff-v1',
                    allowedSections: {},
                    blockedSections: [],
                    intakeMeta: {
                        promotedToRootTruth: false,
                        treatsAllHandoffAsAllowed: false,
                        blockedPaths: []
                    }
                }
            },
            phase2RecordBindingLayer: {
                recordBindingContextId: 'binding.fixture.base',
                bindingMeta: {
                    inventsRecordIds: false
                },
                profileTargetTables: {
                    byRecordType: {
                        reliefRegions: {
                            recordIds: ['relief_predictable_001', 'relief_low_001']
                        },
                        macroRoutes: {
                            recordIds: ['route_volatile_001']
                        },
                        climateBands: {
                            recordIds: ['climate_scarcity_001']
                        },
                        seaRegions: {
                            recordIds: ['sea_rupture_001']
                        },
                        isolatedZones: {
                            recordIds: ['isolated_001']
                        }
                    }
                }
            }
        };
    }

    function cloneFixtureAndMutate(mutator) {
        const fixture = cloneValue(createBaseInputFixture());
        if (typeof mutator === 'function') {
            mutator(fixture);
        }
        return fixture;
    }

    function getValidationShell() {
        return typeof phase2.createPhase2ValidationOrchestrationShell === 'function'
            ? phase2.createPhase2ValidationOrchestrationShell()
            : null;
    }

    function getExportShell() {
        return typeof phase2.createPhase2ExportEnvelopeShell === 'function'
            ? phase2.createPhase2ExportEnvelopeShell()
            : null;
    }

    function getRebalanceShell() {
        return typeof phase2.createPhase2SelectiveRebalanceShell === 'function'
            ? phase2.createPhase2SelectiveRebalanceShell()
            : null;
    }

    function getDebugApiReady() {
        return typeof phase2.createPhase2FieldSnapshot === 'function'
            && typeof phase2.createPhase2RecordProfileSnapshot === 'function'
            && typeof phase2.createPhase2RecordProfileCollectionSnapshot === 'function';
    }

    function findCheckStatus(report, familyKey, checkId) {
        const checks = Array.isArray(report && report[familyKey] && report[familyKey].checks)
            ? report[familyKey].checks
            : [];
        const match = checks.find((check) => normalizeString(check && check.checkId) === checkId);
        return normalizeString(match && match.status, 'missing');
    }

    function runValidationForFixture(fixture) {
        const validationShell = getValidationShell();
        if (!validationShell) {
            throw new Error('[worldgen/phase2] Missing validation shell for tests.');
        }
        return validationShell.run(fixture).report;
    }

    function runNamedRegressionTests() {
        const tests = [];

        const scalarCollapseReport = runValidationForFixture(cloneFixtureAndMutate((fixture) => {
            fixture.pressureFieldPackage.synthesized = makePressureSynthesizedFieldMap({
                survivabilityPressure: makeField(0.5, 'survivabilityPressure'),
                mobilityPressure: makeField(0.5, 'mobilityPressure'),
                supplyPressure: makeField(0.5, 'supplyPressure'),
                chokepointStress: makeField(0.5, 'chokepointStress'),
                remotenessBurden: makeField(0.5, 'remotenessBurden'),
                ecologicalBurden: makeField(0.5, 'ecologicalBurden'),
                catastropheSusceptibility: makeField(0.5, 'catastropheSusceptibility')
            });
        }));
        tests.push({
            testId: 'anti_scalar_collapse',
            passed: findCheckStatus(scalarCollapseReport, 'distributionChecks', 'phase2.distribution.pressure_contrast') === 'fail',
            observedStatus: findCheckStatus(scalarCollapseReport, 'distributionChecks', 'phase2.distribution.pressure_contrast')
        });

        const recoveryLossReport = runValidationForFixture(cloneFixtureAndMutate((fixture) => {
            fixture.environmentalRhythmPackage.synthesized.recoveryProfile = makeField(0.04, 'recoveryProfile');
            fixture.environmentalRhythmPackage.domains.recovery = {
                recoveryTempo: makeField(0.03, 'recoveryTempo'),
                stabilizationInterval: makeField(0.04, 'stabilizationInterval'),
                reliefPersistence: makeField(0.02, 'reliefPersistence'),
                environmentalForgiveness: makeField(0.05, 'environmentalForgiveness')
            };
        }));
        tests.push({
            testId: 'anti_recovery_loss',
            passed: findCheckStatus(recoveryLossReport, 'distributionChecks', 'phase2.distribution.relief_presence') === 'fail',
            observedStatus: findCheckStatus(recoveryLossReport, 'distributionChecks', 'phase2.distribution.relief_presence')
        });

        const collapseReport = runValidationForFixture(cloneFixtureAndMutate((fixture) => {
            fixture.pressureFieldPackage.summaries.pressureSummary = 'Overall pressure is led by recoveryProfile (0.7) and stormRhythm (0.6).';
            fixture.pressureFieldPackage.summaryMetadata.pressure.rhythmMeaningIncluded = true;
            fixture.environmentalRhythmPackage.summaries.rhythmSummary = 'Overall rhythm is shaped by survivabilityPressure (0.7) and mobilityPressure (0.6).';
        }));
        tests.push({
            testId: 'anti_pressure_rhythm_collapse',
            passed: (
                findCheckStatus(collapseReport, 'summaryChecks', 'phase2.summary.pressure_summary_correctness') === 'fail'
                && findCheckStatus(collapseReport, 'summaryChecks', 'phase2.summary.rhythm_summary_correctness') === 'fail'
            ),
            observedStatus: [
                findCheckStatus(collapseReport, 'summaryChecks', 'phase2.summary.pressure_summary_correctness'),
                findCheckStatus(collapseReport, 'summaryChecks', 'phase2.summary.rhythm_summary_correctness')
            ].join('|')
        });

        const climateDuplicationReport = runValidationForFixture(cloneFixtureAndMutate((fixture) => {
            fixture.pressureFieldPackage.metadata.rebuildsClimateGeneration = true;
        }));
        tests.push({
            testId: 'anti_climate_duplication',
            passed: findCheckStatus(climateDuplicationReport, 'boundaryChecks', 'phase2.boundary.pressure_climate_duplication') === 'fail',
            observedStatus: findCheckStatus(climateDuplicationReport, 'boundaryChecks', 'phase2.boundary.pressure_climate_duplication')
        });

        const handoffLeakageReport = runValidationForFixture(cloneFixtureAndMutate((fixture) => {
            fixture.phase2InputBundle.filteredHandoff.intakeMeta.promotedToRootTruth = true;
        }));
        tests.push({
            testId: 'anti_handoff_leakage',
            passed: findCheckStatus(handoffLeakageReport, 'boundaryChecks', 'phase2.boundary.handoff_leakage') === 'fail',
            observedStatus: findCheckStatus(handoffLeakageReport, 'boundaryChecks', 'phase2.boundary.handoff_leakage')
        });

        const recordBindingLossReport = runValidationForFixture(cloneFixtureAndMutate((fixture) => {
            fixture.phase2RecordBindingLayer.bindingMeta.inventsRecordIds = true;
        }));
        tests.push({
            testId: 'anti_record_binding_loss',
            passed: findCheckStatus(recordBindingLossReport, 'boundaryChecks', 'phase2.boundary.non_invention_rules') === 'fail',
            observedStatus: findCheckStatus(recordBindingLossReport, 'boundaryChecks', 'phase2.boundary.non_invention_rules')
        });

        return tests;
    }

    function runSmokeTests() {
        const tests = [];
        const baseFixture = createBaseInputFixture();
        const baseReport = runValidationForFixture(baseFixture);

        tests.push({
            testId: 'validation_report_populates_all_families',
            passed: ['structuralChecks', 'causalChecks', 'boundaryChecks', 'distributionChecks', 'designChecks', 'gameplayChecks', 'summaryChecks']
                .every((familyKey) => isPlainObject(baseReport[familyKey])),
            observedStatus: 'report_families_checked'
        });

        const exportShell = getExportShell();
        const blockedExport = exportShell.run({
            pressureFieldPackage: baseFixture.pressureFieldPackage,
            environmentalRhythmPackage: baseFixture.environmentalRhythmPackage,
            pressureSummaryOutput: {
                pressure: { summaries: cloneValue(baseFixture.pressureFieldPackage.summaries) },
                recordBoundProfiles: cloneValue(baseFixture.pressureFieldPackage.regionalProfiles)
            },
            rhythmSummaryOutput: {
                rhythm: { summaries: cloneValue(baseFixture.environmentalRhythmPackage.summaries) },
                recordBoundProfiles: cloneValue(baseFixture.environmentalRhythmPackage.regionalProfiles)
            },
            validationReport: {
                validationId: 'phase2-smoke-export',
                finalStatus: 'rebalance_required',
                blockingReasons: [],
                rebalanceRecommendations: []
            }
        });
        tests.push({
            testId: 'export_blocks_invalid_validation_status',
            passed: blockedExport.blocked === true && blockedExport.exported === false,
            observedStatus: `${String(blockedExport.blocked)}:${blockedExport.reason}`
        });

        const rebalanceShell = getRebalanceShell();
        const rebalancePlan = rebalanceShell.run({
            ...baseFixture,
            validationReport: baseReport
        });
        tests.push({
            testId: 'rebalance_metadata_records_local_only_responses',
            passed: Array.isArray(rebalancePlan.rebalanceMetadata)
                && rebalancePlan.rebalanceMetadata.every((entry) => entry.localPhase2Only === true && entry.rerunsPhase1Truth === false),
            observedStatus: String(Array.isArray(rebalancePlan.rebalanceMetadata) ? rebalancePlan.rebalanceMetadata.length : 0)
        });

        tests.push({
            testId: 'representative_snapshot_helpers_available',
            passed: getDebugApiReady(),
            observedStatus: getDebugApiReady() ? 'ready' : 'missing'
        });

        return tests;
    }

    function summarizeSuiteResults(testResults = []) {
        const total = Array.isArray(testResults) ? testResults.length : 0;
        const passed = (Array.isArray(testResults) ? testResults : []).filter((test) => test.passed === true).length;
        return {
            total,
            passed,
            failed: total - passed,
            status: passed === total ? 'pass' : 'fail'
        };
    }

    function createRepresentativePhase2SnapshotSet() {
        if (!getDebugApiReady()) {
            return deepFreeze({
                snapshotSetId: 'phase2RepresentativeSnapshots',
                status: 'not_available',
                representativeSeeds: REPRESENTATIVE_PROFILE_FIXTURES.map((fixture) => ({
                    fixtureId: fixture.fixtureId,
                    testSeed: fixture.testSeed,
                    planningProfile: fixture.planningProfile
                })),
                snapshots: []
            });
        }

        const profileSnapshots = REPRESENTATIVE_PROFILE_FIXTURES.map((fixture) => {
            const profile = {
                profileId: `${fixture.recordType}:${fixture.recordId}`,
                recordType: fixture.recordType,
                recordId: fixture.recordId,
                sourcePackageId: fixture.sourcePackageId,
                pressureSignals: cloneValue(fixture.pressureSignals),
                rhythmSignals: cloneValue(fixture.rhythmSignals),
                dominantEnvironmentalTraits: fixture.dominantEnvironmentalTraits.slice(),
                summary: fixture.summary
            };
            return phase2.createPhase2RecordProfileSnapshot(profile, {
                seedContext: {
                    sourceKind: 'testSeed',
                    seed: fixture.testSeed,
                    purpose: fixture.planningProfile
                }
            });
        });
        const pressureFieldSnapshots = [
            phase2.createPhase2FieldSnapshot(makeField(0.82, 'survivabilityPressure'), {
                snapshotFamily: 'pressure',
                domainId: 'synthesized',
                fieldId: 'survivabilityPressure',
                sourcePackageId: 'pressure.fixture.base',
                seedContext: {
                    sourceKind: 'testSeed',
                    seed: 20104,
                    purpose: 'low relief high burden'
                },
                summary: 'Representative high-burden synthesized pressure snapshot.'
            }),
            phase2.createPhase2FieldSnapshot(makeField(0.73, 'scarcityCadence'), {
                snapshotFamily: 'rhythm',
                domainId: 'scarcity',
                fieldId: 'scarcityCadence',
                sourcePackageId: 'rhythm.fixture.base',
                seedContext: {
                    sourceKind: 'testSeed',
                    seed: 20103,
                    purpose: 'scarcity cyclic'
                },
                summary: 'Representative scarcity cadence snapshot.'
            })
        ];
        const collectionSnapshot = phase2.createPhase2RecordProfileCollectionSnapshot(
            profileSnapshots.map((snapshot) => ({
                profileId: snapshot.payload.profilePreview.profileId,
                recordType: snapshot.payload.profilePreview.recordType,
                recordId: snapshot.payload.profilePreview.recordId,
                sourcePackageId: snapshot.payload.profilePreview.sourcePackageId,
                pressureSignals: snapshot.payload.profilePreview.pressureSignals || {},
                rhythmSignals: snapshot.payload.profilePreview.rhythmSignals || {},
                dominantEnvironmentalTraits: snapshot.payload.profilePreview.dominantEnvironmentalTraits,
                summary: snapshot.payload.profilePreview.summary
            })),
            {
                collectionId: 'representativePhase2Profiles',
                includeSignals: true,
                seedContext: {
                    sourceKind: 'fixtureSet',
                    seed: 20100,
                    purpose: 'representative semantic snapshots'
                },
                summary: 'Representative Phase 2 profile collection snapshot set.'
            }
        );

        return deepFreeze({
            snapshotSetId: 'phase2RepresentativeSnapshots',
            status: 'ready',
            representativeSeeds: REPRESENTATIVE_PROFILE_FIXTURES.map((fixture) => ({
                fixtureId: fixture.fixtureId,
                testSeed: fixture.testSeed,
                planningProfile: fixture.planningProfile
            })),
            snapshots: {
                pressureFields: pressureFieldSnapshots,
                recordProfiles: profileSnapshots,
                recordProfileCollection: collectionSnapshot
            }
        });
    }

    function getPhase2DownstreamReadinessNote() {
        return deepFreeze({
            phaseId: PHASE_ID,
            readinessId: 'phase2-downstream-readiness-note-v1',
            readyNow: [
                'pressureFieldPackage contract surface',
                'environmentalRhythmPackage contract surface',
                'record-bound profiles and field-backed summaries',
                'validation orchestration with structural/causal/boundary/distribution/design/gameplay/summary families',
                'selective rebalance trigger classification and local response paths',
                'validation-gated Phase 2 engine and export shell'
            ],
            foundationOnly: [
                'runtime adapter mapping is readiness-shaped but not yet implemented as a real bridge',
                'representative profile snapshots are fixture-grade support surfaces rather than canonical gameplay assets',
                'rebalance paths rerun local Phase 2 surfaces but do not tune thresholds autonomously'
            ],
            notReadyYet: [
                'no direct expedition/island-layout/world-spawn runtime integration',
                'no Phase 17.5 or downstream gameplay implementation',
                'no UI layer that consumes Phase 2 outputs as final player-facing truth'
            ],
            downstreamConsumerGuidance: 'Consume the engine/export outputs as validated environmental vocabulary. Do not assume runtime bridge behavior exists yet, and do not treat debug snapshots as canonical world state.'
        });
    }

    function runPhase2SmokeSuite() {
        const testResults = runSmokeTests();
        return deepFreeze({
            suiteId: 'phase2SmokeSuite',
            version: TEST_HARNESS_VERSION,
            phaseId: PHASE_ID,
            summary: summarizeSuiteResults(testResults),
            tests: testResults
        });
    }

    function runPhase2RegressionSuite() {
        const testResults = runNamedRegressionTests();
        return deepFreeze({
            suiteId: 'phase2RegressionSuite',
            version: TEST_HARNESS_VERSION,
            phaseId: PHASE_ID,
            summary: summarizeSuiteResults(testResults),
            tests: testResults
        });
    }

    function runPhase2TestHarness() {
        const smokeSuite = runPhase2SmokeSuite();
        const regressionSuite = runPhase2RegressionSuite();
        const representativeSnapshots = createRepresentativePhase2SnapshotSet();
        const readinessNote = getPhase2DownstreamReadinessNote();
        return deepFreeze({
            harnessId: TEST_HARNESS_ID,
            version: TEST_HARNESS_VERSION,
            phaseId: PHASE_ID,
            smokeSuite,
            regressionSuite,
            representativeSnapshots,
            readinessNote,
            overallStatus: (
                smokeSuite.summary.status === 'pass'
                && regressionSuite.summary.status === 'pass'
            ) ? 'pass' : 'fail'
        });
    }

    function getPhase2TestsModuleStub() {
        return STUB;
    }

    phase2.__contractFirstStubs = phase2.__contractFirstStubs || {};
    phase2.__contractFirstStubs[GROUP_ID] = STUB;

    Object.assign(phase2, {
        getPhase2TestsModuleStub,
        runPhase2SmokeSuite,
        runPhase2RegressionSuite,
        createRepresentativePhase2SnapshotSet,
        getPhase2DownstreamReadinessNote,
        runPhase2TestHarness
    });
})();
