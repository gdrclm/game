(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const DEFAULT_SOURCE_RANGE = Object.freeze([0, 1]);
    const DEFAULT_TARGET_RANGE = Object.freeze([0, 1]);
    const DEFAULT_MODE = 'remapClamp';
    const SUPPORTED_MODES = Object.freeze([
        'clamp',
        'remap',
        'remapClamp'
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

    function normalizeInteger(value, fallback = 0) {
        return Number.isFinite(value)
            ? Math.max(0, Math.trunc(value))
            : fallback;
    }

    function normalizeRange(range = DEFAULT_SOURCE_RANGE, fallback = DEFAULT_SOURCE_RANGE) {
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

    function clampToRange(value, range, fallback = range[0]) {
        const numericValue = Number(value);
        const safeValue = Number.isFinite(numericValue)
            ? numericValue
            : fallback;

        return Math.max(range[0], Math.min(range[1], safeValue));
    }

    function normalizeString(value, fallback) {
        return typeof value === 'string' && value.trim()
            ? value.trim()
            : fallback;
    }

    function normalizeMode(value, fallback = DEFAULT_MODE) {
        const normalizedMode = normalizeString(value, fallback);
        return SUPPORTED_MODES.includes(normalizedMode)
            ? normalizedMode
            : fallback;
    }

    function resolveFieldRange(field, rangeOverride) {
        if (Array.isArray(rangeOverride)) {
            return normalizeRange(rangeOverride, DEFAULT_SOURCE_RANGE);
        }

        if (field && typeof field.describe === 'function') {
            const descriptor = field.describe();
            if (descriptor && Array.isArray(descriptor.range)) {
                return normalizeRange(descriptor.range, DEFAULT_SOURCE_RANGE);
            }
        }

        return DEFAULT_SOURCE_RANGE.slice();
    }

    function remapValue(value, sourceRange, targetRange, fallback) {
        const numericValue = Number(value);
        const safeValue = Number.isFinite(numericValue)
            ? numericValue
            : fallback;
        const sourceSpan = sourceRange[1] - sourceRange[0];

        if (sourceSpan <= 0) {
            return targetRange[0];
        }

        const normalizedRatio = (safeValue - sourceRange[0]) / sourceSpan;
        return targetRange[0] + ((targetRange[1] - targetRange[0]) * normalizedRatio);
    }

    function normalizeFieldValue(value, options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const sourceRange = normalizeRange(
            normalizedOptions.sourceRange,
            DEFAULT_SOURCE_RANGE
        );
        const targetRange = normalizeRange(
            normalizedOptions.targetRange,
            DEFAULT_TARGET_RANGE
        );
        const mode = normalizeMode(normalizedOptions.mode, DEFAULT_MODE);
        const fallback = hasOwn(normalizedOptions, 'fallback')
            ? normalizedOptions.fallback
            : targetRange[0];

        if (mode === 'clamp') {
            return clampToRange(value, targetRange, fallback);
        }

        const remappedValue = remapValue(value, sourceRange, targetRange, fallback);
        if (mode === 'remap') {
            return remappedValue;
        }

        return clampToRange(remappedValue, targetRange, fallback);
    }

    function createFieldNormalizer(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const normalizerId = normalizeString(normalizedOptions.normalizerId, 'fieldNormalizer');
        const sourceRange = normalizeRange(
            normalizedOptions.sourceRange,
            DEFAULT_SOURCE_RANGE
        );
        const targetRange = normalizeRange(
            normalizedOptions.targetRange,
            DEFAULT_TARGET_RANGE
        );
        const defaultMode = normalizeMode(normalizedOptions.defaultMode, DEFAULT_MODE);

        function normalizeValue(value, valueOptions = {}) {
            const normalizedValueOptions = isPlainObject(valueOptions) ? valueOptions : {};
            return normalizeFieldValue(value, {
                sourceRange: hasOwn(normalizedValueOptions, 'sourceRange')
                    ? normalizedValueOptions.sourceRange
                    : sourceRange,
                targetRange: hasOwn(normalizedValueOptions, 'targetRange')
                    ? normalizedValueOptions.targetRange
                    : targetRange,
                mode: hasOwn(normalizedValueOptions, 'mode')
                    ? normalizedValueOptions.mode
                    : defaultMode,
                fallback: normalizedValueOptions.fallback
            });
        }

        function normalizeSample(field, x, y, sampleOptions = {}) {
            if (!field || typeof field.sample !== 'function') {
                throw new Error('[worldgen/macro] FieldNormalizer requires a field with sample().');
            }

            const normalizedSampleOptions = isPlainObject(sampleOptions) ? sampleOptions : {};
            const rawValue = field.sample(
                x,
                y,
                isPlainObject(normalizedSampleOptions.sampleOptions)
                    ? normalizedSampleOptions.sampleOptions
                    : {}
            );

            if (!Number.isFinite(rawValue)) {
                throw new Error('[worldgen/macro] FieldNormalizer currently supports only scalar-compatible sample outputs.');
            }

            return normalizeValue(rawValue, {
                sourceRange: hasOwn(normalizedSampleOptions, 'sourceRange')
                    ? normalizedSampleOptions.sourceRange
                    : resolveFieldRange(field, null),
                targetRange: normalizedSampleOptions.targetRange,
                mode: normalizedSampleOptions.mode,
                fallback: normalizedSampleOptions.fallback
            });
        }

        function normalizeScalarField(field, fieldOptions = {}) {
            if (!field || typeof field.sample !== 'function') {
                throw new Error('[worldgen/macro] normalizeScalarField() requires a field with sample().');
            }

            if (typeof macro.createScalarField !== 'function') {
                throw new Error('[worldgen/macro] createScalarField() is required before using FieldNormalizer.');
            }

            const normalizedFieldOptions = isPlainObject(fieldOptions) ? fieldOptions : {};
            const width = normalizeInteger(
                normalizedFieldOptions.width,
                Number.isFinite(field.width) ? field.width : 0
            );
            const height = normalizeInteger(
                normalizedFieldOptions.height,
                Number.isFinite(field.height) ? field.height : 0
            );
            const outputRange = normalizeRange(
                normalizedFieldOptions.targetRange,
                targetRange
            );
            const outputField = macro.createScalarField({
                fieldId: normalizeString(
                    normalizedFieldOptions.fieldId,
                    `${normalizeString(field.fieldId, 'field')}.normalized`
                ),
                width,
                height,
                range: outputRange,
                defaultValue: normalizeFieldValue(
                    hasOwn(normalizedFieldOptions, 'defaultValue')
                        ? normalizedFieldOptions.defaultValue
                        : outputRange[0],
                    {
                        sourceRange: outputRange,
                        targetRange: outputRange,
                        mode: 'clamp',
                        fallback: outputRange[0]
                    }
                )
            });

            for (let y = 0; y < height; y += 1) {
                for (let x = 0; x < width; x += 1) {
                    outputField.write(x, y, normalizeSample(field, x, y, normalizedFieldOptions));
                }
            }

            return outputField;
        }

        function describe() {
            return {
                type: 'FieldNormalizer',
                normalizerId,
                sourceRange: sourceRange.slice(),
                targetRange: targetRange.slice(),
                defaultMode,
                supportedModes: SUPPORTED_MODES.slice(),
                outputType: 'ScalarField',
                supportedInputContract: 'field.sample(x, y, sampleOptions) -> finite number',
                deterministicNormalization: true
            };
        }

        return Object.freeze({
            type: 'FieldNormalizer',
            normalizerId,
            sourceRange: sourceRange.slice(),
            targetRange: targetRange.slice(),
            defaultMode,
            normalizeValue,
            normalizeSample,
            normalizeScalarField,
            describe
        });
    }

    function normalizeFieldSample(field, x, y, options = {}) {
        const fieldNormalizer = createFieldNormalizer(options);
        return fieldNormalizer.normalizeSample(field, x, y, options);
    }

    function normalizeScalarField(field, options = {}) {
        const fieldNormalizer = createFieldNormalizer(options);
        return fieldNormalizer.normalizeScalarField(field, options);
    }

    const FIELD_NORMALIZER_DESCRIPTOR = deepFreeze({
        type: 'FieldNormalizer',
        deterministic: true,
        intendedLayers: [
            'physical',
            'macro'
        ],
        supportedModes: SUPPORTED_MODES.slice(),
        defaultMode: DEFAULT_MODE,
        defaultSourceRange: DEFAULT_SOURCE_RANGE.slice(),
        defaultTargetRange: DEFAULT_TARGET_RANGE.slice(),
        outputType: 'ScalarField',
        supportedInputContract: 'field.sample(x, y, sampleOptions) -> finite number',
        normalizationStages: [
            'read',
            'resolveSourceRange',
            'normalizeMode',
            'mapOrClamp'
        ],
        deterministicNormalization: true
    });

    function getFieldNormalizerDescriptor() {
        return cloneValue(FIELD_NORMALIZER_DESCRIPTOR);
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('fieldNormalizer', {
            entry: 'createFieldNormalizer',
            file: 'js/worldgen/macro/field-normalizer.js',
            description: 'Base deterministic FieldNormalizer for Phase 1 physical + macro scalar-compatible field range normalization.',
            stub: false
        });
    }

    Object.assign(macro, {
        createFieldNormalizer,
        getFieldNormalizerDescriptor,
        normalizeFieldValue,
        normalizeFieldSample,
        normalizeScalarField
    });
})();
