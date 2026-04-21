(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const CONTRACT_ID = 'scalarFieldHeatmapArtifact';
    const ARTIFACT_KIND = 'fieldSnapshot';
    const SNAPSHOT_TYPE = 'scalarHeatmap';
    const VALUE_ENCODING = 'rowMajorFloatArray';
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
        'range',
        'valueEncoding',
        'values',
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

    function normalizeRange(range = [0, 1], fallback = [0, 1]) {
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

    function readScalarFieldDescriptor(field) {
        if (field && typeof field.describe === 'function') {
            const descriptor = field.describe();
            if (isPlainObject(descriptor)) {
                return descriptor;
            }
        }

        return {};
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

    function ensureScalarFieldLike(field) {
        const descriptor = readScalarFieldDescriptor(field);
        const fieldType = normalizeString(descriptor.type, normalizeString(field && field.type, ''));
        if (fieldType !== 'ScalarField') {
            throw new Error('[worldgen/macro] Scalar field heatmap export requires a ScalarField-compatible input.');
        }

        if (!field || typeof field.read !== 'function') {
            throw new Error('[worldgen/macro] Scalar field heatmap export requires read().');
        }

        return descriptor;
    }

    function createScalarFieldHeatmapArtifactSkeleton(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const width = normalizeInteger(normalizedInput.width, 0);
        const height = normalizeInteger(normalizedInput.height, 0);
        const size = normalizeInteger(normalizedInput.size, width * height);
        const range = normalizeRange(normalizedInput.range, [0, 1]);
        const values = Array.isArray(normalizedInput.values)
            ? normalizedInput.values.map((value) => Number.isFinite(value) ? value : range[0])
            : [];

        return {
            artifactId: normalizeString(normalizedInput.artifactId, ''),
            artifactKind: ARTIFACT_KIND,
            stageId: normalizeString(normalizedInput.stageId, ''),
            sourceLayerId: normalizeString(normalizedInput.sourceLayerId, ''),
            payload: {
                snapshotType: SNAPSHOT_TYPE,
                fieldType: 'ScalarField',
                fieldId: normalizeString(normalizedInput.fieldId, ''),
                width,
                height,
                size,
                range,
                defaultValue: Number.isFinite(normalizedInput.defaultValue)
                    ? normalizedInput.defaultValue
                    : range[0],
                defaultSampleMode: normalizeString(normalizedInput.defaultSampleMode, 'nearest'),
                defaultEdgeMode: normalizeString(normalizedInput.defaultEdgeMode, 'clamp'),
                valueEncoding: VALUE_ENCODING,
                values,
                stats: isPlainObject(normalizedInput.stats)
                    ? {
                        min: Number.isFinite(normalizedInput.stats.min) ? normalizedInput.stats.min : 0,
                        max: Number.isFinite(normalizedInput.stats.max) ? normalizedInput.stats.max : 0,
                        mean: Number.isFinite(normalizedInput.stats.mean) ? normalizedInput.stats.mean : 0
                    }
                    : buildValueStats(values)
            }
        };
    }

    function buildScalarFieldHeatmapArtifact(field, options = {}) {
        const descriptor = ensureScalarFieldLike(field);
        const normalizedOptions = isPlainObject(options) ? options : {};
        const width = normalizeInteger(descriptor.width, normalizeInteger(field.width, 0));
        const height = normalizeInteger(descriptor.height, normalizeInteger(field.height, 0));
        const size = normalizeInteger(descriptor.size, width * height);
        const range = normalizeRange(descriptor.range, [0, 1]);
        const defaultValue = Number.isFinite(descriptor.defaultValue)
            ? descriptor.defaultValue
            : range[0];
        const values = extractScalarFieldValues(field, width, height, defaultValue);

        return createScalarFieldHeatmapArtifactSkeleton({
            artifactId: normalizeString(
                normalizedOptions.artifactId,
                `${normalizeString(descriptor.fieldId, normalizeString(field.fieldId, 'scalarField'))}.scalarHeatmap`
            ),
            stageId: normalizeString(normalizedOptions.stageId, 'fieldDebugExport'),
            sourceLayerId: normalizeString(
                normalizedOptions.sourceLayerId,
                normalizeString(descriptor.fieldId, normalizeString(field.fieldId, 'scalarField'))
            ),
            fieldId: normalizeString(
                normalizedOptions.fieldId,
                normalizeString(descriptor.fieldId, normalizeString(field.fieldId, 'scalarField'))
            ),
            width,
            height,
            size,
            range,
            defaultValue,
            defaultSampleMode: normalizeString(descriptor.defaultSampleMode, 'nearest'),
            defaultEdgeMode: normalizeString(descriptor.defaultEdgeMode, 'clamp'),
            values,
            stats: buildValueStats(values)
        });
    }

    function pushError(errors, message) {
        errors.push(`[${CONTRACT_ID}] ${message}`);
    }

    function validateScalarFieldHeatmapArtifact(candidate) {
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

            if (hasOwn(payload, 'fieldType') && payload.fieldType !== 'ScalarField') {
                pushError(errors, '"payload.fieldType" must be "ScalarField".');
            }

            ['fieldId', 'valueEncoding'].forEach((key) => {
                if (hasOwn(payload, key) && (typeof payload[key] !== 'string' || !payload[key].trim())) {
                    pushError(errors, `"payload.${key}" must be a non-empty string.`);
                }
            });

            ['width', 'height', 'size'].forEach((key) => {
                if (hasOwn(payload, key) && (!Number.isInteger(payload[key]) || payload[key] < 0)) {
                    pushError(errors, `"payload.${key}" must be a non-negative integer.`);
                }
            });

            if (hasOwn(payload, 'range')) {
                const range = normalizeRange(payload.range, null);
                if (!Array.isArray(payload.range) || !range) {
                    pushError(errors, '"payload.range" must be a valid [min, max] array.');
                }
            }

            if (hasOwn(payload, 'values')) {
                if (!Array.isArray(payload.values)) {
                    pushError(errors, '"payload.values" must be an array.');
                } else if (payload.values.some((value) => !Number.isFinite(value))) {
                    pushError(errors, '"payload.values" must contain only finite numbers.');
                } else if (
                    Number.isInteger(payload.size)
                    && payload.size >= 0
                    && payload.values.length !== payload.size
                ) {
                    pushError(errors, '"payload.values.length" must equal "payload.size".');
                }
            }

            if (hasOwn(payload, 'stats')) {
                if (!isPlainObject(payload.stats)) {
                    pushError(errors, '"payload.stats" must be a plain object.');
                } else {
                    ['min', 'max', 'mean'].forEach((key) => {
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

    function assertScalarFieldHeatmapArtifact(candidate) {
        const validationResult = validateScalarFieldHeatmapArtifact(candidate);
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(' '));
            error.code = 'SCALAR_FIELD_HEATMAP_ARTIFACT_INVALID';
            error.validationResult = validationResult;
            throw error;
        }

        return candidate;
    }

    const SCALAR_FIELD_HEATMAP_ARTIFACT_CONTRACT = deepFreeze({
        contractId: CONTRACT_ID,
        deterministic: true,
        artifactKind: ARTIFACT_KIND,
        snapshotType: SNAPSHOT_TYPE,
        valueEncoding: VALUE_ENCODING,
        rootRequiredKeys: ROOT_REQUIRED_KEYS.slice(),
        payloadRequiredKeys: PAYLOAD_REQUIRED_KEYS.slice(),
        description: 'Canonical UI-free debug heatmap export contract for ScalarField snapshots.'
    });

    function getScalarFieldHeatmapArtifactContract() {
        return cloneValue(SCALAR_FIELD_HEATMAP_ARTIFACT_CONTRACT);
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('scalarFieldHeatmapArtifact', {
            entry: 'buildScalarFieldHeatmapArtifact',
            file: 'js/worldgen/macro/scalar-field-heatmap-export.js',
            description: 'UI-free ScalarField heatmap export builder and validator for Phase 1 debug flows.',
            stub: false
        });
    }

    Object.assign(macro, {
        getScalarFieldHeatmapArtifactContract,
        createScalarFieldHeatmapArtifactSkeleton,
        buildScalarFieldHeatmapArtifact,
        validateScalarFieldHeatmapArtifact,
        assertScalarFieldHeatmapArtifact
    });
})();
