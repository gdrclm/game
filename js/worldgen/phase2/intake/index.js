(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const GROUP_ID = 'intake';
    const PHASE_ID = 'PHASE_2';
    const INPUT_BUNDLE_CONTRACT_ID = 'Phase2InputBundle';
    const INPUT_BUNDLE_VERSION = 'phase2-input-bundle-v1';
    const SOURCE_PACKAGE_CONTRACT_ID = 'MacroGeographyPackage';
    const SOURCE_HANDOFF_CONTRACT_ID = 'MacroGeographyHandoffPackage';
    const PHYSICAL_RECORD_COLLECTION_KEYS = Object.freeze([
        'continents',
        'seaRegions',
        'mountainSystems',
        'volcanicZones',
        'riverBasins',
        'climateBands',
        'reliefRegions'
    ]);
    const STRUCTURAL_RECORD_COLLECTION_KEYS = Object.freeze([
        'archipelagoRegions',
        'coastalOpportunityMap',
        'chokepoints',
        'macroRoutes',
        'isolatedZones',
        'strategicRegions'
    ]);
    const REQUIRED_RECORD_COLLECTION_KEYS = Object.freeze([
        ...PHYSICAL_RECORD_COLLECTION_KEYS,
        ...STRUCTURAL_RECORD_COLLECTION_KEYS
    ]);
    const REQUIRED_ROOT_SUPPORT_KEYS = Object.freeze([
        'macroSeed',
        'version',
        'worldBounds',
        'validationReport'
    ]);
    const PHASE2_RECORD_COLLECTION_MIN_COUNTS = Object.freeze({
        continents: 2,
        seaRegions: 1,
        mountainSystems: 1,
        volcanicZones: 1,
        riverBasins: 1,
        climateBands: 1,
        reliefRegions: 1,
        archipelagoRegions: 1,
        coastalOpportunityMap: 1,
        chokepoints: 1,
        macroRoutes: 1,
        isolatedZones: 1,
        strategicRegions: 1
    });
    const ALLOWED_HANDOFF_PATHS = Object.freeze([
        Object.freeze({
            path: 'collapsePressureSeeds.routeCascadeCandidates',
            type: 'array',
            category: 'collapse_pressure_seed',
            description: 'Route cascade candidates explicitly permitted as structural environmental pressure context.'
        }),
        Object.freeze({
            path: 'collapsePressureSeeds.specialistLossSensitiveRegions',
            type: 'array',
            category: 'collapse_pressure_seed',
            description: 'Specialist-loss sensitive regions explicitly permitted as structural environmental pressure context.'
        }),
        Object.freeze({
            path: 'collapsePressureSeeds.peripheryLossCandidates',
            type: 'array',
            category: 'collapse_pressure_seed',
            description: 'Periphery-loss candidates explicitly permitted as structural environmental pressure context.'
        }),
        Object.freeze({
            path: 'collapsePressureSeeds.archipelagoCollapseSensitivity',
            type: 'number',
            category: 'collapse_pressure_seed',
            description: 'Archipelago collapse sensitivity explicitly permitted as coarse structural pressure context.'
        }),
        Object.freeze({
            path: 'summaryForHistoryPhase.fragilePeripheries',
            type: 'array',
            category: 'limited_structural_summary',
            description: 'Fragile periphery summaries explicitly permitted for coarse environmental context weighting.'
        }),
        Object.freeze({
            path: 'summaryForHistoryPhase.routeBelts',
            type: 'array',
            category: 'limited_structural_summary',
            description: 'Route belt summaries explicitly permitted for coarse environmental context weighting.'
        }),
        Object.freeze({
            path: 'summaryForHistoryPhase.chokeBelts',
            type: 'array',
            category: 'limited_structural_summary',
            description: 'Choke belt summaries explicitly permitted for coarse environmental context weighting.'
        })
    ]);
    const ALLOWED_HANDOFF_ROOT_KEYS = Object.freeze([
        'packageId',
        'handoffPackageId',
        'version',
        'summaryForHistoryPhase',
        'collapsePressureSeeds'
    ]);
    const ALLOWED_HANDOFF_CHILD_KEYS = Object.freeze({
        summaryForHistoryPhase: Object.freeze([
            'fragilePeripheries',
            'routeBelts',
            'chokeBelts'
        ]),
        collapsePressureSeeds: Object.freeze([
            'routeCascadeCandidates',
            'specialistLossSensitiveRegions',
            'peripheryLossCandidates',
            'archipelagoCollapseSensitivity'
        ])
    });
    const FORBIDDEN_HANDOFF_SECTION_DESCRIPTORS = Object.freeze([
        Object.freeze({
            path: 'colonizationHints',
            category: 'colonization_expansion_hint',
            reason: 'Colonization hints are expansion-facing handoff semantics, not Phase 2 environmental truth.'
        }),
        Object.freeze({
            path: 'strategicHintsForPolitics',
            category: 'political_strategic_hint',
            reason: 'Strategic politics hints are political/history-facing and forbidden for Phase 2 intake.'
        }),
        Object.freeze({
            path: 'archipelagoRoleSeeds',
            category: 'archipelago_role_hint',
            reason: 'Archipelago role seeds are role-interpretive handoff semantics reserved for later phases.'
        }),
        Object.freeze({
            path: 'validationSummary',
            category: 'handoff_status_summary',
            reason: 'Handoff validation summary is not an explicitly permitted Phase 2 environmental input.'
        })
    ]);
    const STUB = Object.freeze({
        groupId: GROUP_ID,
        status: 'partial_implemented_contract_first',
        canonicalPath: 'js/worldgen/phase2/intake/',
        uiCoupling: false,
        implementsFieldLogic: false,
        purpose: 'Phase2InputBundle entry point for official Phase 1 root-package intake.'
    });

    function getPhase2IntakeModuleStub() {
        return STUB;
    }

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
            return value.map(cloneValue);
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
            );
        }

        return value;
    }

    function hasOwn(objectValue, key) {
        return Boolean(objectValue) && Object.prototype.hasOwnProperty.call(objectValue, key);
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string' && value.trim()
            ? value.trim()
            : fallback;
    }

    function normalizeSeed(seed) {
        if (typeof phase2.resolvePhase2SeedInput === 'function') {
            return phase2.resolvePhase2SeedInput({ macroSeed: seed }).seed;
        }

        const numericSeed = Number(seed);
        if (!Number.isFinite(numericSeed)) {
            return 0;
        }

        return numericSeed >>> 0;
    }

    function addIssue(issues, severity, code, path, message) {
        issues.push({
            severity,
            code,
            path,
            message
        });
    }

    function resolveMacroGeographyPackage(input) {
        if (isPlainObject(input) && isPlainObject(input.macroGeographyPackage)) {
            return input.macroGeographyPackage;
        }

        return input;
    }

    function resolveMacroGeographyHandoffPackage(input, options = {}) {
        if (isPlainObject(options) && hasOwn(options, 'macroGeographyHandoffPackage')) {
            return options.macroGeographyHandoffPackage;
        }

        if (isPlainObject(input) && hasOwn(input, 'macroGeographyHandoffPackage')) {
            return input.macroGeographyHandoffPackage;
        }

        return null;
    }

    function getNestedValue(source, path, fallback = undefined) {
        if (!source || typeof source !== 'object' || !path) {
            return fallback;
        }

        const pathSegments = String(path).split('.');
        let currentValue = source;

        for (const segment of pathSegments) {
            if (!segment) {
                continue;
            }

            if (!currentValue || typeof currentValue !== 'object' || !hasOwn(currentValue, segment)) {
                return fallback;
            }

            currentValue = currentValue[segment];
        }

        return currentValue === undefined ? fallback : currentValue;
    }

    function setNestedValue(target, path, value) {
        const pathSegments = String(path).split('.').filter(Boolean);
        if (!pathSegments.length) {
            return;
        }

        let currentValue = target;
        pathSegments.forEach((segment, index) => {
            const isLast = index === pathSegments.length - 1;
            if (isLast) {
                currentValue[segment] = value;
                return;
            }

            if (!isPlainObject(currentValue[segment])) {
                currentValue[segment] = {};
            }

            currentValue = currentValue[segment];
        });
    }

    function cloneRecordCollection(macroGeographyPackage, recordKey) {
        return Array.isArray(macroGeographyPackage[recordKey])
            ? cloneValue(macroGeographyPackage[recordKey])
            : [];
    }

    function buildRecordCollections(macroGeographyPackage) {
        return {
            physical: PHYSICAL_RECORD_COLLECTION_KEYS.reduce((records, recordKey) => {
                records[recordKey] = cloneRecordCollection(macroGeographyPackage, recordKey);
                return records;
            }, {}),
            structural: STRUCTURAL_RECORD_COLLECTION_KEYS.reduce((records, recordKey) => {
                records[recordKey] = cloneRecordCollection(macroGeographyPackage, recordKey);
                return records;
            }, {})
        };
    }

    function buildRecordCounts(macroGeographyPackage) {
        return REQUIRED_RECORD_COLLECTION_KEYS.reduce((recordCounts, recordKey) => {
            recordCounts[recordKey] = Array.isArray(macroGeographyPackage[recordKey])
                ? macroGeographyPackage[recordKey].length
                : 0;
            return recordCounts;
        }, {});
    }

    function buildSourceMacroGeographyPackageId(macroGeographyPackage) {
        const packageId = normalizeString(macroGeographyPackage.packageId);
        if (packageId) {
            return packageId;
        }

        const version = normalizeString(macroGeographyPackage.version, 'unknown-version');
        const macroSeed = normalizeSeed(macroGeographyPackage.macroSeed);
        return `macroGeographyPackage:${version}:${macroSeed}`;
    }

    function buildSourceHandoffPackageId(handoffPackage, sourceMacroGeographyPackageId) {
        const packageId = normalizeString(handoffPackage.packageId)
            || normalizeString(handoffPackage.handoffPackageId);
        if (packageId) {
            return packageId;
        }

        const version = normalizeString(handoffPackage.version, 'unknown-version');
        return `macroGeographyHandoffPackage:${version}:${sourceMacroGeographyPackageId}`;
    }

    function normalizeAllowedHandoffValue(value, descriptor, issues) {
        if (descriptor.type === 'array') {
            if (value === undefined) {
                return [];
            }

            if (!Array.isArray(value)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_allowed_handoff_section',
                    `macroGeographyHandoffPackage.${descriptor.path}`,
                    `Allowed handoff section must be an array: ${descriptor.path}.`
                );
                return [];
            }

            return cloneValue(value);
        }

        if (descriptor.type === 'number') {
            if (value === undefined || value === null) {
                return null;
            }

            if (!Number.isFinite(value)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_allowed_handoff_section',
                    `macroGeographyHandoffPackage.${descriptor.path}`,
                    `Allowed handoff section must be a finite number: ${descriptor.path}.`
                );
                return null;
            }

            return value;
        }

        return cloneValue(value);
    }

    function addBlockedHandoffPath(blockedSections, path, category, reason) {
        if (blockedSections.some((entry) => entry.path === path)) {
            return;
        }

        blockedSections.push({
            path,
            category,
            reason
        });
    }

    function collectBlockedHandoffSections(handoffPackage) {
        const blockedSections = [];

        FORBIDDEN_HANDOFF_SECTION_DESCRIPTORS.forEach((descriptor) => {
            if (getNestedValue(handoffPackage, descriptor.path, undefined) !== undefined) {
                addBlockedHandoffPath(
                    blockedSections,
                    descriptor.path,
                    descriptor.category,
                    descriptor.reason
                );
            }
        });

        Object.keys(handoffPackage).forEach((rootKey) => {
            if (!ALLOWED_HANDOFF_ROOT_KEYS.includes(rootKey)) {
                addBlockedHandoffPath(
                    blockedSections,
                    rootKey,
                    'unpermitted_handoff_section',
                    `Handoff section is not explicitly permitted for Phase 2 intake: ${rootKey}.`
                );
            }
        });

        Object.entries(ALLOWED_HANDOFF_CHILD_KEYS).forEach(([rootKey, allowedChildren]) => {
            const section = handoffPackage[rootKey];
            if (!isPlainObject(section)) {
                return;
            }

            Object.keys(section).forEach((childKey) => {
                if (!allowedChildren.includes(childKey)) {
                    addBlockedHandoffPath(
                        blockedSections,
                        `${rootKey}.${childKey}`,
                        'unpermitted_handoff_subsection',
                        `Handoff subsection is not explicitly permitted for Phase 2 intake: ${rootKey}.${childKey}.`
                    );
                }
            });
        });

        return blockedSections;
    }

    function createEmptyFilteredHandoff() {
        return {
            sourceHandoffPackageId: null,
            sourceHandoffVersion: null,
            sourceHandoffContractId: SOURCE_HANDOFF_CONTRACT_ID,
            allowedSections: {
                collapsePressureSeeds: {
                    routeCascadeCandidates: [],
                    specialistLossSensitiveRegions: [],
                    peripheryLossCandidates: [],
                    archipelagoCollapseSensitivity: null
                },
                summaryForHistoryPhase: {
                    fragilePeripheries: [],
                    routeBelts: [],
                    chokeBelts: []
                }
            },
            blockedSections: [],
            intakeMeta: {
                included: false,
                allowedPaths: ALLOWED_HANDOFF_PATHS.map((descriptor) => descriptor.path),
                blockedPaths: [],
                blockedCategories: [],
                allowedPathCount: 0,
                blockedPathCount: 0,
                filteredToAllowedSectionsOnly: true,
                promotedToRootTruth: false,
                treatsAllHandoffAsAllowed: false,
                politicalHistoryFieldsBlocked: false
            }
        };
    }

    function buildFilteredHandoffIntake(handoffPackage, sourceMacroGeographyPackageId) {
        const issues = [];
        const filteredHandoff = createEmptyFilteredHandoff();

        if (handoffPackage === null || handoffPackage === undefined) {
            return {
                filteredHandoff,
                validation: {
                    contractId: SOURCE_HANDOFF_CONTRACT_ID,
                    phase2ContractId: INPUT_BUNDLE_CONTRACT_ID,
                    isValid: true,
                    issues,
                    included: false
                }
            };
        }

        if (!isPlainObject(handoffPackage)) {
            addIssue(
                issues,
                'error',
                'invalid_macro_geography_handoff_package',
                'macroGeographyHandoffPackage',
                'MacroGeographyHandoffPackage intake must be an object when provided.'
            );
            return {
                filteredHandoff,
                validation: {
                    contractId: SOURCE_HANDOFF_CONTRACT_ID,
                    phase2ContractId: INPUT_BUNDLE_CONTRACT_ID,
                    isValid: false,
                    issues,
                    included: true
                }
            };
        }

        const blockedSections = collectBlockedHandoffSections(handoffPackage);
        const allowedPathCount = ALLOWED_HANDOFF_PATHS.reduce((count, descriptor) => {
            const value = getNestedValue(handoffPackage, descriptor.path, undefined);
            const normalizedValue = normalizeAllowedHandoffValue(value, descriptor, issues);
            setNestedValue(filteredHandoff.allowedSections, descriptor.path, normalizedValue);
            return value === undefined ? count : count + 1;
        }, 0);
        const blockedPaths = blockedSections.map((entry) => entry.path);
        const blockedCategories = Array.from(new Set(blockedSections.map((entry) => entry.category)));

        filteredHandoff.sourceHandoffPackageId = buildSourceHandoffPackageId(
            handoffPackage,
            sourceMacroGeographyPackageId
        );
        filteredHandoff.sourceHandoffVersion = normalizeString(handoffPackage.version, null);
        filteredHandoff.blockedSections = blockedSections;
        filteredHandoff.intakeMeta = {
            included: true,
            allowedPaths: ALLOWED_HANDOFF_PATHS.map((descriptor) => descriptor.path),
            blockedPaths,
            blockedCategories,
            allowedPathCount,
            blockedPathCount: blockedPaths.length,
            filteredToAllowedSectionsOnly: true,
            promotedToRootTruth: false,
            treatsAllHandoffAsAllowed: false,
            politicalHistoryFieldsBlocked: blockedCategories.some((category) => {
                return [
                    'colonization_expansion_hint',
                    'political_strategic_hint',
                    'archipelago_role_hint'
                ].includes(category);
            })
        };

        blockedSections.forEach((entry) => {
            addIssue(
                issues,
                'blocked',
                'blocked_forbidden_handoff_section',
                `macroGeographyHandoffPackage.${entry.path}`,
                entry.reason
            );
        });

        return {
            filteredHandoff,
            validation: {
                contractId: SOURCE_HANDOFF_CONTRACT_ID,
                phase2ContractId: INPUT_BUNDLE_CONTRACT_ID,
                isValid: !issues.some((issue) => issue.severity === 'error'),
                issues,
                included: true,
                allowedPaths: ALLOWED_HANDOFF_PATHS.map((descriptor) => descriptor.path),
                blockedPaths
            }
        };
    }

    function createFilteredPhase2HandoffIntake(handoffPackage, options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const sourceMacroGeographyPackageId = normalizeString(
            normalizedOptions.sourceMacroGeographyPackageId,
            'macroGeographyPackage:unknown'
        );

        return deepFreeze(buildFilteredHandoffIntake(
            handoffPackage,
            sourceMacroGeographyPackageId
        ));
    }

    function validatePhase2HandoffIntake(handoffPackage, options = {}) {
        return createFilteredPhase2HandoffIntake(handoffPackage, options).validation;
    }

    function getPhase2InputBundleContract() {
        return deepFreeze({
            contractId: INPUT_BUNDLE_CONTRACT_ID,
            version: INPUT_BUNDLE_VERSION,
            phaseId: PHASE_ID,
            sourcePackageContractId: SOURCE_PACKAGE_CONTRACT_ID,
            root: {
                requiredKeys: [
                    'bundleId',
                    'phaseId',
                    'version',
                    'sourceMacroGeographyPackageId',
                    'sourceMacroGeographyVersion',
                    'sourceMacroSeed',
                    'rootSupport',
                    'recordCollections',
                    'recordCounts',
                    'filteredHandoff',
                    'optionalDebugArtifacts',
                    'intakeMeta'
                ],
                recordCollections: {
                    physical: PHYSICAL_RECORD_COLLECTION_KEYS.slice(),
                    structural: STRUCTURAL_RECORD_COLLECTION_KEYS.slice()
                },
                rootSupportKeys: REQUIRED_ROOT_SUPPORT_KEYS.slice(),
                filteredHandoff: {
                    sourceContractId: SOURCE_HANDOFF_CONTRACT_ID,
                    allowedPaths: ALLOWED_HANDOFF_PATHS.map((descriptor) => ({
                        path: descriptor.path,
                        category: descriptor.category,
                        description: descriptor.description
                    })),
                    forbiddenSections: FORBIDDEN_HANDOFF_SECTION_DESCRIPTORS.map((descriptor) => ({
                        path: descriptor.path,
                        category: descriptor.category,
                        reason: descriptor.reason
                    }))
                }
            },
            requiredMacroGeographyPackageInputs: {
                recordCollections: REQUIRED_RECORD_COLLECTION_KEYS.slice(),
                rootSupport: REQUIRED_ROOT_SUPPORT_KEYS.slice(),
                minRecordCounts: { ...PHASE2_RECORD_COLLECTION_MIN_COUNTS }
            },
            forbiddenSourceBehavior: [
                'scrape_phase1_internals',
                'invent_missing_records',
                'replace_missing_root_records_with_debug_artifacts',
                'treat_handoff_hints_as_root_truth'
            ]
        });
    }

    function getPhase2FilteredHandoffIntakeContract() {
        return deepFreeze({
            contractId: `${INPUT_BUNDLE_CONTRACT_ID}.filteredHandoff`,
            version: INPUT_BUNDLE_VERSION,
            sourceContractId: SOURCE_HANDOFF_CONTRACT_ID,
            allowedPaths: ALLOWED_HANDOFF_PATHS.map((descriptor) => ({
                path: descriptor.path,
                valueType: descriptor.type,
                category: descriptor.category,
                description: descriptor.description
            })),
            forbiddenSections: FORBIDDEN_HANDOFF_SECTION_DESCRIPTORS.map((descriptor) => ({
                path: descriptor.path,
                category: descriptor.category,
                reason: descriptor.reason
            })),
            sourceRules: {
                treatAllHandoffAsAllowed: false,
                promotedToRootTruth: false,
                filteredToAllowedSectionsOnly: true
            }
        });
    }

    function validatePhase2MacroGeographyPackageIntake(input) {
        const macroGeographyPackage = resolveMacroGeographyPackage(input);
        const issues = [];

        if (!isPlainObject(macroGeographyPackage)) {
            addIssue(
                issues,
                'error',
                'invalid_macro_geography_package_root',
                'macroGeographyPackage',
                'Phase2InputBundle intake requires a MacroGeographyPackage root object.'
            );
            return deepFreeze({
                contractId: SOURCE_PACKAGE_CONTRACT_ID,
                phase2ContractId: INPUT_BUNDLE_CONTRACT_ID,
                isValid: false,
                issues,
                requiredRecordCollections: REQUIRED_RECORD_COLLECTION_KEYS.slice(),
                requiredRootSupport: REQUIRED_ROOT_SUPPORT_KEYS.slice(),
                recordCounts: {}
            });
        }

        REQUIRED_ROOT_SUPPORT_KEYS.forEach((supportKey) => {
            if (!hasOwn(macroGeographyPackage, supportKey)) {
                addIssue(
                    issues,
                    'error',
                    'missing_required_root_support',
                    `macroGeographyPackage.${supportKey}`,
                    `MacroGeographyPackage missing required Phase 2 root support field: ${supportKey}.`
                );
            }
        });

        if (hasOwn(macroGeographyPackage, 'macroSeed') && !Number.isInteger(macroGeographyPackage.macroSeed)) {
            addIssue(
                issues,
                'error',
                'invalid_macro_seed',
                'macroGeographyPackage.macroSeed',
                'MacroGeographyPackage.macroSeed must be an integer.'
            );
        }

        if (hasOwn(macroGeographyPackage, 'version') && !normalizeString(macroGeographyPackage.version)) {
            addIssue(
                issues,
                'error',
                'invalid_macro_geography_version',
                'macroGeographyPackage.version',
                'MacroGeographyPackage.version must be a non-empty string.'
            );
        }

        if (hasOwn(macroGeographyPackage, 'worldBounds')) {
            const worldBounds = macroGeographyPackage.worldBounds;
            if (!isPlainObject(worldBounds)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_world_bounds',
                    'macroGeographyPackage.worldBounds',
                    'MacroGeographyPackage.worldBounds must be an object.'
                );
            } else {
                ['width', 'height'].forEach((dimensionKey) => {
                    if (!Number.isFinite(worldBounds[dimensionKey]) || worldBounds[dimensionKey] <= 0) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_world_bounds_dimension',
                            `macroGeographyPackage.worldBounds.${dimensionKey}`,
                            `MacroGeographyPackage.worldBounds.${dimensionKey} must be a positive finite number.`
                        );
                    }
                });
            }
        }

        if (hasOwn(macroGeographyPackage, 'validationReport')) {
            if (!isPlainObject(macroGeographyPackage.validationReport)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_validation_report',
                    'macroGeographyPackage.validationReport',
                    'MacroGeographyPackage.validationReport must be an object.'
                );
            } else if (macroGeographyPackage.validationReport.isValid === false) {
                addIssue(
                    issues,
                    'error',
                    'failed_macro_validation_report',
                    'macroGeographyPackage.validationReport.isValid',
                    'MacroGeographyPackage.validationReport reports failure; Phase 2 intake must stop.'
                );
            }
        }

        REQUIRED_RECORD_COLLECTION_KEYS.forEach((recordKey) => {
            const path = `macroGeographyPackage.${recordKey}`;
            if (!hasOwn(macroGeographyPackage, recordKey)) {
                addIssue(
                    issues,
                    'error',
                    'missing_required_root_record_collection',
                    path,
                    `MacroGeographyPackage missing required Phase 2 root record collection: ${recordKey}.`
                );
                return;
            }

            if (!Array.isArray(macroGeographyPackage[recordKey])) {
                addIssue(
                    issues,
                    'error',
                    'invalid_required_root_record_collection',
                    path,
                    `MacroGeographyPackage.${recordKey} must be an array.`
                );
                return;
            }

            const minimumCount = PHASE2_RECORD_COLLECTION_MIN_COUNTS[recordKey] || 1;
            if (macroGeographyPackage[recordKey].length < minimumCount) {
                addIssue(
                    issues,
                    'error',
                    'insufficient_required_root_records',
                    path,
                    `MacroGeographyPackage.${recordKey} must contain at least ${minimumCount} record(s) for Phase 2 intake.`
                );
            }

            macroGeographyPackage[recordKey].forEach((record, recordIndex) => {
                if (!isPlainObject(record)) {
                    addIssue(
                        issues,
                        'error',
                        'invalid_root_record_entry',
                        `${path}[${recordIndex}]`,
                        `MacroGeographyPackage.${recordKey}[${recordIndex}] must be a record object.`
                    );
                }
            });
        });

        if (hasOwn(macroGeographyPackage, 'debugArtifacts') && !isPlainObject(macroGeographyPackage.debugArtifacts)) {
            addIssue(
                issues,
                'error',
                'invalid_debug_artifacts',
                'macroGeographyPackage.debugArtifacts',
                'MacroGeographyPackage.debugArtifacts must be an object when present.'
            );
        }

        return deepFreeze({
            contractId: SOURCE_PACKAGE_CONTRACT_ID,
            phase2ContractId: INPUT_BUNDLE_CONTRACT_ID,
            isValid: !issues.some((issue) => issue.severity === 'error'),
            issues,
            requiredRecordCollections: REQUIRED_RECORD_COLLECTION_KEYS.slice(),
            requiredRootSupport: REQUIRED_ROOT_SUPPORT_KEYS.slice(),
            recordCounts: buildRecordCounts(macroGeographyPackage)
        });
    }

    function assertPhase2MacroGeographyPackageIntake(input) {
        const validation = validatePhase2MacroGeographyPackageIntake(input);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid MacroGeographyPackage intake: ${detail}`);
        }

        return validation;
    }

    function createPhase2InputBundle(input, options = {}) {
        const macroGeographyPackage = resolveMacroGeographyPackage(input);
        const normalizedOptions = isPlainObject(options) ? options : {};
        const macroGeographyHandoffPackage = resolveMacroGeographyHandoffPackage(input, normalizedOptions);
        const sourceValidation = assertPhase2MacroGeographyPackageIntake(macroGeographyPackage);
        const sourceMacroGeographyPackageId = buildSourceMacroGeographyPackageId(macroGeographyPackage);
        const handoffIntake = buildFilteredHandoffIntake(
            macroGeographyHandoffPackage,
            sourceMacroGeographyPackageId
        );
        if (!handoffIntake.validation.isValid) {
            const detail = handoffIntake.validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid MacroGeographyHandoffPackage intake: ${detail}`);
        }
        const rootSupport = {
            macroSeed: normalizeSeed(macroGeographyPackage.macroSeed),
            version: normalizeString(macroGeographyPackage.version),
            worldBounds: cloneValue(macroGeographyPackage.worldBounds),
            validationReport: cloneValue(macroGeographyPackage.validationReport)
        };
        const recordCollections = buildRecordCollections(macroGeographyPackage);
        const recordCounts = buildRecordCounts(macroGeographyPackage);
        const physicalWorldDebugBundle = isPlainObject(
            macroGeographyPackage.debugArtifacts
            && macroGeographyPackage.debugArtifacts.physicalWorldDebugBundle
        )
            ? cloneValue(macroGeographyPackage.debugArtifacts.physicalWorldDebugBundle)
            : null;

        return deepFreeze({
            bundleId: normalizeString(
                normalizedOptions.bundleId,
                `phase2InputBundle:${sourceMacroGeographyPackageId}`
            ),
            phaseId: PHASE_ID,
            version: INPUT_BUNDLE_VERSION,
            sourceMacroGeographyPackageId,
            sourceMacroGeographyVersion: rootSupport.version,
            sourceMacroSeed: rootSupport.macroSeed,
            rootSupport,
            recordCollections,
            recordCounts,
            filteredHandoff: handoffIntake.filteredHandoff,
            optionalDebugArtifacts: {
                physicalWorldDebugBundle
            },
            intakeMeta: {
                sourcePackageContractId: SOURCE_PACKAGE_CONTRACT_ID,
                sourceValidation,
                handoffValidation: handoffIntake.validation,
                requiredRecordCollections: REQUIRED_RECORD_COLLECTION_KEYS.slice(),
                requiredRootSupport: REQUIRED_ROOT_SUPPORT_KEYS.slice(),
                physicalRecordCollections: PHYSICAL_RECORD_COLLECTION_KEYS.slice(),
                structuralRecordCollections: STRUCTURAL_RECORD_COLLECTION_KEYS.slice(),
                handoffIncluded: handoffIntake.filteredHandoff.intakeMeta.included,
                allowedHandoffPaths: handoffIntake.filteredHandoff.intakeMeta.allowedPaths.slice(),
                blockedHandoffPaths: handoffIntake.filteredHandoff.intakeMeta.blockedPaths.slice(),
                blockedHandoffCategories: handoffIntake.filteredHandoff.intakeMeta.blockedCategories.slice(),
                consumesPhase1Internals: false,
                inventsMissingRecords: false,
                debugArtifactsAreCanonicalTruth: false,
                handoffPromotedToRootTruth: false,
                treatsAllHandoffAsAllowed: false
            }
        });
    }

    function validateFilteredHandoffBundleSection(filteredHandoff, issues) {
        if (!isPlainObject(filteredHandoff)) {
            addIssue(
                issues,
                'error',
                'invalid_phase2_filtered_handoff',
                'phase2InputBundle.filteredHandoff',
                'Phase2InputBundle.filteredHandoff must be an object.'
            );
            return;
        }

        if (!isPlainObject(filteredHandoff.allowedSections)) {
            addIssue(
                issues,
                'error',
                'invalid_filtered_handoff_allowed_sections',
                'phase2InputBundle.filteredHandoff.allowedSections',
                'Phase2InputBundle.filteredHandoff.allowedSections must be an object.'
            );
            return;
        }

        Object.keys(filteredHandoff.allowedSections).forEach((sectionKey) => {
            if (!hasOwn(ALLOWED_HANDOFF_CHILD_KEYS, sectionKey)) {
                addIssue(
                    issues,
                    'error',
                    'forbidden_filtered_handoff_section',
                    `phase2InputBundle.filteredHandoff.allowedSections.${sectionKey}`,
                    `Filtered handoff contains a non-permitted section: ${sectionKey}.`
                );
                return;
            }

            const allowedSection = filteredHandoff.allowedSections[sectionKey];
            if (!isPlainObject(allowedSection)) {
                addIssue(
                    issues,
                    'error',
                    'invalid_filtered_handoff_section',
                    `phase2InputBundle.filteredHandoff.allowedSections.${sectionKey}`,
                    `Filtered handoff section must be an object: ${sectionKey}.`
                );
                return;
            }

            Object.keys(allowedSection).forEach((childKey) => {
                if (!ALLOWED_HANDOFF_CHILD_KEYS[sectionKey].includes(childKey)) {
                    addIssue(
                        issues,
                        'error',
                        'forbidden_filtered_handoff_subsection',
                        `phase2InputBundle.filteredHandoff.allowedSections.${sectionKey}.${childKey}`,
                        `Filtered handoff contains a non-permitted subsection: ${sectionKey}.${childKey}.`
                    );
                }
            });
        });

        if (!Array.isArray(filteredHandoff.blockedSections)) {
            addIssue(
                issues,
                'error',
                'invalid_filtered_handoff_blocked_sections',
                'phase2InputBundle.filteredHandoff.blockedSections',
                'Phase2InputBundle.filteredHandoff.blockedSections must be an array.'
            );
        }

        if (!isPlainObject(filteredHandoff.intakeMeta)) {
            addIssue(
                issues,
                'error',
                'invalid_filtered_handoff_intake_meta',
                'phase2InputBundle.filteredHandoff.intakeMeta',
                'Phase2InputBundle.filteredHandoff.intakeMeta must be an object.'
            );
        } else {
            if (filteredHandoff.intakeMeta.promotedToRootTruth === true) {
                addIssue(
                    issues,
                    'error',
                    'filtered_handoff_promoted_to_root_truth',
                    'phase2InputBundle.filteredHandoff.intakeMeta.promotedToRootTruth',
                    'Filtered handoff hints must not be promoted to root truth.'
                );
            }

            if (filteredHandoff.intakeMeta.treatsAllHandoffAsAllowed === true) {
                addIssue(
                    issues,
                    'error',
                    'filtered_handoff_treats_all_handoff_as_allowed',
                    'phase2InputBundle.filteredHandoff.intakeMeta.treatsAllHandoffAsAllowed',
                    'Phase 2 must not treat all handoff fields as allowed.'
                );
            }
        }
    }

    function validatePhase2InputBundle(bundleCandidate = {}) {
        const issues = [];

        if (!isPlainObject(bundleCandidate)) {
            addIssue(
                issues,
                'error',
                'invalid_phase2_input_bundle_root',
                'phase2InputBundle',
                'Phase2InputBundle must be an object.'
            );
            return deepFreeze({
                contractId: INPUT_BUNDLE_CONTRACT_ID,
                version: INPUT_BUNDLE_VERSION,
                isValid: false,
                issues
            });
        }

        getPhase2InputBundleContract().root.requiredKeys.forEach((key) => {
            if (!hasOwn(bundleCandidate, key)) {
                addIssue(
                    issues,
                    'error',
                    'missing_phase2_input_bundle_key',
                    `phase2InputBundle.${key}`,
                    `Phase2InputBundle missing required key: ${key}.`
                );
            }
        });

        if (bundleCandidate.phaseId !== PHASE_ID) {
            addIssue(
                issues,
                'error',
                'invalid_phase2_input_bundle_phase',
                'phase2InputBundle.phaseId',
                `Phase2InputBundle.phaseId must be ${PHASE_ID}.`
            );
        }

        if (!isPlainObject(bundleCandidate.rootSupport)) {
            addIssue(
                issues,
                'error',
                'invalid_phase2_input_bundle_root_support',
                'phase2InputBundle.rootSupport',
                'Phase2InputBundle.rootSupport must be an object.'
            );
        } else {
            REQUIRED_ROOT_SUPPORT_KEYS.forEach((supportKey) => {
                if (!hasOwn(bundleCandidate.rootSupport, supportKey)) {
                    addIssue(
                        issues,
                        'error',
                        'missing_phase2_input_bundle_root_support',
                        `phase2InputBundle.rootSupport.${supportKey}`,
                        `Phase2InputBundle.rootSupport missing required key: ${supportKey}.`
                    );
                }
            });
        }

        if (!isPlainObject(bundleCandidate.recordCollections)) {
            addIssue(
                issues,
                'error',
                'invalid_phase2_input_bundle_record_collections',
                'phase2InputBundle.recordCollections',
                'Phase2InputBundle.recordCollections must be an object.'
            );
        } else {
            [
                ['physical', PHYSICAL_RECORD_COLLECTION_KEYS],
                ['structural', STRUCTURAL_RECORD_COLLECTION_KEYS]
            ].forEach(([groupKey, recordKeys]) => {
                const group = bundleCandidate.recordCollections[groupKey];
                if (!isPlainObject(group)) {
                    addIssue(
                        issues,
                        'error',
                        'missing_phase2_input_bundle_record_group',
                        `phase2InputBundle.recordCollections.${groupKey}`,
                        `Phase2InputBundle.recordCollections.${groupKey} must be an object.`
                    );
                    return;
                }

                recordKeys.forEach((recordKey) => {
                    const path = `phase2InputBundle.recordCollections.${groupKey}.${recordKey}`;
                    if (!Array.isArray(group[recordKey])) {
                        addIssue(
                            issues,
                            'error',
                            'invalid_phase2_input_bundle_record_collection',
                            path,
                            `${path} must be an array.`
                        );
                        return;
                    }

                    const minimumCount = PHASE2_RECORD_COLLECTION_MIN_COUNTS[recordKey] || 1;
                    if (group[recordKey].length < minimumCount) {
                        addIssue(
                            issues,
                            'error',
                            'insufficient_phase2_input_bundle_records',
                            path,
                            `${path} must contain at least ${minimumCount} record(s).`
                        );
                    }
                });
            });
        }

        validateFilteredHandoffBundleSection(bundleCandidate.filteredHandoff, issues);

        return deepFreeze({
            contractId: INPUT_BUNDLE_CONTRACT_ID,
            version: INPUT_BUNDLE_VERSION,
            isValid: !issues.some((issue) => issue.severity === 'error'),
            issues
        });
    }

    function assertPhase2InputBundle(bundleCandidate = {}) {
        const validation = validatePhase2InputBundle(bundleCandidate);
        if (!validation.isValid) {
            const detail = validation.issues
                .map((issue) => `${issue.code}:${issue.path}`)
                .join(', ');
            throw new Error(`[worldgen/phase2] Invalid Phase2InputBundle: ${detail}`);
        }

        return bundleCandidate;
    }

    function getPhase2RequiredMacroRootRecordKeys() {
        return REQUIRED_RECORD_COLLECTION_KEYS.slice();
    }

    phase2.__contractFirstStubs = phase2.__contractFirstStubs || {};
    phase2.__contractFirstStubs[GROUP_ID] = STUB;
    phase2.intake = deepFreeze({
        getPhase2IntakeModuleStub,
        getPhase2InputBundleContract,
        getPhase2FilteredHandoffIntakeContract,
        getPhase2RequiredMacroRootRecordKeys,
        createFilteredPhase2HandoffIntake,
        validatePhase2HandoffIntake,
        validatePhase2MacroGeographyPackageIntake,
        assertPhase2MacroGeographyPackageIntake,
        createPhase2InputBundle,
        validatePhase2InputBundle,
        assertPhase2InputBundle
    });

    Object.assign(phase2, {
        getPhase2IntakeModuleStub,
        getPhase2InputBundleContract,
        getPhase2FilteredHandoffIntakeContract,
        getPhase2RequiredMacroRootRecordKeys,
        createFilteredPhase2HandoffIntake,
        validatePhase2HandoffIntake,
        validatePhase2MacroGeographyPackageIntake,
        assertPhase2MacroGeographyPackageIntake,
        createPhase2InputBundle,
        validatePhase2InputBundle,
        assertPhase2InputBundle
    });
})();
