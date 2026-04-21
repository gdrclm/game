(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const PLATE_RECORD_CONTRACT_ID = 'plateRecord';
    const CONTINENT_RECORD_CONTRACT_ID = 'continentRecord';
    const SEA_REGION_RECORD_CONTRACT_ID = 'seaRegionRecord';
    const MOUNTAIN_SYSTEM_RECORD_CONTRACT_ID = 'mountainSystemRecord';
    const VOLCANIC_ZONE_RECORD_CONTRACT_ID = 'volcanicZoneRecord';
    const RIVER_BASIN_RECORD_CONTRACT_ID = 'riverBasinRecord';
    const CLIMATE_BAND_RECORD_CONTRACT_ID = 'climateBandRecord';
    const RELIEF_REGION_RECORD_CONTRACT_ID = 'reliefRegionRecord';
    const ARCHIPELAGO_REGION_RECORD_CONTRACT_ID = 'archipelagoRegionRecord';
    const CHOKEPOINT_RECORD_CONTRACT_ID = 'chokepointRecord';
    const MACRO_ROUTE_RECORD_CONTRACT_ID = 'macroRouteRecord';
    const STRATEGIC_REGION_RECORD_CONTRACT_ID = 'strategicRegionRecord';
    const PLATE_UNIT_INTERVAL_FIELDS = Object.freeze([
        'upliftBias',
        'fractureBias',
        'compressionBias',
        'driftBias',
        'arcFormationBias'
    ]);
    const PLATE_STRING_FIELDS = Object.freeze([
        'plateId',
        'plateClass'
    ]);
    const CONTINENT_STRING_FIELDS = Object.freeze([
        'continentId',
        'nameSeed',
        'macroShape',
        'primaryReliefRegionId',
        'primaryClimateBandId'
    ]);
    const CONTINENT_STRING_ARRAY_FIELDS = Object.freeze([
        'plateIds',
        'reliefRegionIds',
        'climateBandIds'
    ]);
    const SEA_REGION_UNIT_INTERVAL_FIELDS = Object.freeze([
        'stormPressure',
        'navigability'
    ]);
    const SEA_REGION_STRING_FIELDS = Object.freeze([
        'seaRegionId',
        'basinType',
        'primaryClimateBandId'
    ]);
    const SEA_REGION_STRING_ARRAY_FIELDS = Object.freeze([
        'climateBandIds'
    ]);
    const MOUNTAIN_SYSTEM_UNIT_INTERVAL_FIELDS = Object.freeze([
        'upliftBias',
        'ridgeContinuity'
    ]);
    const MOUNTAIN_SYSTEM_STRING_FIELDS = Object.freeze([
        'mountainSystemId',
        'systemType',
        'primaryReliefRegionId',
        'spineOrientation'
    ]);
    const MOUNTAIN_SYSTEM_STRING_ARRAY_FIELDS = Object.freeze([
        'plateIds',
        'reliefRegionIds'
    ]);
    const VOLCANIC_ZONE_UNIT_INTERVAL_FIELDS = Object.freeze([
        'activityBias',
        'zoneContinuity'
    ]);
    const VOLCANIC_ZONE_STRING_FIELDS = Object.freeze([
        'volcanicZoneId',
        'sourceType',
        'primaryReliefRegionId'
    ]);
    const VOLCANIC_ZONE_STRING_ARRAY_FIELDS = Object.freeze([
        'plateIds',
        'reliefRegionIds',
        'mountainSystemIds'
    ]);
    const RIVER_BASIN_UNIT_INTERVAL_FIELDS = Object.freeze([
        'catchmentScale',
        'basinContinuity'
    ]);
    const RIVER_BASIN_STRING_FIELDS = Object.freeze([
        'riverBasinId',
        'basinType',
        'primaryReliefRegionId'
    ]);
    const RIVER_BASIN_REQUIRED_STRING_ARRAY_FIELDS = Object.freeze([
        'reliefRegionIds'
    ]);
    const RIVER_BASIN_OPTIONAL_STRING_ARRAY_FIELDS = Object.freeze([
        'sourceMountainSystemIds',
        'climateBandIds',
        'terminalSeaRegionIds'
    ]);
    const CLIMATE_BAND_UNIT_INTERVAL_FIELDS = Object.freeze([
        'temperatureBias',
        'humidityBias',
        'seasonalityBias'
    ]);
    const CLIMATE_BAND_STRING_FIELDS = Object.freeze([
        'climateBandId',
        'bandType',
        'primaryReliefRegionId'
    ]);
    const CLIMATE_BAND_REQUIRED_STRING_ARRAY_FIELDS = Object.freeze([
        'reliefRegionIds'
    ]);
    const CLIMATE_BAND_OPTIONAL_STRING_ARRAY_FIELDS = Object.freeze([
        'seaRegionIds'
    ]);
    const RELIEF_REGION_UNIT_INTERVAL_FIELDS = Object.freeze([
        'elevationBias',
        'ruggednessBias',
        'coastalInfluence'
    ]);
    const RELIEF_REGION_STRING_FIELDS = Object.freeze([
        'reliefRegionId',
        'reliefType',
        'primaryPlateId'
    ]);
    const RELIEF_REGION_REQUIRED_STRING_ARRAY_FIELDS = Object.freeze([
        'plateIds'
    ]);
    const RELIEF_REGION_OPTIONAL_STRING_ARRAY_FIELDS = Object.freeze([
        'continentIds',
        'adjacentSeaRegionIds'
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
        'morphologyType',
        'roleProfile',
        'primarySeaRegionId',
        'primaryClimateBandId'
    ]);
    const ARCHIPELAGO_REGION_PHYSICAL_REF_ARRAY_FIELDS = Object.freeze([
        'seaRegionIds',
        'climateBandIds'
    ]);
    const ARCHIPELAGO_REGION_STRATEGIC_REF_ARRAY_FIELDS = Object.freeze([
        'macroRouteIds',
        'chokepointIds',
        'strategicRegionIds'
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

    function validateReferenceMembershipField(candidate, fieldName, collectionFieldName, contractId, errors) {
        if (
            !hasOwn(candidate, fieldName)
            || !hasOwn(candidate, collectionFieldName)
            || typeof candidate[fieldName] !== 'string'
            || !candidate[fieldName].trim()
            || !Array.isArray(candidate[collectionFieldName])
        ) {
            return;
        }

        if (!candidate[collectionFieldName].includes(candidate[fieldName].trim())) {
            pushError(
                contractId,
                errors,
                `"${fieldName}" must reference an entry present in "${collectionFieldName}".`
            );
        }
    }

    function normalizeGridPoint(value) {
        const normalizedValue = isPlainObject(value) ? value : {};
        const x = Number.isFinite(normalizedValue.x)
            ? Math.max(0, Math.floor(normalizedValue.x))
            : 0;
        const y = Number.isFinite(normalizedValue.y)
            ? Math.max(0, Math.floor(normalizedValue.y))
            : 0;

        return { x, y };
    }

    function validateGridPointField(candidate, fieldName, contractId, errors) {
        if (!hasOwn(candidate, fieldName)) {
            pushError(contractId, errors, `Missing required key "${fieldName}".`);
            return;
        }

        if (!isPlainObject(candidate[fieldName])) {
            pushError(contractId, errors, `"${fieldName}" must be an object.`);
            return;
        }

        ['x', 'y'].forEach((axis) => {
            if (!hasOwn(candidate[fieldName], axis)) {
                pushError(contractId, errors, `"${fieldName}.${axis}" is required.`);
                return;
            }

            const axisValue = candidate[fieldName][axis];
            if (!Number.isFinite(axisValue) || axisValue < 0 || Math.floor(axisValue) !== axisValue) {
                pushError(contractId, errors, `"${fieldName}.${axis}" must be a non-negative integer.`);
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
            plateIds: normalizeStringList(normalizedInput.plateIds),
            reliefRegionIds: normalizeStringList(normalizedInput.reliefRegionIds),
            climateBandIds: normalizeStringList(normalizedInput.climateBandIds),
            primaryReliefRegionId: normalizeString(normalizedInput.primaryReliefRegionId, ''),
            primaryClimateBandId: normalizeString(normalizedInput.primaryClimateBandId, '')
        };
    }

    function createPlateRecordSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            plateId: normalizeString(normalizedInput.plateId, ''),
            plateClass: normalizeString(normalizedInput.plateClass, ''),
            seedPoint: normalizeGridPoint(normalizedInput.seedPoint),
            upliftBias: clampUnitInterval(normalizedInput.upliftBias),
            fractureBias: clampUnitInterval(normalizedInput.fractureBias),
            compressionBias: clampUnitInterval(normalizedInput.compressionBias),
            driftBias: clampUnitInterval(normalizedInput.driftBias),
            arcFormationBias: clampUnitInterval(normalizedInput.arcFormationBias)
        };
    }

    function createSeaRegionRecordSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            seaRegionId: normalizeString(normalizedInput.seaRegionId, ''),
            basinType: normalizeString(normalizedInput.basinType, ''),
            stormPressure: clampUnitInterval(normalizedInput.stormPressure),
            navigability: clampUnitInterval(normalizedInput.navigability),
            climateBandIds: normalizeStringList(normalizedInput.climateBandIds),
            primaryClimateBandId: normalizeString(normalizedInput.primaryClimateBandId, '')
        };
    }

    function createArchipelagoRegionRecordSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            archipelagoId: normalizeString(normalizedInput.archipelagoId, ''),
            morphologyType: normalizeString(normalizedInput.morphologyType, ''),
            roleProfile: normalizeString(normalizedInput.roleProfile, ''),
            seaRegionIds: normalizeStringList(normalizedInput.seaRegionIds),
            climateBandIds: normalizeStringList(normalizedInput.climateBandIds),
            primarySeaRegionId: normalizeString(normalizedInput.primarySeaRegionId, ''),
            primaryClimateBandId: normalizeString(normalizedInput.primaryClimateBandId, ''),
            macroRouteIds: normalizeStringList(normalizedInput.macroRouteIds),
            chokepointIds: normalizeStringList(normalizedInput.chokepointIds),
            strategicRegionIds: normalizeStringList(normalizedInput.strategicRegionIds),
            connectiveValue: clampUnitInterval(normalizedInput.connectiveValue),
            fragility: clampUnitInterval(normalizedInput.fragility),
            colonizationAppeal: clampUnitInterval(normalizedInput.colonizationAppeal),
            longTermSustainability: clampUnitInterval(normalizedInput.longTermSustainability),
            historicalVolatility: clampUnitInterval(normalizedInput.historicalVolatility)
        };
    }

    function createMountainSystemRecordSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            mountainSystemId: normalizeString(normalizedInput.mountainSystemId, ''),
            systemType: normalizeString(normalizedInput.systemType, ''),
            plateIds: normalizeStringList(normalizedInput.plateIds),
            reliefRegionIds: normalizeStringList(normalizedInput.reliefRegionIds),
            primaryReliefRegionId: normalizeString(normalizedInput.primaryReliefRegionId, ''),
            spineOrientation: normalizeString(normalizedInput.spineOrientation, ''),
            upliftBias: clampUnitInterval(normalizedInput.upliftBias),
            ridgeContinuity: clampUnitInterval(normalizedInput.ridgeContinuity)
        };
    }

    function createVolcanicZoneRecordSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            volcanicZoneId: normalizeString(normalizedInput.volcanicZoneId, ''),
            sourceType: normalizeString(normalizedInput.sourceType, ''),
            plateIds: normalizeStringList(normalizedInput.plateIds),
            reliefRegionIds: normalizeStringList(normalizedInput.reliefRegionIds),
            mountainSystemIds: normalizeStringList(normalizedInput.mountainSystemIds),
            primaryReliefRegionId: normalizeString(normalizedInput.primaryReliefRegionId, ''),
            activityBias: clampUnitInterval(normalizedInput.activityBias),
            zoneContinuity: clampUnitInterval(normalizedInput.zoneContinuity)
        };
    }

    function createRiverBasinRecordSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            riverBasinId: normalizeString(normalizedInput.riverBasinId, ''),
            basinType: normalizeString(normalizedInput.basinType, ''),
            sourceMountainSystemIds: normalizeStringList(normalizedInput.sourceMountainSystemIds),
            reliefRegionIds: normalizeStringList(normalizedInput.reliefRegionIds),
            climateBandIds: normalizeStringList(normalizedInput.climateBandIds),
            terminalSeaRegionIds: normalizeStringList(normalizedInput.terminalSeaRegionIds),
            primaryReliefRegionId: normalizeString(normalizedInput.primaryReliefRegionId, ''),
            primaryClimateBandId: normalizeString(normalizedInput.primaryClimateBandId, ''),
            catchmentScale: clampUnitInterval(normalizedInput.catchmentScale),
            basinContinuity: clampUnitInterval(normalizedInput.basinContinuity)
        };
    }

    function createClimateBandRecordSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            climateBandId: normalizeString(normalizedInput.climateBandId, ''),
            bandType: normalizeString(normalizedInput.bandType, ''),
            reliefRegionIds: normalizeStringList(normalizedInput.reliefRegionIds),
            seaRegionIds: normalizeStringList(normalizedInput.seaRegionIds),
            primaryReliefRegionId: normalizeString(normalizedInput.primaryReliefRegionId, ''),
            temperatureBias: clampUnitInterval(normalizedInput.temperatureBias),
            humidityBias: clampUnitInterval(normalizedInput.humidityBias),
            seasonalityBias: clampUnitInterval(normalizedInput.seasonalityBias)
        };
    }

    function createReliefRegionRecordSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return {
            reliefRegionId: normalizeString(normalizedInput.reliefRegionId, ''),
            reliefType: normalizeString(normalizedInput.reliefType, ''),
            plateIds: normalizeStringList(normalizedInput.plateIds),
            continentIds: normalizeStringList(normalizedInput.continentIds),
            adjacentSeaRegionIds: normalizeStringList(normalizedInput.adjacentSeaRegionIds),
            primaryPlateId: normalizeString(normalizedInput.primaryPlateId, ''),
            elevationBias: clampUnitInterval(normalizedInput.elevationBias),
            ruggednessBias: clampUnitInterval(normalizedInput.ruggednessBias),
            coastalInfluence: clampUnitInterval(normalizedInput.coastalInfluence)
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
            'plateIds',
            'reliefRegionIds',
            'climateBandIds',
            'primaryReliefRegionId',
            'primaryClimateBandId'
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
            plateIds: {
                type: 'string[]',
                minLength: 1,
                description: 'References to physical `plates[]` records contributing to this continent.'
            },
            reliefRegionIds: {
                type: 'string[]',
                minLength: 1,
                description: 'References to physical `reliefRegions[]` records composing this continent.'
            },
            climateBandIds: {
                type: 'string[]',
                minLength: 1,
                description: 'References to physical `climateBands[]` records touching this continent.'
            },
            primaryReliefRegionId: {
                type: 'string',
                description: 'Primary relief-region reference used for continent-level physical summary.'
            },
            primaryClimateBandId: {
                type: 'string',
                description: 'Primary climate-band reference used for continent-level physical summary.'
            }
        }
    });

    const PLATE_RECORD_CONTRACT = deepFreeze({
        contractId: PLATE_RECORD_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'plateId',
            'plateClass',
            'seedPoint',
            'upliftBias',
            'fractureBias',
            'compressionBias',
            'driftBias',
            'arcFormationBias'
        ],
        fields: {
            plateId: {
                type: 'string',
                description: 'Stable tectonic-plate identifier such as plate_01.'
            },
            plateClass: {
                type: 'string',
                description: 'High-level plate class such as continental, oceanic, or mixed.'
            },
            seedPoint: {
                type: 'object',
                requiredKeys: ['x', 'y'],
                description: 'Deterministic root grid point for future plate seed distribution.'
            },
            upliftBias: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot aligned with PlatePressureField.uplift.'
            },
            fractureBias: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot aligned with PlatePressureField.fracture.'
            },
            compressionBias: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot aligned with PlatePressureField.compression.'
            },
            driftBias: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot aligned with PlatePressureField.driftBias; motion vectors remain a later step.'
            },
            arcFormationBias: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot aligned with PlatePressureField.arcFormation.'
            }
        }
    });

    const SEA_REGION_RECORD_CONTRACT = deepFreeze({
        contractId: SEA_REGION_RECORD_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'seaRegionId',
            'basinType',
            'stormPressure',
            'navigability',
            'climateBandIds',
            'primaryClimateBandId'
        ],
        fields: {
            seaRegionId: {
                type: 'string',
                description: 'Stable sea-region identifier such as sea_03.'
            },
            basinType: {
                type: 'string',
                description: 'Physical marine-basin descriptor such as open_ocean, inland_sea, gulf, or labyrinth_sea.'
            },
            stormPressure: {
                type: 'number',
                description: 'Climate-pressure summary for this sea region.',
                range: [0, 1]
            },
            navigability: {
                type: 'number',
                description: 'Preliminary physical navigability score before route-graph synthesis.',
                range: [0, 1]
            },
            climateBandIds: {
                type: 'string[]',
                minLength: 1,
                description: 'References to physical `climateBands[]` records influencing this sea region.'
            },
            primaryClimateBandId: {
                type: 'string',
                description: 'Primary climate-band reference used for sea-region physical summary.'
            }
        }
    });

    const MOUNTAIN_SYSTEM_RECORD_CONTRACT = deepFreeze({
        contractId: MOUNTAIN_SYSTEM_RECORD_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'mountainSystemId',
            'systemType',
            'plateIds',
            'reliefRegionIds',
            'primaryReliefRegionId',
            'spineOrientation',
            'upliftBias',
            'ridgeContinuity'
        ],
        fields: {
            mountainSystemId: {
                type: 'string',
                description: 'Stable mountain-system identifier such as mnt_01.'
            },
            systemType: {
                type: 'string',
                description: 'Physical mountain-system descriptor such as folded_range, highland_wall, broken_ridge, or volcanic_arc.'
            },
            plateIds: {
                type: 'string[]',
                minLength: 1,
                description: 'References to physical `plates[]` records associated with this mountain system.'
            },
            reliefRegionIds: {
                type: 'string[]',
                minLength: 1,
                description: 'References to physical `reliefRegions[]` records spanned by this mountain system.'
            },
            primaryReliefRegionId: {
                type: 'string',
                description: 'Primary relief-region reference used for mountain-system physical summary.'
            },
            spineOrientation: {
                type: 'string',
                description: 'High-level ridge-spine orientation descriptor such as north_south or northwest_southeast.'
            },
            upliftBias: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot aligned with uplift-driven mountain prominence.'
            },
            ridgeContinuity: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot aligned with ridge-line coherence before chain extraction.'
            }
        }
    });

    const VOLCANIC_ZONE_RECORD_CONTRACT = deepFreeze({
        contractId: VOLCANIC_ZONE_RECORD_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'volcanicZoneId',
            'sourceType',
            'plateIds',
            'reliefRegionIds',
            'mountainSystemIds',
            'primaryReliefRegionId',
            'activityBias',
            'zoneContinuity'
        ],
        fields: {
            volcanicZoneId: {
                type: 'string',
                description: 'Stable volcanic-zone identifier such as volc_01.'
            },
            sourceType: {
                type: 'string',
                description: 'Volcanic source classification such as arc, hotspot, or fissure.'
            },
            plateIds: {
                type: 'string[]',
                minLength: 1,
                description: 'References to physical `plates[]` records associated with this volcanic zone.'
            },
            reliefRegionIds: {
                type: 'string[]',
                minLength: 1,
                description: 'References to physical `reliefRegions[]` records intersected by this volcanic zone.'
            },
            mountainSystemIds: {
                type: 'string[]',
                minLength: 0,
                description: 'References to linked `mountainSystems[]` records when the volcanic zone is ridge- or arc-coupled.'
            },
            primaryReliefRegionId: {
                type: 'string',
                description: 'Primary relief-region reference used for volcanic-zone physical summary.'
            },
            activityBias: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for relative volcanic activity/intensity without simulating eruptions.'
            },
            zoneContinuity: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for how continuous the volcanic belt/cluster is across the world grid.'
            }
        }
    });

    const RIVER_BASIN_RECORD_CONTRACT = deepFreeze({
        contractId: RIVER_BASIN_RECORD_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'riverBasinId',
            'basinType',
            'sourceMountainSystemIds',
            'reliefRegionIds',
            'climateBandIds',
            'terminalSeaRegionIds',
            'primaryReliefRegionId',
            'primaryClimateBandId',
            'catchmentScale',
            'basinContinuity'
        ],
        fields: {
            riverBasinId: {
                type: 'string',
                description: 'Stable river-basin identifier such as basin_01.'
            },
            basinType: {
                type: 'string',
                description: 'Physical basin descriptor such as exorheic, endorheic, deltaic, or inland_sea_feeder.'
            },
            sourceMountainSystemIds: {
                type: 'string[]',
                minLength: 0,
                description: 'References to upstream `mountainSystems[]` when the basin is mountain-fed.'
            },
            reliefRegionIds: {
                type: 'string[]',
                minLength: 1,
                description: 'References to physical `reliefRegions[]` crossed by the river basin.'
            },
            climateBandIds: {
                type: 'string[]',
                minLength: 0,
                description: 'References to physical `climateBands[]` influencing this basin when climate linkage has been materialized.'
            },
            terminalSeaRegionIds: {
                type: 'string[]',
                minLength: 0,
                description: 'References to terminal `seaRegions[]` when the basin drains into a sea, gulf, or inland sea.'
            },
            primaryReliefRegionId: {
                type: 'string',
                description: 'Primary relief-region reference used for river-basin physical summary.'
            },
            primaryClimateBandId: {
                type: 'string',
                description: 'Primary climate-band reference used for river-basin physical summary when climate linkage has been materialized.'
            },
            catchmentScale: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for relative basin catchment scale without river-routing simulation.'
            },
            basinContinuity: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for how continuous and coherent the basin is across connected regions.'
            }
        }
    });

    const CLIMATE_BAND_RECORD_CONTRACT = deepFreeze({
        contractId: CLIMATE_BAND_RECORD_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'climateBandId',
            'bandType',
            'reliefRegionIds',
            'seaRegionIds',
            'primaryReliefRegionId',
            'temperatureBias',
            'humidityBias',
            'seasonalityBias'
        ],
        fields: {
            climateBandId: {
                type: 'string',
                description: 'Stable climate-band identifier such as climate_03.'
            },
            bandType: {
                type: 'string',
                description: 'Physical climate-band descriptor such as humid_temperate, dry_subtropical, or cold_maritime.'
            },
            reliefRegionIds: {
                type: 'string[]',
                minLength: 1,
                description: 'References to physical `reliefRegions[]` records anchored inside this climate band.'
            },
            seaRegionIds: {
                type: 'string[]',
                minLength: 0,
                description: 'Optional references to adjacent or embedded `seaRegions[]` records shaping maritime moderation for this climate band.'
            },
            primaryReliefRegionId: {
                type: 'string',
                description: 'Primary relief-region reference used for climate-band physical summary.'
            },
            temperatureBias: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for normalized thermal intensity without simulating climate.'
            },
            humidityBias: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for normalized moisture load without simulating precipitation.'
            },
            seasonalityBias: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for normalized annual variability without encoding gameplay weather rules.'
            }
        }
    });

    const RELIEF_REGION_RECORD_CONTRACT = deepFreeze({
        contractId: RELIEF_REGION_RECORD_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'reliefRegionId',
            'reliefType',
            'plateIds',
            'continentIds',
            'adjacentSeaRegionIds',
            'primaryPlateId',
            'elevationBias',
            'ruggednessBias',
            'coastalInfluence'
        ],
        fields: {
            reliefRegionId: {
                type: 'string',
                description: 'Stable relief-region identifier such as relief_07.'
            },
            reliefType: {
                type: 'string',
                description: 'Large-scale relief class such as mountain, plateau, plain, basin, coast, upland, or escarpment.'
            },
            plateIds: {
                type: 'string[]',
                minLength: 1,
                description: 'References to physical `plates[]` records underlying this relief region.'
            },
            continentIds: {
                type: 'string[]',
                minLength: 0,
                description: 'Optional references to physical `continents[]` records overlapped by this relief region.'
            },
            adjacentSeaRegionIds: {
                type: 'string[]',
                minLength: 0,
                description: 'Optional references to nearby `seaRegions[]` records when this relief region is coastal or sea-facing.'
            },
            primaryPlateId: {
                type: 'string',
                description: 'Primary plate reference used for relief-region physical summary.'
            },
            elevationBias: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for normalized large-scale elevation prominence without extracting actual terrain cells.'
            },
            ruggednessBias: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for normalized terrain roughness at the macro relief level.'
            },
            coastalInfluence: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for how strongly coast-facing shaping affects this relief region.'
            }
        }
    });

    const ARCHIPELAGO_REGION_RECORD_CONTRACT = deepFreeze({
        contractId: ARCHIPELAGO_REGION_RECORD_CONTRACT_ID,
        version: PHASE_VERSION,
        deterministic: true,
        requiredKeys: [
            'archipelagoId',
            'morphologyType',
            'roleProfile',
            'seaRegionIds',
            'climateBandIds',
            'primarySeaRegionId',
            'primaryClimateBandId',
            'macroRouteIds',
            'chokepointIds',
            'strategicRegionIds',
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
            morphologyType: {
                type: 'string',
                description: 'Physical morphology descriptor such as chain, broken_chain, clustered_arc, or fragmented_bridge.'
            },
            roleProfile: {
                type: 'string',
                description: 'Historical role seed for downstream history and politics generators.'
            },
            seaRegionIds: {
                type: 'string[]',
                minLength: 1,
                description: 'References to physical `seaRegions[]` records enclosing or shaping this archipelago macrozone.'
            },
            climateBandIds: {
                type: 'string[]',
                minLength: 1,
                description: 'References to physical `climateBands[]` records influencing this archipelago macrozone.'
            },
            primarySeaRegionId: {
                type: 'string',
                description: 'Primary sea-region reference used for archipelago physical summary.'
            },
            primaryClimateBandId: {
                type: 'string',
                description: 'Primary climate-band reference used for archipelago physical summary.'
            },
            macroRouteIds: {
                type: 'string[]',
                minLength: 0,
                description: 'Strategic-significance references to `macroRoutes[]` that pass through or depend on this archipelago.'
            },
            chokepointIds: {
                type: 'string[]',
                minLength: 0,
                description: 'Strategic-significance references to `chokepoints[]` structurally coupled to this archipelago.'
            },
            strategicRegionIds: {
                type: 'string[]',
                minLength: 0,
                description: 'Strategic-significance references to downstream `strategicRegions[]` touching this archipelago.'
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
        physicalMorphologyRefs: [
            'morphologyType',
            'seaRegionIds',
            'climateBandIds',
            'primarySeaRegionId',
            'primaryClimateBandId'
        ],
        strategicSignificanceRefs: [
            'macroRouteIds',
            'chokepointIds',
            'strategicRegionIds',
            'roleProfile',
            'connectiveValue',
            'fragility',
            'colonizationAppeal',
            'longTermSustainability',
            'historicalVolatility'
        ],
        downstreamConsumers: [
            'historicalGeneration',
            'archipelagoRoleGenerator'
        ],
        historicalGenerationBridge: {
            phaseId: 'historicalGeneration',
            requiredFields: [
                'morphologyType',
                'roleProfile',
                'seaRegionIds',
                'climateBandIds',
                'primarySeaRegionId',
                'primaryClimateBandId',
                'macroRouteIds',
                'chokepointIds',
                'strategicRegionIds',
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
                range: [0, 1],
                description: 'Contract slot for how strongly control of this chokepoint can shape macro access and denial.'
            },
            tradeDependency: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for how much major route structure depends on this chokepoint remaining open.'
            },
            bypassDifficulty: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for how hard it is to route around this chokepoint without major macro detours.'
            },
            collapseSensitivity: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for how much systemic disruption follows if this chokepoint becomes unusable.'
            },
            adjacentRegions: {
                type: 'array',
                items: 'string',
                minLength: 1,
                description: 'Region ids touched or constrained by this chokepoint.'
            }
        },
        downstreamConsumers: [
            'chokepointAnalyzer'
        ],
        chokepointAnalysisBridge: {
            analyzerId: 'chokepointAnalyzer',
            requiredFields: [
                'type',
                'controlValue',
                'tradeDependency',
                'bypassDifficulty',
                'collapseSensitivity',
                'adjacentRegions'
            ]
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
                range: [0, 1],
                description: 'Contract slot for normalized traversal cost across the macro corridor without constructing actual routes.'
            },
            fragility: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for how easily this corridor degrades under loss of segments or chokepoints.'
            },
            redundancy: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for how many viable macro alternatives exist around this corridor.'
            },
            historicalImportance: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for downstream historical weighting once route analysis is available.'
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
                description: 'Normalized strategic value composition across food, routes, defense, and coast factors.'
            },
            stabilityScore: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for how structurally stable this strategic region is before historical simulation.'
            },
            expansionPressure: {
                type: 'number',
                range: [0, 1],
                description: 'Contract slot for how strongly this region pushes toward outward consolidation, rivalry, or frontier pressure.'
            }
        },
        downstreamHandoffSections: [
            'summaryForHistoryPhase',
            'strategicHintsForPolitics'
        ],
        strategicHandoffBridge: {
            handoffPackage: 'MacroGeographyHandoffPackage',
            targetSections: [
                'summaryForHistoryPhase',
                'strategicHintsForPolitics'
            ],
            requiredFields: [
                'type',
                'valueMix',
                'stabilityScore',
                'expansionPressure'
            ]
        }
    });

    function getContinentRecordContract() {
        return cloneValue(CONTINENT_RECORD_CONTRACT);
    }

    function getPlateRecordContract() {
        return cloneValue(PLATE_RECORD_CONTRACT);
    }

    function getSeaRegionRecordContract() {
        return cloneValue(SEA_REGION_RECORD_CONTRACT);
    }

    function getMountainSystemRecordContract() {
        return cloneValue(MOUNTAIN_SYSTEM_RECORD_CONTRACT);
    }

    function getVolcanicZoneRecordContract() {
        return cloneValue(VOLCANIC_ZONE_RECORD_CONTRACT);
    }

    function getRiverBasinRecordContract() {
        return cloneValue(RIVER_BASIN_RECORD_CONTRACT);
    }

    function getClimateBandRecordContract() {
        return cloneValue(CLIMATE_BAND_RECORD_CONTRACT);
    }

    function getReliefRegionRecordContract() {
        return cloneValue(RELIEF_REGION_RECORD_CONTRACT);
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
            plateRecord: getPlateRecordContract(),
            continentRecord: getContinentRecordContract(),
            seaRegionRecord: getSeaRegionRecordContract(),
            mountainSystemRecord: getMountainSystemRecordContract(),
            volcanicZoneRecord: getVolcanicZoneRecordContract(),
            riverBasinRecord: getRiverBasinRecordContract(),
            climateBandRecord: getClimateBandRecordContract(),
            reliefRegionRecord: getReliefRegionRecordContract(),
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
            plateRecord: {
                contract: 'getPlateRecordContract',
                skeletonFactory: 'createPlateRecordSkeleton',
                validate: 'validatePlateRecord',
                assert: 'assertPlateRecord'
            },
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
            mountainSystemRecord: {
                contract: 'getMountainSystemRecordContract',
                skeletonFactory: 'createMountainSystemRecordSkeleton',
                validate: 'validateMountainSystemRecord',
                assert: 'assertMountainSystemRecord'
            },
            volcanicZoneRecord: {
                contract: 'getVolcanicZoneRecordContract',
                skeletonFactory: 'createVolcanicZoneRecordSkeleton',
                validate: 'validateVolcanicZoneRecord',
                assert: 'assertVolcanicZoneRecord'
            },
            riverBasinRecord: {
                contract: 'getRiverBasinRecordContract',
                skeletonFactory: 'createRiverBasinRecordSkeleton',
                validate: 'validateRiverBasinRecord',
                assert: 'assertRiverBasinRecord'
            },
            climateBandRecord: {
                contract: 'getClimateBandRecordContract',
                skeletonFactory: 'createClimateBandRecordSkeleton',
                validate: 'validateClimateBandRecord',
                assert: 'assertClimateBandRecord'
            },
            reliefRegionRecord: {
                contract: 'getReliefRegionRecordContract',
                skeletonFactory: 'createReliefRegionRecordSkeleton',
                validate: 'validateReliefRegionRecord',
                assert: 'assertReliefRegionRecord'
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

    function validatePlateRecord(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(PLATE_RECORD_CONTRACT_ID, errors, 'Record must be a plain object.');
            return {
                contractId: PLATE_RECORD_CONTRACT_ID,
                contractVersion: PLATE_RECORD_CONTRACT.version,
                isValid: false,
                errors
            };
        }

        validateRequiredStringFields(candidate, PLATE_STRING_FIELDS, PLATE_RECORD_CONTRACT_ID, errors);
        validateGridPointField(candidate, 'seedPoint', PLATE_RECORD_CONTRACT_ID, errors);
        validateUnitIntervalFields(candidate, PLATE_UNIT_INTERVAL_FIELDS, PLATE_RECORD_CONTRACT_ID, errors);

        return {
            contractId: PLATE_RECORD_CONTRACT_ID,
            contractVersion: PLATE_RECORD_CONTRACT.version,
            isValid: errors.length === 0,
            errors
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
        CONTINENT_STRING_ARRAY_FIELDS.forEach((fieldName) => {
            validateStringArrayField(candidate, fieldName, CONTINENT_RECORD_CONTRACT_ID, errors, 1);
        });
        validateReferenceMembershipField(candidate, 'primaryReliefRegionId', 'reliefRegionIds', CONTINENT_RECORD_CONTRACT_ID, errors);
        validateReferenceMembershipField(candidate, 'primaryClimateBandId', 'climateBandIds', CONTINENT_RECORD_CONTRACT_ID, errors);

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
        SEA_REGION_STRING_ARRAY_FIELDS.forEach((fieldName) => {
            validateStringArrayField(candidate, fieldName, SEA_REGION_RECORD_CONTRACT_ID, errors, 1);
        });
        validateReferenceMembershipField(candidate, 'primaryClimateBandId', 'climateBandIds', SEA_REGION_RECORD_CONTRACT_ID, errors);

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
        ARCHIPELAGO_REGION_PHYSICAL_REF_ARRAY_FIELDS.forEach((fieldName) => {
            validateStringArrayField(candidate, fieldName, ARCHIPELAGO_REGION_RECORD_CONTRACT_ID, errors, 1);
        });
        ARCHIPELAGO_REGION_STRATEGIC_REF_ARRAY_FIELDS.forEach((fieldName) => {
            validateStringArrayField(candidate, fieldName, ARCHIPELAGO_REGION_RECORD_CONTRACT_ID, errors, 0);
        });
        validateReferenceMembershipField(candidate, 'primarySeaRegionId', 'seaRegionIds', ARCHIPELAGO_REGION_RECORD_CONTRACT_ID, errors);
        validateReferenceMembershipField(candidate, 'primaryClimateBandId', 'climateBandIds', ARCHIPELAGO_REGION_RECORD_CONTRACT_ID, errors);

        return {
            contractId: ARCHIPELAGO_REGION_RECORD_CONTRACT_ID,
            contractVersion: ARCHIPELAGO_REGION_RECORD_CONTRACT.version,
            isValid: errors.length === 0,
            errors
        };
    }

    function validateMountainSystemRecord(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(MOUNTAIN_SYSTEM_RECORD_CONTRACT_ID, errors, 'Record must be a plain object.');
            return {
                contractId: MOUNTAIN_SYSTEM_RECORD_CONTRACT_ID,
                contractVersion: MOUNTAIN_SYSTEM_RECORD_CONTRACT.version,
                isValid: false,
                errors
            };
        }

        validateRequiredStringFields(candidate, MOUNTAIN_SYSTEM_STRING_FIELDS, MOUNTAIN_SYSTEM_RECORD_CONTRACT_ID, errors);
        MOUNTAIN_SYSTEM_STRING_ARRAY_FIELDS.forEach((fieldName) => {
            validateStringArrayField(candidate, fieldName, MOUNTAIN_SYSTEM_RECORD_CONTRACT_ID, errors, 1);
        });
        validateUnitIntervalFields(candidate, MOUNTAIN_SYSTEM_UNIT_INTERVAL_FIELDS, MOUNTAIN_SYSTEM_RECORD_CONTRACT_ID, errors);
        validateReferenceMembershipField(candidate, 'primaryReliefRegionId', 'reliefRegionIds', MOUNTAIN_SYSTEM_RECORD_CONTRACT_ID, errors);

        return {
            contractId: MOUNTAIN_SYSTEM_RECORD_CONTRACT_ID,
            contractVersion: MOUNTAIN_SYSTEM_RECORD_CONTRACT.version,
            isValid: errors.length === 0,
            errors
        };
    }

    function validateVolcanicZoneRecord(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(VOLCANIC_ZONE_RECORD_CONTRACT_ID, errors, 'Record must be a plain object.');
            return {
                contractId: VOLCANIC_ZONE_RECORD_CONTRACT_ID,
                contractVersion: VOLCANIC_ZONE_RECORD_CONTRACT.version,
                isValid: false,
                errors
            };
        }

        validateRequiredStringFields(candidate, VOLCANIC_ZONE_STRING_FIELDS, VOLCANIC_ZONE_RECORD_CONTRACT_ID, errors);
        validateStringArrayField(candidate, 'plateIds', VOLCANIC_ZONE_RECORD_CONTRACT_ID, errors, 1);
        validateStringArrayField(candidate, 'reliefRegionIds', VOLCANIC_ZONE_RECORD_CONTRACT_ID, errors, 1);
        validateStringArrayField(candidate, 'mountainSystemIds', VOLCANIC_ZONE_RECORD_CONTRACT_ID, errors, 0);
        validateUnitIntervalFields(candidate, VOLCANIC_ZONE_UNIT_INTERVAL_FIELDS, VOLCANIC_ZONE_RECORD_CONTRACT_ID, errors);
        validateReferenceMembershipField(candidate, 'primaryReliefRegionId', 'reliefRegionIds', VOLCANIC_ZONE_RECORD_CONTRACT_ID, errors);

        return {
            contractId: VOLCANIC_ZONE_RECORD_CONTRACT_ID,
            contractVersion: VOLCANIC_ZONE_RECORD_CONTRACT.version,
            isValid: errors.length === 0,
            errors
        };
    }

    function validateRiverBasinRecord(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(RIVER_BASIN_RECORD_CONTRACT_ID, errors, 'Record must be a plain object.');
            return {
                contractId: RIVER_BASIN_RECORD_CONTRACT_ID,
                contractVersion: RIVER_BASIN_RECORD_CONTRACT.version,
                isValid: false,
                errors
            };
        }

        validateRequiredStringFields(candidate, RIVER_BASIN_STRING_FIELDS, RIVER_BASIN_RECORD_CONTRACT_ID, errors);
        if (!hasOwn(candidate, 'primaryClimateBandId')) {
            pushError(RIVER_BASIN_RECORD_CONTRACT_ID, errors, 'Missing required key "primaryClimateBandId".');
        } else if (typeof candidate.primaryClimateBandId !== 'string') {
            pushError(RIVER_BASIN_RECORD_CONTRACT_ID, errors, '"primaryClimateBandId" must be a string.');
        }
        RIVER_BASIN_REQUIRED_STRING_ARRAY_FIELDS.forEach((fieldName) => {
            validateStringArrayField(candidate, fieldName, RIVER_BASIN_RECORD_CONTRACT_ID, errors, 1);
        });
        RIVER_BASIN_OPTIONAL_STRING_ARRAY_FIELDS.forEach((fieldName) => {
            validateStringArrayField(candidate, fieldName, RIVER_BASIN_RECORD_CONTRACT_ID, errors, 0);
        });
        validateUnitIntervalFields(candidate, RIVER_BASIN_UNIT_INTERVAL_FIELDS, RIVER_BASIN_RECORD_CONTRACT_ID, errors);
        validateReferenceMembershipField(candidate, 'primaryReliefRegionId', 'reliefRegionIds', RIVER_BASIN_RECORD_CONTRACT_ID, errors);
        validateReferenceMembershipField(candidate, 'primaryClimateBandId', 'climateBandIds', RIVER_BASIN_RECORD_CONTRACT_ID, errors);

        return {
            contractId: RIVER_BASIN_RECORD_CONTRACT_ID,
            contractVersion: RIVER_BASIN_RECORD_CONTRACT.version,
            isValid: errors.length === 0,
            errors
        };
    }

    function validateClimateBandRecord(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(CLIMATE_BAND_RECORD_CONTRACT_ID, errors, 'Record must be a plain object.');
            return {
                contractId: CLIMATE_BAND_RECORD_CONTRACT_ID,
                contractVersion: CLIMATE_BAND_RECORD_CONTRACT.version,
                isValid: false,
                errors
            };
        }

        validateRequiredStringFields(candidate, CLIMATE_BAND_STRING_FIELDS, CLIMATE_BAND_RECORD_CONTRACT_ID, errors);
        CLIMATE_BAND_REQUIRED_STRING_ARRAY_FIELDS.forEach((fieldName) => {
            validateStringArrayField(candidate, fieldName, CLIMATE_BAND_RECORD_CONTRACT_ID, errors, 1);
        });
        CLIMATE_BAND_OPTIONAL_STRING_ARRAY_FIELDS.forEach((fieldName) => {
            validateStringArrayField(candidate, fieldName, CLIMATE_BAND_RECORD_CONTRACT_ID, errors, 0);
        });
        validateUnitIntervalFields(candidate, CLIMATE_BAND_UNIT_INTERVAL_FIELDS, CLIMATE_BAND_RECORD_CONTRACT_ID, errors);
        validateReferenceMembershipField(candidate, 'primaryReliefRegionId', 'reliefRegionIds', CLIMATE_BAND_RECORD_CONTRACT_ID, errors);

        return {
            contractId: CLIMATE_BAND_RECORD_CONTRACT_ID,
            contractVersion: CLIMATE_BAND_RECORD_CONTRACT.version,
            isValid: errors.length === 0,
            errors
        };
    }

    function validateReliefRegionRecord(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(RELIEF_REGION_RECORD_CONTRACT_ID, errors, 'Record must be a plain object.');
            return {
                contractId: RELIEF_REGION_RECORD_CONTRACT_ID,
                contractVersion: RELIEF_REGION_RECORD_CONTRACT.version,
                isValid: false,
                errors
            };
        }

        validateRequiredStringFields(candidate, RELIEF_REGION_STRING_FIELDS, RELIEF_REGION_RECORD_CONTRACT_ID, errors);
        RELIEF_REGION_REQUIRED_STRING_ARRAY_FIELDS.forEach((fieldName) => {
            validateStringArrayField(candidate, fieldName, RELIEF_REGION_RECORD_CONTRACT_ID, errors, 1);
        });
        RELIEF_REGION_OPTIONAL_STRING_ARRAY_FIELDS.forEach((fieldName) => {
            validateStringArrayField(candidate, fieldName, RELIEF_REGION_RECORD_CONTRACT_ID, errors, 0);
        });
        validateUnitIntervalFields(candidate, RELIEF_REGION_UNIT_INTERVAL_FIELDS, RELIEF_REGION_RECORD_CONTRACT_ID, errors);
        validateReferenceMembershipField(candidate, 'primaryPlateId', 'plateIds', RELIEF_REGION_RECORD_CONTRACT_ID, errors);

        return {
            contractId: RELIEF_REGION_RECORD_CONTRACT_ID,
            contractVersion: RELIEF_REGION_RECORD_CONTRACT.version,
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

    function assertPlateRecord(candidate) {
        const validationResult = validatePlateRecord(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'PLATE_RECORD_INVALID';
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

    function assertMountainSystemRecord(candidate) {
        const validationResult = validateMountainSystemRecord(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'MOUNTAIN_SYSTEM_RECORD_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    function assertVolcanicZoneRecord(candidate) {
        const validationResult = validateVolcanicZoneRecord(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'VOLCANIC_ZONE_RECORD_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    function assertRiverBasinRecord(candidate) {
        const validationResult = validateRiverBasinRecord(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'RIVER_BASIN_RECORD_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    function assertClimateBandRecord(candidate) {
        const validationResult = validateClimateBandRecord(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'CLIMATE_BAND_RECORD_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    function assertReliefRegionRecord(candidate) {
        const validationResult = validateReliefRegionRecord(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'RELIEF_REGION_RECORD_INVALID';
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
            description: 'Region-level contract module with PlateRecord, ContinentRecord, SeaRegionRecord, MountainSystemRecord, VolcanicZoneRecord, RiverBasinRecord, ClimateBandRecord, ReliefRegionRecord, ArchipelagoRegionRecord, ChokepointRecord, MacroRouteRecord, and StrategicRegionRecord implemented; remaining region records are TODO CONTRACTED.',
            stub: false
        });
    }

    Object.assign(macro, {
        getPlateRecordContract,
        getContinentRecordContract,
        getSeaRegionRecordContract,
        getMountainSystemRecordContract,
        getVolcanicZoneRecordContract,
        getRiverBasinRecordContract,
        getClimateBandRecordContract,
        getReliefRegionRecordContract,
        getArchipelagoRegionRecordContract,
        getChokepointRecordContract,
        getMacroRouteRecordContract,
        getStrategicRegionRecordContract,
        getRegionContractRegistry,
        getRegionRecordEntryPoints,
        createPlateRecordSkeleton,
        createContinentRecordSkeleton,
        createSeaRegionRecordSkeleton,
        createMountainSystemRecordSkeleton,
        createVolcanicZoneRecordSkeleton,
        createRiverBasinRecordSkeleton,
        createClimateBandRecordSkeleton,
        createReliefRegionRecordSkeleton,
        createArchipelagoRegionRecordSkeleton,
        createChokepointRecordSkeleton,
        createMacroRouteRecordSkeleton,
        createStrategicRegionRecordSkeleton,
        validatePlateRecord,
        validateContinentRecord,
        validateSeaRegionRecord,
        validateMountainSystemRecord,
        validateVolcanicZoneRecord,
        validateRiverBasinRecord,
        validateClimateBandRecord,
        validateReliefRegionRecord,
        validateArchipelagoRegionRecord,
        validateChokepointRecord,
        validateMacroRouteRecord,
        validateStrategicRegionRecord,
        assertPlateRecord,
        assertContinentRecord,
        assertSeaRegionRecord,
        assertMountainSystemRecord,
        assertVolcanicZoneRecord,
        assertRiverBasinRecord,
        assertClimateBandRecord,
        assertReliefRegionRecord,
        assertArchipelagoRegionRecord,
        assertChokepointRecord,
        assertMacroRouteRecord,
        assertStrategicRegionRecord
    });
})();
