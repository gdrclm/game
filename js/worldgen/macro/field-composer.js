(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const DEFAULT_RANGE = Object.freeze([0, 1]);
    const DEFAULT_RULE = 'average';
    const SUPPORTED_RULES = Object.freeze([
        'sum',
        'average',
        'min',
        'max',
        'multiply'
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

    function normalizeRange(range = DEFAULT_RANGE) {
        if (!Array.isArray(range) || range.length < 2) {
            return DEFAULT_RANGE.slice();
        }

        const min = Number(range[0]);
        const max = Number(range[1]);
        if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
            return DEFAULT_RANGE.slice();
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

    function normalizeRule(value, fallback = DEFAULT_RULE) {
        const normalizedRule = normalizeString(value, fallback);
        return SUPPORTED_RULES.includes(normalizedRule)
            ? normalizedRule
            : fallback;
    }

    function normalizeEntry(entry, index) {
        if (entry && typeof entry.sample === 'function') {
            return {
                field: entry,
                entryId: `field_${index}`,
                weight: 1,
                gain: 1,
                bias: 0,
                sampleOptions: {}
            };
        }

        const normalizedEntry = isPlainObject(entry) ? entry : {};
        const field = normalizedEntry.field;
        if (!field || typeof field.sample !== 'function') {
            throw new Error(`[worldgen/macro] FieldComposer entry ${index} must provide a field with sample().`);
        }

        return {
            field,
            entryId: normalizeString(normalizedEntry.entryId, `field_${index}`),
            weight: Number.isFinite(normalizedEntry.weight) ? normalizedEntry.weight : 1,
            gain: Number.isFinite(normalizedEntry.gain) ? normalizedEntry.gain : 1,
            bias: Number.isFinite(normalizedEntry.bias) ? normalizedEntry.bias : 0,
            sampleOptions: isPlainObject(normalizedEntry.sampleOptions) ? normalizedEntry.sampleOptions : {}
        };
    }

    function normalizeEntries(entries = []) {
        return Array.isArray(entries)
            ? entries.map(normalizeEntry)
            : [];
    }

    function readNumericSample(field, x, y, sampleOptions = {}) {
        const sampledValue = field.sample(x, y, sampleOptions);
        if (!Number.isFinite(sampledValue)) {
            throw new Error('[worldgen/macro] FieldComposer currently supports only scalar-compatible sample outputs.');
        }

        return sampledValue;
    }

    function applyEntryTransform(entry, sampledValue) {
        return ((sampledValue * entry.gain) + entry.bias) * entry.weight;
    }

    function composeTransformedValues(transformedValues, rule, fallbackValue) {
        if (!transformedValues.length) {
            return fallbackValue;
        }

        if (rule === 'sum') {
            return transformedValues.reduce((sum, value) => sum + value, 0);
        }

        if (rule === 'average') {
            const total = transformedValues.reduce((sum, value) => sum + value, 0);
            return total / transformedValues.length;
        }

        if (rule === 'min') {
            return transformedValues.reduce((minValue, value) => Math.min(minValue, value), transformedValues[0]);
        }

        if (rule === 'max') {
            return transformedValues.reduce((maxValue, value) => Math.max(maxValue, value), transformedValues[0]);
        }

        if (rule === 'multiply') {
            return transformedValues.reduce((product, value) => product * value, 1);
        }

        return fallbackValue;
    }

    function createFieldComposer(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const composerId = normalizeString(normalizedOptions.composerId, 'fieldComposer');
        const width = normalizeInteger(normalizedOptions.width, 0);
        const height = normalizeInteger(normalizedOptions.height, 0);
        const range = normalizeRange(normalizedOptions.range);
        const defaultRule = normalizeRule(normalizedOptions.defaultRule, DEFAULT_RULE);
        const defaultValue = clampToRange(normalizedOptions.defaultValue, range, 0);

        function composeSample(entries, x, y, composeOptions = {}) {
            const normalizedComposeOptions = isPlainObject(composeOptions) ? composeOptions : {};
            const rule = normalizeRule(normalizedComposeOptions.rule, defaultRule);
            const fallbackValue = hasOwn(normalizedComposeOptions, 'fallback')
                ? clampToRange(normalizedComposeOptions.fallback, range, defaultValue)
                : defaultValue;
            const normalizedEntries = normalizeEntries(entries);
            const transformedValues = normalizedEntries.map((entry) => {
                const sampledValue = readNumericSample(entry.field, x, y, entry.sampleOptions);
                return applyEntryTransform(entry, sampledValue);
            });

            return clampToRange(
                composeTransformedValues(transformedValues, rule, fallbackValue),
                range,
                fallbackValue
            );
        }

        function composeScalarField(entries, composeOptions = {}) {
            if (typeof macro.createScalarField !== 'function') {
                throw new Error('[worldgen/macro] createScalarField() is required before using FieldComposer.');
            }

            const normalizedComposeOptions = isPlainObject(composeOptions) ? composeOptions : {};
            const outputWidth = normalizeInteger(normalizedComposeOptions.width, width);
            const outputHeight = normalizeInteger(normalizedComposeOptions.height, height);
            const outputRange = normalizeRange(normalizedComposeOptions.range || range);
            const outputDefaultValue = clampToRange(
                normalizedComposeOptions.defaultValue,
                outputRange,
                defaultValue
            );
            const outputField = macro.createScalarField({
                fieldId: normalizeString(normalizedComposeOptions.fieldId, `${composerId}.output`),
                width: outputWidth,
                height: outputHeight,
                range: outputRange,
                defaultValue: outputDefaultValue
            });

            for (let y = 0; y < outputHeight; y += 1) {
                for (let x = 0; x < outputWidth; x += 1) {
                    outputField.write(x, y, composeSample(entries, x, y, normalizedComposeOptions));
                }
            }

            return outputField;
        }

        function describe() {
            return {
                type: 'FieldComposer',
                composerId,
                width,
                height,
                range: range.slice(),
                defaultRule,
                defaultValue,
                supportedRules: SUPPORTED_RULES.slice()
            };
        }

        return Object.freeze({
            type: 'FieldComposer',
            composerId,
            width,
            height,
            range: range.slice(),
            defaultRule,
            defaultValue,
            composeSample,
            composeScalarField,
            describe
        });
    }

    const FIELD_COMPOSER_DESCRIPTOR = deepFreeze({
        type: 'FieldComposer',
        deterministic: true,
        supportedRules: SUPPORTED_RULES.slice(),
        defaultRule: DEFAULT_RULE,
        outputType: 'ScalarField',
        supportedInputContract: 'field.sample(x, y, sampleOptions) -> finite number'
    });

    function getFieldComposerDescriptor() {
        return cloneValue(FIELD_COMPOSER_DESCRIPTOR);
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('fieldComposer', {
            entry: 'createFieldComposer',
            file: 'js/worldgen/macro/field-composer.js',
            description: 'Generic deterministic field compositing helpers for scalar-compatible fields.',
            stub: false
        });
    }

    Object.assign(macro, {
        createFieldComposer,
        getFieldComposerDescriptor
    });
})();
