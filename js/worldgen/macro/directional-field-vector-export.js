(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const CONTRACT_ID = 'directionalFieldVectorArtifact';
    const ARTIFACT_KIND = 'fieldSnapshot';
    const SNAPSHOT_TYPE = 'directionalVectors';
    const VECTOR_ENCODING = 'rowMajorUnitVectorArrays';
    const ZERO_VECTOR = Object.freeze({
        x: 0,
        y: 0
    });
    const ROOT_REQUIRED_KEYS = Object.freeze([
        'artifactId',
        'artifactKind',
        'stageId',
        'sourceLayerId',
        'payload'
    ]);
    const PAYLOAD_REQUIRED_KEYS = Object.freeze([
        'snapshotType',
        'fieldType',
        'fieldId',
        'width',
        'height',
        'size',
        'vectorEncoding',
        'xValues',
        'yValues',
        'stats'
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

    function normalizeInteger(value, fallback = 0) {
        return Number.isFinite(value)
            ? Math.max(0, Math.trunc(value))
            : fallback;
    }

    function normalizeNumber(value, fallback = 0) {
        return Number.isFinite(value)
            ? value
            : fallback;
    }

    function normalizeVector(vectorLike = ZERO_VECTOR, fallback = ZERO_VECTOR) {
        const source = isPlainObject(vectorLike) ? vectorLike : {};
        return {
            x: normalizeNumber(source.x, fallback.x),
            y: normalizeNumber(source.y, fallback.y)
        };
    }

    function readDirectionalFieldDescriptor(field) {
        if (field && typeof field.describe === 'function') {
            const descriptor = field.describe();
            if (isPlainObject(descriptor)) {
                return descriptor;
            }
        }

        return {};
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
                    ? normalizeVector(field.read(x, y, ZERO_VECTOR), ZERO_VECTOR)
                    : ZERO_VECTOR;
                xValues.push(vector.x);
                yValues.push(vector.y);
            }
        }

        return {
            xValues,
            yValues
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

    function ensureDirectionalFieldLike(field) {
        const descriptor = readDirectionalFieldDescriptor(field);
        const fieldType = normalizeString(descriptor.type, normalizeString(field && field.type, ''));
        if (fieldType !== 'DirectionalField') {
            throw new Error('[worldgen/macro] Directional field debug export requires a DirectionalField-compatible input.');
        }

        if (!field || typeof field.read !== 'function') {
            throw new Error('[worldgen/macro] Directional field debug export requires read().');
        }

        return descriptor;
    }

    function createDirectionalFieldVectorArtifactSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const width = normalizeInteger(normalizedInput.width, 0);
        const height = normalizeInteger(normalizedInput.height, 0);
        const size = normalizeInteger(normalizedInput.size, width * height);
        const xValues = Array.isArray(normalizedInput.xValues)
            ? normalizedInput.xValues.map((value) => normalizeNumber(value, 0))
            : [];
        const yValues = Array.isArray(normalizedInput.yValues)
            ? normalizedInput.yValues.map((value) => normalizeNumber(value, 0))
            : [];

        return {
            artifactId: normalizeString(normalizedInput.artifactId, ''),
            artifactKind: ARTIFACT_KIND,
            stageId: normalizeString(normalizedInput.stageId, ''),
            sourceLayerId: normalizeString(normalizedInput.sourceLayerId, ''),
            payload: {
                snapshotType: SNAPSHOT_TYPE,
                fieldType: 'DirectionalField',
                fieldId: normalizeString(normalizedInput.fieldId, ''),
                width,
                height,
                size,
                defaultDirection: normalizeVector(normalizedInput.defaultDirection, ZERO_VECTOR),
                defaultSampleMode: normalizeString(normalizedInput.defaultSampleMode, 'nearest'),
                defaultEdgeMode: normalizeString(normalizedInput.defaultEdgeMode, 'clamp'),
                vectorEncoding: VECTOR_ENCODING,
                xValues,
                yValues,
                stats: isPlainObject(normalizedInput.stats)
                    ? {
                        nonZeroCount: normalizeInteger(normalizedInput.stats.nonZeroCount, 0),
                        meanX: normalizeNumber(normalizedInput.stats.meanX, 0),
                        meanY: normalizeNumber(normalizedInput.stats.meanY, 0),
                        meanMagnitude: normalizeNumber(normalizedInput.stats.meanMagnitude, 0),
                        maxMagnitude: normalizeNumber(normalizedInput.stats.maxMagnitude, 0)
                    }
                    : buildVectorStats(xValues, yValues)
            }
        };
    }

    function buildDirectionalFieldVectorArtifact(field, options = {}) {
        const descriptor = ensureDirectionalFieldLike(field);
        const normalizedOptions = isPlainObject(options) ? options : {};
        const width = normalizeInteger(descriptor.width, normalizeInteger(field.width, 0));
        const height = normalizeInteger(descriptor.height, normalizeInteger(field.height, 0));
        const size = normalizeInteger(descriptor.size, width * height);
        const vectors = extractDirectionalFieldVectors(field, width, height);
        const fieldId = normalizeString(
            normalizedOptions.fieldId,
            normalizeString(descriptor.fieldId, normalizeString(field.fieldId, 'directionalField'))
        );

        return createDirectionalFieldVectorArtifactSkeleton({
            artifactId: normalizeString(normalizedOptions.artifactId, `${fieldId}.directionalVectors`),
            stageId: normalizeString(normalizedOptions.stageId, 'fieldDebugExport'),
            sourceLayerId: normalizeString(normalizedOptions.sourceLayerId, fieldId),
            fieldId,
            width,
            height,
            size,
            defaultDirection: normalizeVector(descriptor.defaultDirection, ZERO_VECTOR),
            defaultSampleMode: normalizeString(descriptor.defaultSampleMode, 'nearest'),
            defaultEdgeMode: normalizeString(descriptor.defaultEdgeMode, 'clamp'),
            xValues: vectors.xValues,
            yValues: vectors.yValues,
            stats: buildVectorStats(vectors.xValues, vectors.yValues)
        });
    }

    function pushError(errors, message) {
        errors.push(`[${CONTRACT_ID}] ${message}`);
    }

    function validateDirectionalFieldVectorArtifact(candidate) {
        const errors = [];

        if (!isPlainObject(candidate)) {
            pushError(errors, 'Artifact root must be a plain object.');
            return {
                contractId: CONTRACT_ID,
                isValid: false,
                errors
            };
        }

        ROOT_REQUIRED_KEYS.forEach((key) => {
            if (!hasOwn(candidate, key)) {
                pushError(errors, `Missing required key "${key}".`);
            }
        });

        ['artifactId', 'artifactKind', 'stageId', 'sourceLayerId'].forEach((key) => {
            if (hasOwn(candidate, key) && (typeof candidate[key] !== 'string' || !candidate[key].trim())) {
                pushError(errors, `"${key}" must be a non-empty string.`);
            }
        });

        if (hasOwn(candidate, 'artifactKind') && candidate.artifactKind !== ARTIFACT_KIND) {
            pushError(errors, `"artifactKind" must be "${ARTIFACT_KIND}".`);
        }

        if (!hasOwn(candidate, 'payload') || !isPlainObject(candidate.payload)) {
            pushError(errors, '"payload" must be a plain object.');
        }

        const payload = isPlainObject(candidate.payload) ? candidate.payload : null;
        if (payload) {
            PAYLOAD_REQUIRED_KEYS.forEach((key) => {
                if (!hasOwn(payload, key)) {
                    pushError(errors, `"payload.${key}" is required.`);
                }
            });

            if (hasOwn(payload, 'snapshotType') && payload.snapshotType !== SNAPSHOT_TYPE) {
                pushError(errors, `"payload.snapshotType" must be "${SNAPSHOT_TYPE}".`);
            }

            if (hasOwn(payload, 'fieldType') && payload.fieldType !== 'DirectionalField') {
                pushError(errors, '"payload.fieldType" must be "DirectionalField".');
            }

            ['fieldId', 'vectorEncoding'].forEach((key) => {
                if (hasOwn(payload, key) && (typeof payload[key] !== 'string' || !payload[key].trim())) {
                    pushError(errors, `"payload.${key}" must be a non-empty string.`);
                }
            });

            ['width', 'height', 'size'].forEach((key) => {
                if (hasOwn(payload, key) && (!Number.isInteger(payload[key]) || payload[key] < 0)) {
                    pushError(errors, `"payload.${key}" must be a non-negative integer.`);
                }
            });

            ['xValues', 'yValues'].forEach((key) => {
                if (!hasOwn(payload, key)) {
                    return;
                }

                if (!Array.isArray(payload[key])) {
                    pushError(errors, `"payload.${key}" must be an array.`);
                } else if (payload[key].some((value) => !Number.isFinite(value))) {
                    pushError(errors, `"payload.${key}" must contain only finite numbers.`);
                } else if (
                    Number.isInteger(payload.size)
                    && payload.size >= 0
                    && payload[key].length !== payload.size
                ) {
                    pushError(errors, `"payload.${key}.length" must equal "payload.size".`);
                }
            });

            if (
                Array.isArray(payload.xValues)
                && Array.isArray(payload.yValues)
                && payload.xValues.length !== payload.yValues.length
            ) {
                pushError(errors, '"payload.xValues.length" must equal "payload.yValues.length".');
            }

            if (hasOwn(payload, 'defaultDirection') && !isPlainObject(payload.defaultDirection)) {
                pushError(errors, '"payload.defaultDirection" must be a plain object when present.');
            }

            if (hasOwn(payload, 'stats')) {
                if (!isPlainObject(payload.stats)) {
                    pushError(errors, '"payload.stats" must be a plain object.');
                } else {
                    if (!Number.isInteger(payload.stats.nonZeroCount) || payload.stats.nonZeroCount < 0) {
                        pushError(errors, '"payload.stats.nonZeroCount" must be a non-negative integer.');
                    }

                    ['meanX', 'meanY', 'meanMagnitude', 'maxMagnitude'].forEach((key) => {
                        if (!Number.isFinite(payload.stats[key])) {
                            pushError(errors, `"payload.stats.${key}" must be a finite number.`);
                        }
                    });
                }
            }
        }

        return {
            contractId: CONTRACT_ID,
            isValid: errors.length === 0,
            errors
        };
    }

    function assertDirectionalFieldVectorArtifact(candidate) {
        const validationResult = validateDirectionalFieldVectorArtifact(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'DIRECTIONAL_FIELD_VECTOR_ARTIFACT_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    const DIRECTIONAL_FIELD_VECTOR_ARTIFACT_CONTRACT = deepFreeze({
        contractId: CONTRACT_ID,
        deterministic: true,
        artifactKind: ARTIFACT_KIND,
        snapshotType: SNAPSHOT_TYPE,
        vectorEncoding: VECTOR_ENCODING,
        rootRequiredKeys: ROOT_REQUIRED_KEYS.slice(),
        payloadRequiredKeys: PAYLOAD_REQUIRED_KEYS.slice(),
        description: 'Canonical UI-free debug export contract for DirectionalField vector snapshots.'
    });

    function getDirectionalFieldVectorArtifactContract() {
        return cloneValue(DIRECTIONAL_FIELD_VECTOR_ARTIFACT_CONTRACT);
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('directionalFieldVectorArtifact', {
            entry: 'buildDirectionalFieldVectorArtifact',
            file: 'js/worldgen/macro/directional-field-vector-export.js',
            description: 'UI-free DirectionalField vector export builder and validator for Phase 1 debug flows.',
            stub: false
        });
    }

    Object.assign(macro, {
        getDirectionalFieldVectorArtifactContract,
        createDirectionalFieldVectorArtifactSkeleton,
        buildDirectionalFieldVectorArtifact,
        validateDirectionalFieldVectorArtifact,
        assertDirectionalFieldVectorArtifact
    });
})();
