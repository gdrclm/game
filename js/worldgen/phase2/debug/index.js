(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const macro = game.systems.worldgenMacro || {};
    const GROUP_ID = 'debug';
    const PHASE_ID = 'PHASE_2';
    const DEBUG_SNAPSHOT_SCAFFOLD_ID = 'Phase2DebugSnapshotScaffold';
    const DEBUG_SNAPSHOT_SCAFFOLD_VERSION = 'phase2-debug-snapshot-scaffold-v1';
    const SNAPSHOT_TYPE_FIELD = 'fieldSnapshot';
    const SNAPSHOT_TYPE_RECORD_PROFILE = 'recordProfileSnapshot';
    const SNAPSHOT_TYPE_RECORD_PROFILE_COLLECTION = 'recordProfileCollectionSnapshot';
    const DEFAULT_FIELD_STAGE_ID = 'phase2FieldDebugSnapshot';
    const DEFAULT_PROFILE_STAGE_ID = 'phase2ProfileDebugSnapshot';
    const DEFAULT_COLLECTION_STAGE_ID = 'phase2ProfileCollectionDebugSnapshot';
    const DEFAULT_SUMMARY_BY_TYPE = Object.freeze({
        [SNAPSHOT_TYPE_FIELD]: 'UI-free Phase 2 field snapshot.',
        [SNAPSHOT_TYPE_RECORD_PROFILE]: 'UI-free Phase 2 record-bound profile snapshot.',
        [SNAPSHOT_TYPE_RECORD_PROFILE_COLLECTION]: 'UI-free Phase 2 record-bound profile collection snapshot.'
    });
    const SNAPSHOT_FAMILIES = Object.freeze([
        'pressure',
        'rhythm',
        'recordBound'
    ]);
    const SNAPSHOT_NAMING_RULES = Object.freeze({
        fieldPattern: '<snapshotFamily>_<domainId>_<fieldId>',
        recordProfilePattern: 'profile_<recordType>_<recordId>',
        recordProfileCollectionPattern: 'profiles_<collectionId>',
        examples: Object.freeze([
            'pressure_climate_coldPressure',
            'pressure_travel_travelExposure',
            'rhythm_recovery_recoveryTempo',
            'profile_reliefRegions_relief_001',
            'profiles_pressureRegionalProfiles'
        ]),
        supportOnly: true,
        canonicalGameplayTruth: false,
        stable: true,
        explicit: true,
        contractAware: true
    });
    const STUB = Object.freeze({
        groupId: GROUP_ID,
        status: 'partial_implemented_contract_first',
        canonicalPath: 'js/worldgen/phase2/debug/',
        uiCoupling: false,
        implementsFieldLogic: false,
        purpose: 'UI-free debug and snapshot entry point for Phase 2 inspection artifacts.'
    });

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

    function normalizeNumber(value, fallback = 0) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue)
            ? numericValue
            : fallback;
    }

    function normalizeInteger(value, fallback = 0) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue)
            ? Math.max(0, Math.trunc(numericValue))
            : fallback;
    }

    function normalizeRange(range = [0, 1], fallback = [0, 1]) {
        if (typeof macro.normalizeFieldRange === 'function') {
            return macro.normalizeFieldRange(range, fallback);
        }

        if (!Array.isArray(range) || range.length < 2) {
            return fallback.slice();
        }

        const min = Number(range[0]);
        const max = Number(range[1]);
        if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
            return fallback.slice();
        }

        return [min, max];
    }

    function normalizeStringList(value) {
        return Array.isArray(value)
            ? value
                .map((entry) => normalizeString(entry, ''))
                .filter(Boolean)
            : [];
    }

    function uniqueStrings(values = []) {
        return Array.from(new Set(normalizeStringList(values)));
    }

    function normalizeSnapshotToken(value, fallback = 'unknown') {
        const normalizedValue = normalizeString(value, '');
        if (!normalizedValue) {
            return fallback;
        }

        const token = normalizedValue
            .replace(/[^A-Za-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .replace(/_+/g, '_');

        return token || fallback;
    }

    function normalizeSnapshotFamily(value, fallback = 'recordBound') {
        const normalizedFamily = normalizeString(value, fallback);
        return SNAPSHOT_FAMILIES.includes(normalizedFamily)
            ? normalizedFamily
            : fallback;
    }

    function getPhase2DebugModuleStub() {
        return STUB;
    }

    function getPhase2SnapshotFamilies() {
        return SNAPSHOT_FAMILIES.slice();
    }

    function getPhase2SnapshotNamingRules() {
        return cloneValue(SNAPSHOT_NAMING_RULES);
    }

    function buildPhase2FieldSnapshotName(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const snapshotFamily = normalizeSnapshotFamily(normalizedInput.snapshotFamily, 'pressure');
        const domainId = normalizeSnapshotToken(
            normalizedInput.domainId,
            'generic'
        );
        const fieldId = normalizeSnapshotToken(
            normalizedInput.fieldId,
            'field'
        );

        return `${snapshotFamily}_${domainId}_${fieldId}`;
    }

    function buildPhase2RecordProfileSnapshotName(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const recordType = normalizeSnapshotToken(normalizedInput.recordType, 'record');
        const recordId = normalizeSnapshotToken(normalizedInput.recordId, 'unknownRecord');
        return `profile_${recordType}_${recordId}`;
    }

    function buildPhase2RecordProfileCollectionSnapshotName(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const collectionId = normalizeSnapshotToken(normalizedInput.collectionId, 'recordProfiles');
        return `profiles_${collectionId}`;
    }

    function buildPhase2SnapshotId(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const snapshotType = normalizeSnapshotToken(normalizedInput.snapshotType, 'snapshot');
        const snapshotName = normalizeSnapshotToken(normalizedInput.snapshotName, 'snapshot');
        const sourcePackageId = normalizeSnapshotToken(normalizedInput.sourcePackageId, 'unknownSourcePackage');

        return `phase2_${snapshotType}_${snapshotName}_${sourcePackageId}`;
    }

    function buildSnapshotNamespace(snapshotFamily) {
        const normalizedSnapshotFamily = normalizeSnapshotFamily(snapshotFamily, 'recordBound');
        const snapshotScope = normalizedSnapshotFamily === 'recordBound'
            ? 'recordBound'
            : normalizedSnapshotFamily;

        if (typeof phase2.buildPhase2SubSeedNamespace === 'function') {
            return phase2.buildPhase2SubSeedNamespace('snapshots', snapshotScope);
        }

        return `phase2.snapshots.${snapshotScope}`;
    }

    function normalizePhase2SeedContext(seedContext = {}, snapshotFamily = 'recordBound') {
        const normalizedSeedContext = isPlainObject(seedContext) ? seedContext : {};
        const snapshotNamespace = buildSnapshotNamespace(snapshotFamily);

        return deepFreeze({
            snapshotFamily: normalizeSnapshotFamily(snapshotFamily, 'recordBound'),
            snapshotNamespace,
            sourceKind: normalizeString(normalizedSeedContext.sourceKind, 'debugSnapshot'),
            purpose: normalizeString(normalizedSeedContext.purpose, 'snapshot'),
            seed: hasOwn(normalizedSeedContext, 'seed')
                ? normalizeNumber(normalizedSeedContext.seed, null)
                : null,
            baseSeed: hasOwn(normalizedSeedContext, 'baseSeed')
                ? normalizeNumber(normalizedSeedContext.baseSeed, null)
                : null,
            sourceNamespace: normalizeString(
                normalizedSeedContext.sourceNamespace,
                normalizeString(normalizedSeedContext.namespaceId, snapshotNamespace)
            ),
            derivedNamespace: normalizeString(
                normalizedSeedContext.derivedNamespace,
                snapshotNamespace
            ),
            notes: normalizeString(normalizedSeedContext.notes, '')
        });
    }

    function readFieldDescriptor(field) {
        if (field && typeof field.describe === 'function') {
            const descriptor = field.describe();
            if (isPlainObject(descriptor)) {
                return descriptor;
            }
        }

        return {};
    }

    function readFieldType(field) {
        const descriptor = readFieldDescriptor(field);
        return normalizeString(descriptor.type, normalizeString(field && field.type, ''));
    }

    function isFieldSnapshotArtifact(value) {
        return isPlainObject(value)
            && normalizeString(value.artifactKind, '') === 'fieldSnapshot'
            && isPlainObject(value.payload);
    }

    function buildValueStats(values = []) {
        const numericValues = Array.isArray(values)
            ? values.filter((value) => Number.isFinite(value))
            : [];

        if (!numericValues.length) {
            return {
                min: 0,
                max: 0,
                mean: 0
            };
        }

        const min = numericValues.reduce((currentMin, value) => Math.min(currentMin, value), numericValues[0]);
        const max = numericValues.reduce((currentMax, value) => Math.max(currentMax, value), numericValues[0]);
        const sum = numericValues.reduce((total, value) => total + value, 0);

        return {
            min,
            max,
            mean: sum / numericValues.length
        };
    }

    function buildVectorStats(xValues = [], yValues = []) {
        const count = Math.min(
            Array.isArray(xValues) ? xValues.length : 0,
            Array.isArray(yValues) ? yValues.length : 0
        );

        if (count <= 0) {
            return {
                nonZeroCount: 0,
                meanX: 0,
                meanY: 0,
                meanMagnitude: 0,
                maxMagnitude: 0
            };
        }

        let nonZeroCount = 0;
        let xTotal = 0;
        let yTotal = 0;
        let magnitudeTotal = 0;
        let maxMagnitude = 0;

        for (let index = 0; index < count; index += 1) {
            const x = normalizeNumber(xValues[index], 0);
            const y = normalizeNumber(yValues[index], 0);
            const magnitude = Math.hypot(x, y);

            if (magnitude > 0) {
                nonZeroCount += 1;
            }

            xTotal += x;
            yTotal += y;
            magnitudeTotal += magnitude;
            maxMagnitude = Math.max(maxMagnitude, magnitude);
        }

        return {
            nonZeroCount,
            meanX: xTotal / count,
            meanY: yTotal / count,
            meanMagnitude: magnitudeTotal / count,
            maxMagnitude
        };
    }

    function extractScalarFieldValues(field, width, height, fallback = 0) {
        if (field && typeof field.cloneValues === 'function') {
            const values = field.cloneValues();
            if (Array.isArray(values)) {
                return values.map((value) => Number.isFinite(value) ? value : fallback);
            }
        }

        const values = [];
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const value = field && typeof field.read === 'function'
                    ? field.read(x, y, fallback)
                    : fallback;
                values.push(Number.isFinite(value) ? value : fallback);
            }
        }

        return values;
    }

    function extractDirectionalFieldVectors(field, width, height) {
        if (field && typeof field.cloneVectors === 'function') {
            const vectors = field.cloneVectors();
            if (isPlainObject(vectors) && Array.isArray(vectors.x) && Array.isArray(vectors.y)) {
                return {
                    xValues: vectors.x.map((value) => normalizeNumber(value, 0)),
                    yValues: vectors.y.map((value) => normalizeNumber(value, 0))
                };
            }
        }

        const xValues = [];
        const yValues = [];

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const vector = field && typeof field.read === 'function'
                    ? field.read(x, y, { x: 0, y: 0 })
                    : { x: 0, y: 0 };
                xValues.push(normalizeNumber(vector && vector.x, 0));
                yValues.push(normalizeNumber(vector && vector.y, 0));
            }
        }

        return {
            xValues,
            yValues
        };
    }

    function buildFallbackFieldArtifact(field, options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const descriptor = readFieldDescriptor(field);
        const fieldType = readFieldType(field);
        const fieldId = normalizeString(
            normalizedOptions.fieldId,
            normalizeString(descriptor.fieldId, normalizeString(field && field.fieldId, 'field'))
        );
        const artifactId = normalizeString(normalizedOptions.artifactId, `${fieldId}.snapshot`);
        const stageId = normalizeString(normalizedOptions.stageId, DEFAULT_FIELD_STAGE_ID);
        const sourceLayerId = normalizeString(normalizedOptions.sourceLayerId, fieldId);

        if (fieldType === 'ScalarField') {
            const width = normalizeInteger(descriptor.width, normalizeInteger(field && field.width, 0));
            const height = normalizeInteger(descriptor.height, normalizeInteger(field && field.height, 0));
            const size = normalizeInteger(descriptor.size, width * height);
            const range = normalizeRange(descriptor.range, [0, 1]);
            const defaultValue = Number.isFinite(descriptor.defaultValue)
                ? descriptor.defaultValue
                : range[0];
            const values = extractScalarFieldValues(field, width, height, defaultValue);

            return {
                artifactId,
                artifactKind: 'fieldSnapshot',
                stageId,
                sourceLayerId,
                payload: {
                    snapshotType: 'scalarHeatmap',
                    fieldType,
                    fieldId,
                    width,
                    height,
                    size,
                    range,
                    defaultValue,
                    defaultSampleMode: normalizeString(descriptor.defaultSampleMode, 'nearest'),
                    defaultEdgeMode: normalizeString(descriptor.defaultEdgeMode, 'clamp'),
                    valueEncoding: 'rowMajorFloatArray',
                    values,
                    stats: buildValueStats(values)
                }
            };
        }

        if (fieldType === 'DirectionalField') {
            const width = normalizeInteger(descriptor.width, normalizeInteger(field && field.width, 0));
            const height = normalizeInteger(descriptor.height, normalizeInteger(field && field.height, 0));
            const size = normalizeInteger(descriptor.size, width * height);
            const vectors = extractDirectionalFieldVectors(field, width, height);

            return {
                artifactId,
                artifactKind: 'fieldSnapshot',
                stageId,
                sourceLayerId,
                payload: {
                    snapshotType: 'directionalVectors',
                    fieldType,
                    fieldId,
                    width,
                    height,
                    size,
                    vectorEncoding: 'rowMajorUnitVectorArrays',
                    xValues: vectors.xValues,
                    yValues: vectors.yValues,
                    stats: buildVectorStats(vectors.xValues, vectors.yValues)
                }
            };
        }

        return {
            artifactId,
            artifactKind: 'fieldSnapshot',
            stageId,
            sourceLayerId,
            payload: {
                snapshotType: 'genericField',
                fieldType: fieldType || 'UnknownField',
                fieldId,
                descriptor: cloneValue(descriptor)
            }
        };
    }

    function resolveFieldArtifact(fieldCandidate, options = {}) {
        if (isFieldSnapshotArtifact(fieldCandidate)) {
            return cloneValue(fieldCandidate);
        }

        if (
            fieldCandidate
            && typeof macro.buildFieldDebugArtifact === 'function'
            && typeof fieldCandidate.describe === 'function'
        ) {
            return macro.buildFieldDebugArtifact(fieldCandidate, options);
        }

        return buildFallbackFieldArtifact(fieldCandidate, options);
    }

    function buildSnapshotEnvelope({
        snapshotType = SNAPSHOT_TYPE_FIELD,
        snapshotFamily = 'recordBound',
        sourcePackageId = null,
        fieldOrProfileName = '',
        summary = '',
        seedContext = {},
        naming = {},
        payload = {}
    } = {}) {
        const normalizedSnapshotType = normalizeString(snapshotType, SNAPSHOT_TYPE_FIELD);
        const normalizedSnapshotFamily = normalizeSnapshotFamily(snapshotFamily, 'recordBound');
        const normalizedFieldOrProfileName = normalizeString(fieldOrProfileName, 'snapshot');
        const normalizedSourcePackageId = normalizeString(sourcePackageId, '') || null;
        const snapshotId = buildPhase2SnapshotId({
            snapshotType: normalizedSnapshotType,
            snapshotName: normalizedFieldOrProfileName,
            sourcePackageId: normalizedSourcePackageId || 'unknownSourcePackage'
        });

        return deepFreeze({
            snapshotId,
            phaseId: PHASE_ID,
            snapshotType: normalizedSnapshotType,
            snapshotFamily: normalizedSnapshotFamily,
            sourcePackageId: normalizedSourcePackageId,
            fieldOrProfileName: normalizedFieldOrProfileName,
            seedContext: normalizePhase2SeedContext(seedContext, normalizedSnapshotFamily),
            summary: normalizeString(
                summary,
                DEFAULT_SUMMARY_BY_TYPE[normalizedSnapshotType] || 'UI-free Phase 2 debug snapshot.'
            ),
            supportOnly: true,
            canonicalGameplayTruth: false,
            naming: cloneValue(naming),
            payload: cloneValue(payload)
        });
    }

    function createPhase2FieldSnapshot(fieldCandidate, options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const fieldDescriptor = isFieldSnapshotArtifact(fieldCandidate)
            ? (isPlainObject(fieldCandidate.payload) ? fieldCandidate.payload : {})
            : readFieldDescriptor(fieldCandidate);
        const snapshotFamily = normalizeSnapshotFamily(normalizedOptions.snapshotFamily, 'pressure');
        const domainId = normalizeString(normalizedOptions.domainId, 'generic');
        const fieldId = normalizeString(
            normalizedOptions.fieldId,
            normalizeString(fieldDescriptor.fieldId, normalizeString(fieldCandidate && fieldCandidate.fieldId, 'field'))
        );
        const snapshotName = buildPhase2FieldSnapshotName({
            snapshotFamily,
            domainId,
            fieldId
        });
        const fieldArtifact = resolveFieldArtifact(fieldCandidate, {
            artifactId: snapshotName,
            stageId: normalizeString(normalizedOptions.stageId, DEFAULT_FIELD_STAGE_ID),
            sourceLayerId: normalizeString(normalizedOptions.sourceLayerId, snapshotName),
            fieldId
        });

        return buildSnapshotEnvelope({
            snapshotType: SNAPSHOT_TYPE_FIELD,
            snapshotFamily,
            sourcePackageId: normalizedOptions.sourcePackageId,
            fieldOrProfileName: snapshotName,
            summary: normalizedOptions.summary,
            seedContext: normalizedOptions.seedContext,
            naming: {
                snapshotName,
                stageId: normalizeString(normalizedOptions.stageId, DEFAULT_FIELD_STAGE_ID),
                sourceLayerId: normalizeString(normalizedOptions.sourceLayerId, snapshotName),
                artifactId: normalizeString(fieldArtifact.artifactId, snapshotName),
                fieldId,
                domainId: normalizeSnapshotToken(domainId, 'generic')
            },
            payload: {
                fieldArtifact
            }
        });
    }

    function buildProfilePreview(profile, options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const pressureSignalKeys = Object.keys(isPlainObject(profile.pressureSignals) ? profile.pressureSignals : {}).sort();
        const rhythmSignalKeys = Object.keys(isPlainObject(profile.rhythmSignals) ? profile.rhythmSignals : {}).sort();
        const preview = {
            profileId: normalizeString(profile.profileId, ''),
            recordType: normalizeString(profile.recordType, ''),
            recordId: normalizeString(profile.recordId, ''),
            sourcePackageId: normalizeString(profile.sourcePackageId, '') || null,
            dominantEnvironmentalTraits: Array.isArray(profile.dominantEnvironmentalTraits)
                ? cloneValue(profile.dominantEnvironmentalTraits)
                : [],
            summary: normalizeString(profile.summary, ''),
            pressureSignalKeys,
            rhythmSignalKeys,
            pressureSignalCount: pressureSignalKeys.length,
            rhythmSignalCount: rhythmSignalKeys.length
        };

        if (normalizedOptions.includeSignals === true) {
            preview.pressureSignals = isPlainObject(profile.pressureSignals)
                ? cloneValue(profile.pressureSignals)
                : {};
            preview.rhythmSignals = isPlainObject(profile.rhythmSignals)
                ? cloneValue(profile.rhythmSignals)
                : {};
        }

        return preview;
    }

    function createPhase2RecordProfileSnapshot(profileCandidate = {}, options = {}) {
        if (typeof phase2.assertRecordBoundProfile === 'function') {
            phase2.assertRecordBoundProfile(profileCandidate);
        }

        const normalizedOptions = isPlainObject(options) ? options : {};
        const snapshotName = buildPhase2RecordProfileSnapshotName(profileCandidate);
        const sourcePackageId = normalizeString(
            normalizedOptions.sourcePackageId,
            normalizeString(profileCandidate.sourcePackageId, '')
        ) || null;

        return buildSnapshotEnvelope({
            snapshotType: SNAPSHOT_TYPE_RECORD_PROFILE,
            snapshotFamily: 'recordBound',
            sourcePackageId,
            fieldOrProfileName: snapshotName,
            summary: normalizeString(normalizedOptions.summary, normalizeString(profileCandidate.summary, '')),
            seedContext: normalizedOptions.seedContext,
            naming: {
                snapshotName,
                stageId: normalizeString(normalizedOptions.stageId, DEFAULT_PROFILE_STAGE_ID),
                recordType: normalizeSnapshotToken(profileCandidate.recordType, 'record'),
                recordId: normalizeSnapshotToken(profileCandidate.recordId, 'unknownRecord'),
                profileId: normalizeSnapshotToken(profileCandidate.profileId, 'profile')
            },
            payload: {
                profilePreview: buildProfilePreview(profileCandidate, normalizedOptions)
            }
        });
    }

    function buildCoverageByRecordType(profiles = []) {
        const canonicalRecordTypes = typeof phase2.getCanonicalPhase2RecordTypeIds === 'function'
            ? phase2.getCanonicalPhase2RecordTypeIds()
            : [];

        const coverage = canonicalRecordTypes.reduce((result, recordType) => {
            result[recordType] = 0;
            return result;
        }, {});

        profiles.forEach((profile) => {
            const recordType = normalizeString(profile && profile.recordType, '');
            if (!recordType) {
                return;
            }

            coverage[recordType] = normalizeInteger(coverage[recordType], 0) + 1;
        });

        return coverage;
    }

    function createPhase2RecordProfileCollectionSnapshot(profileCandidates = [], options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const profiles = Array.isArray(profileCandidates)
            ? profileCandidates.slice()
            : [];

        if (typeof phase2.assertRecordBoundProfile === 'function') {
            profiles.forEach((profile) => phase2.assertRecordBoundProfile(profile));
        }

        const collectionId = normalizeString(normalizedOptions.collectionId, 'recordProfiles');
        const snapshotName = buildPhase2RecordProfileCollectionSnapshotName({
            collectionId
        });
        const sourcePackageIds = uniqueStrings(profiles.map((profile) => normalizeString(profile && profile.sourcePackageId, '')));
        const sourcePackageId = sourcePackageIds.length === 1
            ? sourcePackageIds[0]
            : (normalizeString(normalizedOptions.sourcePackageId, '') || null);

        return buildSnapshotEnvelope({
            snapshotType: SNAPSHOT_TYPE_RECORD_PROFILE_COLLECTION,
            snapshotFamily: 'recordBound',
            sourcePackageId,
            fieldOrProfileName: snapshotName,
            summary: normalizedOptions.summary,
            seedContext: normalizedOptions.seedContext,
            naming: {
                snapshotName,
                stageId: normalizeString(normalizedOptions.stageId, DEFAULT_COLLECTION_STAGE_ID),
                collectionId: normalizeSnapshotToken(collectionId, 'recordProfiles')
            },
            payload: {
                collectionId,
                profileCount: profiles.length,
                coverageByRecordType: buildCoverageByRecordType(profiles),
                profilePreviews: profiles.map((profile) => buildProfilePreview(profile, normalizedOptions))
            }
        });
    }

    function getPhase2DebugSnapshotScaffoldDescriptor() {
        return deepFreeze({
            scaffoldId: DEBUG_SNAPSHOT_SCAFFOLD_ID,
            version: DEBUG_SNAPSHOT_SCAFFOLD_VERSION,
            phaseId: PHASE_ID,
            canonicalPath: STUB.canonicalPath,
            uiCoupling: false,
            supportOnly: true,
            canonicalGameplayTruth: false,
            snapshotFamilies: getPhase2SnapshotFamilies(),
            supportedSnapshotTypes: [
                SNAPSHOT_TYPE_FIELD,
                SNAPSHOT_TYPE_RECORD_PROFILE,
                SNAPSHOT_TYPE_RECORD_PROFILE_COLLECTION
            ],
            namingRules: getPhase2SnapshotNamingRules(),
            api: [
                'getPhase2SnapshotFamilies',
                'getPhase2SnapshotNamingRules',
                'buildPhase2FieldSnapshotName',
                'buildPhase2RecordProfileSnapshotName',
                'buildPhase2RecordProfileCollectionSnapshotName',
                'buildPhase2SnapshotId',
                'createPhase2FieldSnapshot',
                'createPhase2RecordProfileSnapshot',
                'createPhase2RecordProfileCollectionSnapshot'
            ]
        });
    }

    phase2.__contractFirstStubs = phase2.__contractFirstStubs || {};
    phase2.__contractFirstStubs[GROUP_ID] = STUB;
    phase2.debug = deepFreeze({
        getPhase2DebugModuleStub,
        getPhase2SnapshotFamilies,
        getPhase2SnapshotNamingRules,
        getPhase2DebugSnapshotScaffoldDescriptor,
        buildPhase2FieldSnapshotName,
        buildPhase2RecordProfileSnapshotName,
        buildPhase2RecordProfileCollectionSnapshotName,
        buildPhase2SnapshotId,
        createPhase2FieldSnapshot,
        createPhase2RecordProfileSnapshot,
        createPhase2RecordProfileCollectionSnapshot
    });

    Object.assign(phase2, {
        getPhase2DebugModuleStub,
        getPhase2SnapshotFamilies,
        getPhase2SnapshotNamingRules,
        getPhase2DebugSnapshotScaffoldDescriptor,
        buildPhase2FieldSnapshotName,
        buildPhase2RecordProfileSnapshotName,
        buildPhase2RecordProfileCollectionSnapshotName,
        buildPhase2SnapshotId,
        createPhase2FieldSnapshot,
        createPhase2RecordProfileSnapshot,
        createPhase2RecordProfileCollectionSnapshot
    });
})();
