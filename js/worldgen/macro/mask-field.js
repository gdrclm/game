(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const DEFAULT_RANGE = Object.freeze([0, 1]);
    const DEFAULT_SAMPLE_MODE = 'nearest';
    const DEFAULT_EDGE_MODE = 'clamp';
    const DEFAULT_THRESHOLD = 0.5;
    const SUPPORTED_SAMPLE_MODES = Object.freeze([
        'nearest',
        'bilinear'
    ]);
    const SUPPORTED_EDGE_MODES = Object.freeze([
        'clamp',
        'zero'
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

    function normalizeMode(value, supportedValues, fallback) {
        const normalizedValue = normalizeString(value, fallback);
        return supportedValues.includes(normalizedValue)
            ? normalizedValue
            : fallback;
    }

    function createMaskField(options = {}) {
        const normalizedOptions = options && typeof options === 'object' ? options : {};
        const width = normalizeInteger(normalizedOptions.width, 0);
        const height = normalizeInteger(normalizedOptions.height, 0);
        const size = width * height;
        const range = normalizeRange(normalizedOptions.range);
        const defaultValue = clampToRange(normalizedOptions.defaultValue, range, range[1]);
        const threshold = clampToRange(normalizedOptions.threshold, range, DEFAULT_THRESHOLD);
        const fieldId = normalizeString(normalizedOptions.fieldId, 'maskField');
        const defaultSampleMode = normalizeMode(
            normalizedOptions.defaultSampleMode,
            SUPPORTED_SAMPLE_MODES,
            DEFAULT_SAMPLE_MODE
        );
        const defaultEdgeMode = normalizeMode(
            normalizedOptions.defaultEdgeMode,
            SUPPORTED_EDGE_MODES,
            DEFAULT_EDGE_MODE
        );
        const zeroSampleValue = clampToRange(0, range, defaultValue);
        const storage = new Float32Array(size);

        if (defaultValue !== 0) {
            storage.fill(defaultValue);
        }

        function hasOwn(objectValue, key) {
            return Boolean(objectValue) && Object.prototype.hasOwnProperty.call(objectValue, key);
        }

        function inBounds(x, y) {
            const normalizedX = Math.trunc(x);
            const normalizedY = Math.trunc(y);
            return normalizedX >= 0
                && normalizedY >= 0
                && normalizedX < width
                && normalizedY < height;
        }

        function toIndex(x, y) {
            return (y * width) + x;
        }

        function read(x, y, fallback = defaultValue) {
            const normalizedX = Math.trunc(x);
            const normalizedY = Math.trunc(y);
            if (!inBounds(normalizedX, normalizedY)) {
                return clampToRange(fallback, range, defaultValue);
            }

            return storage[toIndex(normalizedX, normalizedY)];
        }

        function write(x, y, value) {
            const normalizedX = Math.trunc(x);
            const normalizedY = Math.trunc(y);
            if (!inBounds(normalizedX, normalizedY)) {
                return false;
            }

            storage[toIndex(normalizedX, normalizedY)] = clampToRange(value, range, defaultValue);
            return true;
        }

        function fill(value = defaultValue) {
            storage.fill(clampToRange(value, range, defaultValue));
            return field;
        }

        function allow(x, y) {
            return write(x, y, range[1]);
        }

        function block(x, y) {
            return write(x, y, range[0]);
        }

        function readWithEdgeMode(x, y, edgeMode, fallback = defaultValue) {
            if (inBounds(x, y)) {
                return read(x, y, fallback);
            }

            if (edgeMode === 'zero') {
                return zeroSampleValue;
            }

            if (width <= 0 || height <= 0) {
                return clampToRange(fallback, range, defaultValue);
            }

            const clampedX = Math.max(0, Math.min(width - 1, Math.trunc(x)));
            const clampedY = Math.max(0, Math.min(height - 1, Math.trunc(y)));
            return read(clampedX, clampedY, fallback);
        }

        function sampleNearest(x, y, edgeMode, fallback = defaultValue) {
            const nearestX = Math.round(Number(x));
            const nearestY = Math.round(Number(y));
            return readWithEdgeMode(nearestX, nearestY, edgeMode, fallback);
        }

        function sampleBilinear(x, y, edgeMode, fallback = defaultValue) {
            const normalizedX = Number(x);
            const normalizedY = Number(y);

            if (!Number.isFinite(normalizedX) || !Number.isFinite(normalizedY)) {
                return clampToRange(fallback, range, defaultValue);
            }

            const x0 = Math.floor(normalizedX);
            const y0 = Math.floor(normalizedY);
            const x1 = x0 + 1;
            const y1 = y0 + 1;
            const tx = normalizedX - x0;
            const ty = normalizedY - y0;

            const topLeft = readWithEdgeMode(x0, y0, edgeMode, fallback);
            const topRight = readWithEdgeMode(x1, y0, edgeMode, fallback);
            const bottomLeft = readWithEdgeMode(x0, y1, edgeMode, fallback);
            const bottomRight = readWithEdgeMode(x1, y1, edgeMode, fallback);
            const top = topLeft + ((topRight - topLeft) * tx);
            const bottom = bottomLeft + ((bottomRight - bottomLeft) * tx);

            return top + ((bottom - top) * ty);
        }

        function sample(x, y, options = {}) {
            const normalizedOptions = options && typeof options === 'object' ? options : {};
            const mode = normalizeMode(
                normalizedOptions.mode,
                SUPPORTED_SAMPLE_MODES,
                defaultSampleMode
            );
            const edgeMode = normalizeMode(
                normalizedOptions.edgeMode,
                SUPPORTED_EDGE_MODES,
                defaultEdgeMode
            );
            const fallback = hasOwn(normalizedOptions, 'fallback')
                ? normalizedOptions.fallback
                : defaultValue;

            if (mode === 'bilinear') {
                return sampleBilinear(x, y, edgeMode, fallback);
            }

            return sampleNearest(x, y, edgeMode, fallback);
        }

        function isAllowed(x, y, options = {}) {
            const normalizedOptions = options && typeof options === 'object' ? options : {};
            const effectiveThreshold = hasOwn(normalizedOptions, 'threshold')
                ? clampToRange(normalizedOptions.threshold, range, threshold)
                : threshold;
            return sample(x, y, normalizedOptions) >= effectiveThreshold;
        }

        function isBlocked(x, y, options = {}) {
            return !isAllowed(x, y, options);
        }

        function cloneValues() {
            return Array.from(storage);
        }

        function describe() {
            return {
                type: 'MaskField',
                fieldId,
                width,
                height,
                size,
                range: range.slice(),
                defaultValue,
                threshold,
                defaultSampleMode,
                defaultEdgeMode
            };
        }

        const field = Object.freeze({
            type: 'MaskField',
            fieldId,
            width,
            height,
            size,
            defaultValue,
            threshold,
            defaultSampleMode,
            defaultEdgeMode,
            inBounds,
            read,
            write,
            fill,
            allow,
            block,
            sample,
            isAllowed,
            isBlocked,
            cloneValues,
            describe
        });

        return field;
    }

    const MASK_FIELD_DESCRIPTOR = deepFreeze({
        type: 'MaskField',
        aliases: [
            'ConstraintField'
        ],
        deterministic: true,
        range: DEFAULT_RANGE.slice(),
        semantics: {
            allowed: 1,
            blocked: 0
        },
        defaultThreshold: DEFAULT_THRESHOLD,
        defaultSampleMode: DEFAULT_SAMPLE_MODE,
        defaultEdgeMode: DEFAULT_EDGE_MODE,
        supportedSampleModes: SUPPORTED_SAMPLE_MODES.slice(),
        supportedEdgeModes: SUPPORTED_EDGE_MODES.slice(),
        api: [
            'read',
            'write',
            'fill',
            'allow',
            'block',
            'sample',
            'isAllowed',
            'isBlocked'
        ]
    });

    function getMaskFieldDescriptor() {
        return cloneValue(MASK_FIELD_DESCRIPTOR);
    }

    function createConstraintField(options = {}) {
        return createMaskField(options);
    }

    function getConstraintFieldDescriptor() {
        return getMaskFieldDescriptor();
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('maskField', {
            entry: 'createMaskField',
            file: 'js/worldgen/macro/mask-field.js',
            description: 'Basic MaskField/ConstraintField abstraction for Phase 1 mask and restriction layers.',
            stub: false
        });
    }

    Object.assign(macro, {
        createMaskField,
        getMaskFieldDescriptor,
        createConstraintField,
        getConstraintFieldDescriptor
    });
})();
