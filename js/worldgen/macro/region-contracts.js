(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const CONTINENT_RECORD_CONTRACT_ID = 'continentRecord';
    const SEA_REGION_RECORD_CONTRACT_ID = 'seaRegionRecord';
    const ARCHIPELAGO_REGION_RECORD_CONTRACT_ID = 'archipelagoRegionRecord';
    const CHOKEPOINT_RECORD_CONTRACT_ID = 'chokepointRecord';
    const MACRO_ROUTE_RECORD_CONTRACT_ID = 'macroRouteRecord';
    const STRATEGIC_REGION_RECORD_CONTRACT_ID = 'strategicRegionRecord';
    const CONTINENT_UNIT_INTERVAL_FIELDS = Object.freeze([
        'cohesion',
        'coastalFragmentation',
        'interiorAccessibility',
        'climateLoad',
        'maritimeExposure'
    ]);
    const CONTINENT_STRING_FIELDS = Object.freeze([
        'continentId',
        'nameSeed',
        'macroShape',
        'dominantRelief',
        'strategicProfile'
    ]);
    const SEA_REGION_UNIT_INTERVAL_FIELDS = Object.freeze([
        'stormPressure',
        'navigability',
        'tradePotential',
        'militaryContestValue',
        'archipelagoDensity'
    ]);
    const SEA_REGION_STRING_FIELDS = Object.freeze([
        'seaRegionId',
        'type'
    ]);
    const ARCHIPELAGO_REGION_UNIT_INTERVAL_FIELDS = Object.freeze([
        'connectiveValue',
        'fragility',
        'colonizationAppeal',
        'longTermSustainability',
        'historicalVolatility'
    ]);
    const ARCHIPELAGO_REGION_STRING_FIELDS = Object.freeze([
        'archipelagoId',
        'roleProfile'
    ]);
    const CHOKEPOINT_UNIT_INTERVAL_FIELDS = Object.freeze([
        'controlValue',
        'tradeDependency',
        'bypassDifficulty',
        'collapseSensitivity'
    ]);
    const CHOKEPOINT_STRING_FIELDS = Object.freeze([
        'chokepointId',
        'type'
    ]);
    const MACRO_ROUTE_UNIT_INTERVAL_FIELDS = Object.freeze([
        'baseCost',
        'fragility',
        'redundancy',
        'historicalImportance'
    ]);
    const MACRO_ROUTE_STRING_FIELDS = Object.freeze([
        'routeId',
        'type',
        'fromRegion',
        'toRegion'
    ]);
    const STRATEGIC_REGION_UNIT_INTERVAL_FIELDS = Object.freeze([
        'stabilityScore',
        'expansionPressure'
    ]);
    const STRATEGIC_REGION_STRING_FIELDS = Object.freeze([
        'regionId',
        'type'
    ]);
    const STRATEGIC_REGION_VALUE_MIX_KEYS = Object.freeze([
        'food',
        'routes',
        'defense',
        'coast'
    ]);
    const TODO_STATUS = macro.todoContractedCode || 'TODO_CONTRACTED';
    const PHASE_VERSION = macro.phaseVersion || 'phase1-v1';

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

    function normalizeStringList(value) {
        return Array.isArray(value)
            ? value
                .filter((entry) => typeof entry === 'string' && entry.trim())
                .map((entry) => entry.trim())
            : [];
    }

    function clampUnitInterval(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        return Math.max(0, Math.min(1, numericValue));
    }

    function pushError(contractId, errors, message) {
        errors.push(`[${contractId}] ${message}`);
    }

    function validateRequiredStringFields(candidate, fieldNames, contractId, errors) {
        fieldNames.forEach((field) => {
            if (!hasOwn(candidate, field)) {
                pushError(contractId, errors, `Missing required key "${field}".`);
                return;
            }

            if (typeof candidate[field] !== 'string' || !candidate[field].trim()) {
                pushError(contractId, errors, `"${field}" must be a non-empty string.`);
            }
        });
    }

    function validateUnitIntervalFields(candidate, fieldNames, contractId, errors) {
        fieldNames.forEach((field) => {
            if (!hasOwn(candidate, field)) {
                pushError(contractId, errors, `Missing required key "${field}".`);
                return;
            }

            if (!Number.isFinite(candidate[field]) || candidate[field] < 0 || candidate[field] > 1) {
                pushError(contractId, errors, `"${field}" must be a number in the 0..1 range.`);
            }
        });
    }

    function validateStringArrayField(candidate, fieldName, contractId, errors, minimumLength = 0) {
        if (!hasOwn(candidate, fieldName)) {
            pushError(contractId, errors, `Missing required key "${fieldName}".`);
            return;
        }

        if (!Array.isArray(candidate[fieldName])) {
            pushError(contractId, errors, `"${fieldName}" must be an array.`);
            return;
        }

        if (candidate[fieldName].length < minimumLength) {
            pushError(contractId, errors, `"${fieldName}" must contain at least ${minimumLength} item(s).`);
        }

        candidate[fieldName].forEach((entry, index) => {
            if (typeof entry !== 'string' || !entry.trim()) {
                pushError(contractId, errors, `"${fieldName}[${index}]" must be a non-empty string.`);
            }
        });
    }

    function normalizeValueMix(value) {
        const normalizedValue = isPlainObject(value) ? value : {};
        return STRATEGIC_REGION_VALUE_MIX_KEYS.reduce((valueMix, key) => {
            valueMix[key] = clampUnitInterval(normalizedValue[key]);
            return valueMix;
        }, {});
    }

    function validateValueMixField(candidate, fieldName, contractId, errors) {
        if (!hasOwn(candidate, fieldName)) {
            pushError(contractId, errors, `Missing required key "${fieldName}".`);
            return;
        }

        if (!isPlainObject(candidate[fieldName])) {
            pushError(contractId, errors, `"${fieldName}" must be an object.`);
            return;
        }

        STRATEGIC_REGION_VALUE_MIX_KEYS.forEach((key) => {
            if (!hasOwn(candidate[fieldName], key)) {
                pushError(contractId, errors, `"${fieldName}.${key}" is required.`);
                return;
            }

            const value = candidate[fieldName][key];
            if (!Number.isFinite(value) || value < 0 || value > 1) {
                pushError(contractId, errors, `"${fieldName}.${key}" must be a number in the 0..1 range.`);
            }
        });
    }

    function createContinentRecordSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            continentId: normalizeString(normalizedInput.continentId, ''),
            nameSeed: normalizeString(normalizedInput.nameSeed, ''),
            macroShape: normalizeString(normalizedInput.macroShape, ''),
            cohesion: clampUnitInterval(normalizedInput.cohesion),
            coastalFragmentation: clampUnitInterval(normalizedInput.coastalFragmentation),
            interiorAccessibility: clampUnitInterval(normalizedInput.interiorAccessibility),
            climateLoad: clampUnitInterval(normalizedInput.climateLoad),
            maritimeExposure: clampUnitInterval(normalizedInput.maritimeExposure),
            dominantRelief: normalizeString(normalizedInput.dominantRelief, ''),
            strategicProfile: normalizeString(normalizedInput.strategicProfile, '')
        };
    }

    function createSeaRegionRecordSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            seaRegionId: normalizeString(normalizedInput.seaRegionId, ''),
            type: normalizeString(normalizedInput.type, ''),
            stormPressure: clampUnitInterval(normalizedInput.stormPressure),
            navigability: clampUnitInterval(normalizedInput.navigability),
            tradePotential: clampUnitInterval(normalizedInput.tradePotential),
            militaryContestValue: clampUnitInterval(normalizedInput.militaryContestValue),
            archipelagoDensity: clampUnitInterval(normalizedInput.archipelagoDensity)
        };
    }

    function createArchipelagoRegionRecordSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            archipelagoId: normalizeString(normalizedInput.archipelagoId, ''),
            roleProfile: normalizeString(normalizedInput.roleProfile, ''),
            connectiveValue: clampUnitInterval(normalizedInput.connectiveValue),
            fragility: clampUnitInterval(normalizedInput.fragility),
            colonizationAppeal: clampUnitInterval(normalizedInput.colonizationAppeal),
            longTermSustainability: clampUnitInterval(normalizedInput.longTermSustainability),
            historicalVolatility: clampUnitInterval(normalizedInput.historicalVolatility)
        };
    }

    function createChokepointRecordSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            chokepointId: normalizeString(normalizedInput.chokepointId, ''),
            type: normalizeString(normalizedInput.type, ''),
            controlValue: clampUnitInterval(normalizedInput.controlValue),
            tradeDependency: clampUnitInterval(normalizedInput.tradeDependency),
            bypassDifficulty: clampUnitInterval(normalizedInput.bypassDifficulty),
            collapseSensitivity: clampUnitInterval(normalizedInput.collapseSensitivity),
            adjacentRegions: normalizeStringList(normalizedInput.adjacentRegions)
        };
    }

    function createMacroRouteRecordSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            routeId: normalizeString(normalizedInput.routeId, ''),
            type: normalizeString(normalizedInput.type, ''),
            fromRegion: normalizeString(normalizedInput.fromRegion, ''),
            toRegion: normalizeString(normalizedInput.toRegion, ''),
            through: normalizeStringList(normalizedInput.through),
            baseCost: clampUnitInterval(normalizedInput.baseCost),
            fragility: clampUnitInterval(normalizedInput.fragility),
            redundancy: clampUnitInterval(normalizedInput.redundancy),
            historicalImportance: clampUnitInterval(normalizedInput.historicalImportance)
        };
    }

    function createStrategicRegionRecordSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            regionId: normalizeString(normalizedInput.regionId, ''),
            type: normalizeString(normalizedInput.type, ''),
            valueMix: normalizeValueMix(normalizedInput.valueMix),
            stabilityScore: clampUnitInterval(normalizedInput.stabilityScore),
            expansionPressure: clampUnitInterval(normalizedInput.expansionPressure)
        };
    }

    const CONTINENT_RECORD_CONTRACT = deepFreeze({
        contractId: CONTINENT_RECORD_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'continentId',
            'nameSeed',
            'macroShape',
            'cohesion',
            'coastalFragmentation',
            'interiorAccessibility',
            'climateLoad',
            'maritimeExposure',
            'dominantRelief',
            'strategicProfile'
        ],
        fields: {
            continentId: {
                type: 'string',
                description: 'Stable region identifier such as cont_01.'
            },
            nameSeed: {
                type: 'string',
                description: 'Stable naming seed for future history/name generation.'
            },
            macroShape: {
                type: 'string',
                description: 'High-level continent shape descriptor.'
            },
            cohesion: {
                type: 'number',
                range: [0, 1]
            },
            coastalFragmentation: {
                type: 'number',
                range: [0, 1]
            },
            interiorAccessibility: {
                type: 'number',
                range: [0, 1]
            },
            climateLoad: {
                type: 'number',
                range: [0, 1]
            },
            maritimeExposure: {
                type: 'number',
                range: [0, 1]
            },
            dominantRelief: {
                type: 'string',
                description: 'Summary of dominant relief pattern.'
            },
            strategicProfile: {
                type: 'string',
                description: 'Strategic role label for downstream historical generators.'
            }
        }
    });

    const SEA_REGION_RECORD_CONTRACT = deepFreeze({
        contractId: SEA_REGION_RECORD_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'seaRegionId',
            'type',
            'stormPressure',
            'navigability',
            'tradePotential',
            'militaryContestValue',
            'archipelagoDensity'
        ],
        fields: {
            seaRegionId: {
                type: 'string',
                description: 'Stable sea-region identifier such as sea_03.'
            },
            type: {
                type: 'string',
                description: 'Historical-role descriptor for downstream marine analyzers.'
            },
            stormPressure: {
                type: 'number',
                range: [0, 1]
            },
            navigability: {
                type: 'number',
                range: [0, 1]
            },
            tradePotential: {
                type: 'number',
                range: [0, 1]
            },
            militaryContestValue: {
                type: 'number',
                range: [0, 1]
            },
            archipelagoDensity: {
                type: 'number',
                range: [0, 1],
                description: 'How strongly the sea region is shaped by island density and corridors.'
            }
        }
    });

    const ARCHIPELAGO_REGION_RECORD_CONTRACT = deepFreeze({
        contractId: ARCHIPELAGO_REGION_RECORD_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'archipelagoId',
            'roleProfile',
            'connectiveValue',
            'fragility',
            'colonizationAppeal',
            'longTermSustainability',
            'historicalVolatility'
        ],
        fields: {
            archipelagoId: {
                type: 'string',
                description: 'Stable archipelago-region identifier such as arch_01.'
            },
            roleProfile: {
                type: 'string',
                description: 'Historical role seed for downstream history and politics generators.'
            },
            connectiveValue: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for later route-bridging importance.'
            },
            fragility: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for long-term loss-of-control sensitivity.'
            },
            colonizationAppeal: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for downstream colonization pressure.'
            },
            longTermSustainability: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for historical persistence and maintenance potential.'
            },
            historicalVolatility: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for downstream conflict/collapse volatility.'
            }
        },
        downstreamConsumers: [
            'historicalGeneration',
            'archipelagoRoleGenerator'
        ],
        historicalGenerationBridge: {
            phaseId: 'historicalGeneration',
            requiredFields: [
                'roleProfile',
                'connectiveValue',
                'fragility',
                'colonizationAppeal',
                'longTermSustainability',
                'historicalVolatility'
            ]
        }
    });

    const CHOKEPOINT_RECORD_CONTRACT = deepFreeze({
        contractId: CHOKEPOINT_RECORD_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'chokepointId',
            'type',
            'controlValue',
            'tradeDependency',
            'bypassDifficulty',
            'collapseSensitivity',
            'adjacentRegions'
        ],
        fields: {
            chokepointId: {
                type: 'string',
                description: 'Stable chokepoint identifier such as chk_07.'
            },
            type: {
                type: 'string',
                description: 'Chokepoint class label such as narrow_strait or island_chain_lock.'
            },
            controlValue: {
                type: 'number',
                range: [0, 1]
            },
            tradeDependency: {
                type: 'number',
                range: [0, 1]
            },
            bypassDifficulty: {
                type: 'number',
                range: [0, 1]
            },
            collapseSensitivity: {
                type: 'number',
                range: [0, 1]
            },
            adjacentRegions: {
                type: 'array',
                items: 'string',
                minLength: 1,
                description: 'Region ids touched or constrained by this chokepoint.'
            }
        }
    });

    const MACRO_ROUTE_RECORD_CONTRACT = deepFreeze({
        contractId: MACRO_ROUTE_RECORD_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'routeId',
            'type',
            'fromRegion',
            'toRegion',
            'through',
            'baseCost',
            'fragility',
            'redundancy',
            'historicalImportance'
        ],
        fields: {
            routeId: {
                type: 'string',
                description: 'Stable macro-route identifier such as route_11.'
            },
            type: {
                type: 'string',
                description: 'Route family label such as sea_major or hybrid_corridor.'
            },
            fromRegion: {
                type: 'string',
                description: 'Source region id for route analysis.'
            },
            toRegion: {
                type: 'string',
                description: 'Destination region id for route analysis.'
            },
            through: {
                type: 'array',
                items: 'string',
                minLength: 0,
                description: 'Ordered intermediate region or chokepoint ids along the route.'
            },
            baseCost: {
                type: 'number',
                range: [0, 1]
            },
            fragility: {
                type: 'number',
                range: [0, 1]
            },
            redundancy: {
                type: 'number',
                range: [0, 1]
            },
            historicalImportance: {
                type: 'number',
                range: [0, 1]
            }
        },
        downstreamConsumers: [
            'flowRouteAnalyzer',
            'historicalGeneration'
        ],
        routeAnalysisBridge: {
            analyzerId: 'flowRouteAnalyzer',
            requiredFields: [
                'fromRegion',
                'toRegion',
                'through',
                'baseCost',
                'fragility',
                'redundancy',
                'historicalImportance'
            ]
        }
    });

    const STRATEGIC_REGION_RECORD_CONTRACT = deepFreeze({
        contractId: STRATEGIC_REGION_RECORD_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'regionId',
            'type',
            'valueMix',
            'stabilityScore',
            'expansionPressure'
        ],
        fields: {
            regionId: {
                type: 'string',
                description: 'Stable strategic-region identifier such as str_04.'
            },
            type: {
                type: 'string',
                description: 'Strategic role label such as imperial_core_candidate or buffer_frontier.'
            },
            valueMix: {
                type: 'object',
                requiredKeys: STRATEGIC_REGION_VALUE_MIX_KEYS.slice(),
                description: 'Normalized strategic value composition for downstream region synthesis.'
            },
            stabilityScore: {
                type: 'number',
                range: [0, 1]
            },
            expansionPressure: {
                type: 'number',
                range: [0, 1]
            }
        }
    });

    function getContinentRecordContract() {
        return cloneValue(CONTINENT_RECORD_CONTRACT);
    }

    function getSeaRegionRecordContract() {
        return cloneValue(SEA_REGION_RECORD_CONTRACT);
    }

    function getArchipelagoRegionRecordContract() {
        return cloneValue(ARCHIPELAGO_REGION_RECORD_CONTRACT);
    }

    function getChokepointRecordContract() {
        return cloneValue(CHOKEPOINT_RECORD_CONTRACT);
    }

    function getMacroRouteRecordContract() {
        return cloneValue(MACRO_ROUTE_RECORD_CONTRACT);
    }

    function getStrategicRegionRecordContract() {
        return cloneValue(STRATEGIC_REGION_RECORD_CONTRACT);
    }

    function getRegionContractRegistry() {
        return {
            continentRecord: getContinentRecordContract(),
            seaRegionRecord: getSeaRegionRecordContract(),
            archipelagoRegionRecord: getArchipelagoRegionRecordContract(),
            chokepointRecord: getChokepointRecordContract(),
            macroRouteRecord: getMacroRouteRecordContract(),
            isolatedZoneRecord: {
                contractId: 'isolatedZoneRecord',
                status: TODO_STATUS
            },
            strategicRegionRecord: getStrategicRegionRecordContract()
        };
    }

    function getRegionRecordEntryPoints() {
        return {
            continentRecord: {
                contract: 'getContinentRecordContract',
                skeletonFactory: 'createContinentRecordSkeleton',
                validate: 'validateContinentRecord',
                assert: 'assertContinentRecord'
            },
            seaRegionRecord: {
                contract: 'getSeaRegionRecordContract',
                skeletonFactory: 'createSeaRegionRecordSkeleton',
                validate: 'validateSeaRegionRecord',
                assert: 'assertSeaRegionRecord'
            },
            archipelagoRegionRecord: {
                contract: 'getArchipelagoRegionRecordContract',
                skeletonFactory: 'createArchipelagoRegionRecordSkeleton',
                validate: 'validateArchipelagoRegionRecord',
                assert: 'assertArchipelagoRegionRecord',
                downstreamPhase: 'historicalGeneration'
            },
            chokepointRecord: {
                contract: 'getChokepointRecordContract',
                skeletonFactory: 'createChokepointRecordSkeleton',
                validate: 'validateChokepointRecord',
                assert: 'assertChokepointRecord',
                downstreamAnalyzer: 'chokepointAnalyzer'
            },
            macroRouteRecord: {
                contract: 'getMacroRouteRecordContract',
                skeletonFactory: 'createMacroRouteRecordSkeleton',
                validate: 'validateMacroRouteRecord',
                assert: 'assertMacroRouteRecord',
                downstreamAnalyzer: 'flowRouteAnalyzer'
            },
            strategicRegionRecord: {
                contract: 'getStrategicRegionRecordContract',
                skeletonFactory: 'createStrategicRegionRecordSkeleton',
                validate: 'validateStrategicRegionRecord',
                assert: 'assertStrategicRegionRecord'
            }
        };
    }

    function validateContinentRecord(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(CONTINENT_RECORD_CONTRACT_ID, errors, 'Record must be a plain object.');
            return {
                contractId: CONTINENT_RECORD_CONTRACT_ID,
                contractVersion: CONTINENT_RECORD_CONTRACT.version,
                isValid: false,
                errors
            };
        }

        validateRequiredStringFields(candidate, CONTINENT_STRING_FIELDS, CONTINENT_RECORD_CONTRACT_ID, errors);
        validateUnitIntervalFields(candidate, CONTINENT_UNIT_INTERVAL_FIELDS, CONTINENT_RECORD_CONTRACT_ID, errors);

        return {
            contractId: CONTINENT_RECORD_CONTRACT_ID,
            contractVersion: CONTINENT_RECORD_CONTRACT.version,
            isValid: errors.length === 0,
            errors
        };
    }

    function validateSeaRegionRecord(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(SEA_REGION_RECORD_CONTRACT_ID, errors, 'Record must be a plain object.');
            return {
                contractId: SEA_REGION_RECORD_CONTRACT_ID,
                contractVersion: SEA_REGION_RECORD_CONTRACT.version,
                isValid: false,
                errors
            };
        }

        validateRequiredStringFields(candidate, SEA_REGION_STRING_FIELDS, SEA_REGION_RECORD_CONTRACT_ID, errors);
        validateUnitIntervalFields(candidate, SEA_REGION_UNIT_INTERVAL_FIELDS, SEA_REGION_RECORD_CONTRACT_ID, errors);

        return {
            contractId: SEA_REGION_RECORD_CONTRACT_ID,
            contractVersion: SEA_REGION_RECORD_CONTRACT.version,
            isValid: errors.length === 0,
            errors
        };
    }

    function validateArchipelagoRegionRecord(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(ARCHIPELAGO_REGION_RECORD_CONTRACT_ID, errors, 'Record must be a plain object.');
            return {
                contractId: ARCHIPELAGO_REGION_RECORD_CONTRACT_ID,
                contractVersion: ARCHIPELAGO_REGION_RECORD_CONTRACT.version,
                isValid: false,
                errors
            };
        }

        validateRequiredStringFields(candidate, ARCHIPELAGO_REGION_STRING_FIELDS, ARCHIPELAGO_REGION_RECORD_CONTRACT_ID, errors);
        validateUnitIntervalFields(candidate, ARCHIPELAGO_REGION_UNIT_INTERVAL_FIELDS, ARCHIPELAGO_REGION_RECORD_CONTRACT_ID, errors);

        return {
            contractId: ARCHIPELAGO_REGION_RECORD_CONTRACT_ID,
            contractVersion: ARCHIPELAGO_REGION_RECORD_CONTRACT.version,
            isValid: errors.length === 0,
            errors
        };
    }

    function validateChokepointRecord(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(CHOKEPOINT_RECORD_CONTRACT_ID, errors, 'Record must be a plain object.');
            return {
                contractId: CHOKEPOINT_RECORD_CONTRACT_ID,
                contractVersion: CHOKEPOINT_RECORD_CONTRACT.version,
                isValid: false,
                errors
            };
        }

        validateRequiredStringFields(candidate, CHOKEPOINT_STRING_FIELDS, CHOKEPOINT_RECORD_CONTRACT_ID, errors);
        validateUnitIntervalFields(candidate, CHOKEPOINT_UNIT_INTERVAL_FIELDS, CHOKEPOINT_RECORD_CONTRACT_ID, errors);
        validateStringArrayField(candidate, 'adjacentRegions', CHOKEPOINT_RECORD_CONTRACT_ID, errors, 1);

        return {
            contractId: CHOKEPOINT_RECORD_CONTRACT_ID,
            contractVersion: CHOKEPOINT_RECORD_CONTRACT.version,
            isValid: errors.length === 0,
            errors
        };
    }

    function validateMacroRouteRecord(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(MACRO_ROUTE_RECORD_CONTRACT_ID, errors, 'Record must be a plain object.');
            return {
                contractId: MACRO_ROUTE_RECORD_CONTRACT_ID,
                contractVersion: MACRO_ROUTE_RECORD_CONTRACT.version,
                isValid: false,
                errors
            };
        }

        validateRequiredStringFields(candidate, MACRO_ROUTE_STRING_FIELDS, MACRO_ROUTE_RECORD_CONTRACT_ID, errors);
        validateUnitIntervalFields(candidate, MACRO_ROUTE_UNIT_INTERVAL_FIELDS, MACRO_ROUTE_RECORD_CONTRACT_ID, errors);
        validateStringArrayField(candidate, 'through', MACRO_ROUTE_RECORD_CONTRACT_ID, errors, 0);

        if (
            hasOwn(candidate, 'fromRegion')
            && hasOwn(candidate, 'toRegion')
            && typeof candidate.fromRegion === 'string'
            && typeof candidate.toRegion === 'string'
            && candidate.fromRegion.trim()
            && candidate.toRegion.trim()
            && candidate.fromRegion.trim() === candidate.toRegion.trim()
        ) {
            pushError(MACRO_ROUTE_RECORD_CONTRACT_ID, errors, '"fromRegion" and "toRegion" must reference different regions.');
        }

        return {
            contractId: MACRO_ROUTE_RECORD_CONTRACT_ID,
            contractVersion: MACRO_ROUTE_RECORD_CONTRACT.version,
            isValid: errors.length === 0,
            errors
        };
    }

    function validateStrategicRegionRecord(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(STRATEGIC_REGION_RECORD_CONTRACT_ID, errors, 'Record must be a plain object.');
            return {
                contractId: STRATEGIC_REGION_RECORD_CONTRACT_ID,
                contractVersion: STRATEGIC_REGION_RECORD_CONTRACT.version,
                isValid: false,
                errors
            };
        }

        validateRequiredStringFields(candidate, STRATEGIC_REGION_STRING_FIELDS, STRATEGIC_REGION_RECORD_CONTRACT_ID, errors);
        validateValueMixField(candidate, 'valueMix', STRATEGIC_REGION_RECORD_CONTRACT_ID, errors);
        validateUnitIntervalFields(candidate, STRATEGIC_REGION_UNIT_INTERVAL_FIELDS, STRATEGIC_REGION_RECORD_CONTRACT_ID, errors);

        return {
            contractId: STRATEGIC_REGION_RECORD_CONTRACT_ID,
            contractVersion: STRATEGIC_REGION_RECORD_CONTRACT.version,
            isValid: errors.length === 0,
            errors
        };
    }

    function assertContinentRecord(candidate) {
        const validationResult = validateContinentRecord(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'CONTINENT_RECORD_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    function assertSeaRegionRecord(candidate) {
        const validationResult = validateSeaRegionRecord(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'SEA_REGION_RECORD_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    function assertArchipelagoRegionRecord(candidate) {
        const validationResult = validateArchipelagoRegionRecord(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'ARCHIPELAGO_REGION_RECORD_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    function assertChokepointRecord(candidate) {
        const validationResult = validateChokepointRecord(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'CHOKEPOINT_RECORD_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    function assertMacroRouteRecord(candidate) {
        const validationResult = validateMacroRouteRecord(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'MACRO_ROUTE_RECORD_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    function assertStrategicRegionRecord(candidate) {
        const validationResult = validateStrategicRegionRecord(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'STRATEGIC_REGION_RECORD_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('regionContracts', {
            entry: 'getRegionContractRegistry',
            file: 'js/worldgen/macro/region-contracts.js',
            description: 'Region-level contract module with ContinentRecord, SeaRegionRecord, ArchipelagoRegionRecord, ChokepointRecord, MacroRouteRecord, and StrategicRegionRecord implemented; remaining region records are TODO CONTRACTED.',
            stub: false
        });
    }

    Object.assign(macro, {
        getContinentRecordContract,
        getSeaRegionRecordContract,
        getArchipelagoRegionRecordContract,
        getChokepointRecordContract,
        getMacroRouteRecordContract,
        getStrategicRegionRecordContract,
        getRegionContractRegistry,
        getRegionRecordEntryPoints,
        createContinentRecordSkeleton,
        createSeaRegionRecordSkeleton,
        createArchipelagoRegionRecordSkeleton,
        createChokepointRecordSkeleton,
        createMacroRouteRecordSkeleton,
        createStrategicRegionRecordSkeleton,
        validateContinentRecord,
        validateSeaRegionRecord,
        validateArchipelagoRegionRecord,
        validateChokepointRecord,
        validateMacroRouteRecord,
        validateStrategicRegionRecord,
        assertContinentRecord,
        assertSeaRegionRecord,
        assertArchipelagoRegionRecord,
        assertChokepointRecord,
        assertMacroRouteRecord,
        assertStrategicRegionRecord
    });
})();
