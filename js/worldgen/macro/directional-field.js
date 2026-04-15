(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const DEFAULT_SAMPLE_MODE = 'nearest';
    const DEFAULT_EDGE_MODE = 'clamp';
    const SUPPORTED_SAMPLE_MODES = Object.freeze([
        'nearest',
        'bilinear'
    ]);
    const SUPPORTED_EDGE_MODES = Object.freeze([
        'clamp',
        'zero'
    ]);
    const ZERO_DIRECTION = Object.freeze({
        x: 0,
        y: 0
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

    function normalizeInteger(value, fallback = 0) {
        return Number.isFinite(value)
            ? Math.max(0, Math.trunc(value))
            : fallback;
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

    function createDirection(x = 0, y = 0) {
        return {
            x: Number.isFinite(x) ? x : 0,
            y: Number.isFinite(y) ? y : 0
        };
    }

    function normalizeDirection(directionLike, fallback = ZERO_DIRECTION) {
        const normalizedFallback = createDirection(fallback.x, fallback.y);
        let x = normalizedFallback.x;
        let y = normalizedFallback.y;

        if (Array.isArray(directionLike)) {
            x = Number(directionLike[0]);
            y = Number(directionLike[1]);
        } else if (directionLike && typeof directionLike === 'object') {
            x = Number(directionLike.x);
            y = Number(directionLike.y);
        }

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return normalizedFallback;
        }

        const magnitude = Math.hypot(x, y);
        if (magnitude <= 0) {
            return ZERO_DIRECTION;
        }

        return {
            x: x / magnitude,
            y: y / magnitude
        };
    }

    function createDirectionalField(options = {}) {
        const normalizedOptions = options && typeof options === 'object' ? options : {};
        const width = normalizeInteger(normalizedOptions.width, 0);
        const height = normalizeInteger(normalizedOptions.height, 0);
        const size = width * height;
        const fieldId = normalizeString(normalizedOptions.fieldId, 'directionalField');
        const defaultDirection = normalizeDirection(normalizedOptions.defaultDirection, ZERO_DIRECTION);
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
        const xStorage = new Float32Array(size);
        const yStorage = new Float32Array(size);

        if (defaultDirection.x !== 0 || defaultDirection.y !== 0) {
            xStorage.fill(defaultDirection.x);
            yStorage.fill(defaultDirection.y);
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

        function read(x, y, fallback = defaultDirection) {
            const normalizedX = Math.trunc(x);
            const normalizedY = Math.trunc(y);
            if (!inBounds(normalizedX, normalizedY)) {
                return normalizeDirection(fallback, defaultDirection);
            }

            const index = toIndex(normalizedX, normalizedY);
            return createDirection(xStorage[index], yStorage[index]);
        }

        function write(x, y, directionLike) {
            const normalizedX = Math.trunc(x);
            const normalizedY = Math.trunc(y);
            if (!inBounds(normalizedX, normalizedY)) {
                return false;
            }

            const normalizedDirection = normalizeDirection(directionLike, defaultDirection);
            const index = toIndex(normalizedX, normalizedY);
            xStorage[index] = normalizedDirection.x;
            yStorage[index] = normalizedDirection.y;
            return true;
        }

        function fill(directionLike = defaultDirection) {
            const normalizedDirection = normalizeDirection(directionLike, defaultDirection);
            xStorage.fill(normalizedDirection.x);
            yStorage.fill(normalizedDirection.y);
            return field;
        }

        function readWithEdgeMode(x, y, edgeMode, fallback = defaultDirection) {
            if (inBounds(x, y)) {
                return read(x, y, fallback);
            }

            if (edgeMode === 'zero') {
                return ZERO_DIRECTION;
            }

            if (width <= 0 || height <= 0) {
                return normalizeDirection(fallback, defaultDirection);
            }

            const clampedX = Math.max(0, Math.min(width - 1, Math.trunc(x)));
            const clampedY = Math.max(0, Math.min(height - 1, Math.trunc(y)));
            return read(clampedX, clampedY, fallback);
        }

        function sampleNearest(x, y, edgeMode, fallback = defaultDirection) {
            const nearestX = Math.round(Number(x));
            const nearestY = Math.round(Number(y));
            return readWithEdgeMode(nearestX, nearestY, edgeMode, fallback);
        }

        function sampleBilinear(x, y, edgeMode, fallback = defaultDirection) {
            const normalizedX = Number(x);
            const normalizedY = Number(y);

            if (!Number.isFinite(normalizedX) || !Number.isFinite(normalizedY)) {
                return normalizeDirection(fallback, defaultDirection);
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
            const top = createDirection(
                topLeft.x + ((topRight.x - topLeft.x) * tx),
                topLeft.y + ((topRight.y - topLeft.y) * tx)
            );
            const bottom = createDirection(
                bottomLeft.x + ((bottomRight.x - bottomLeft.x) * tx),
                bottomLeft.y + ((bottomRight.y - bottomLeft.y) * tx)
            );

            return normalizeDirection({
                x: top.x + ((bottom.x - top.x) * ty),
                y: top.y + ((bottom.y - top.y) * ty)
            }, fallback);
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
                : defaultDirection;

            if (mode === 'bilinear') {
                return sampleBilinear(x, y, edgeMode, fallback);
            }

            return sampleNearest(x, y, edgeMode, fallback);
        }

        function cloneVectors() {
            return {
                x: Array.from(xStorage),
                y: Array.from(yStorage)
            };
        }

        function hasOwn(objectValue, key) {
            return Boolean(objectValue) && Object.prototype.hasOwnProperty.call(objectValue, key);
        }

        function describe() {
            return {
                type: 'DirectionalField',
                fieldId,
                width,
                height,
                size,
                defaultDirection: cloneValue(defaultDirection),
                defaultSampleMode,
                defaultEdgeMode
            };
        }

        const field = Object.freeze({
            type: 'DirectionalField',
            fieldId,
            width,
            height,
            size,
            defaultDirection: deepFreeze(cloneValue(defaultDirection)),
            defaultSampleMode,
            defaultEdgeMode,
            inBounds,
            read,
            write,
            fill,
            sample,
            cloneVectors,
            describe
        });

        return field;
    }

    const DIRECTIONAL_FIELD_DESCRIPTOR = deepFreeze({
        type: 'DirectionalField',
        deterministic: true,
        storage: 'normalized xy vector pair',
        defaultSampleMode: DEFAULT_SAMPLE_MODE,
        defaultEdgeMode: DEFAULT_EDGE_MODE,
        supportedSampleModes: SUPPORTED_SAMPLE_MODES.slice(),
        supportedEdgeModes: SUPPORTED_EDGE_MODES.slice(),
        api: [
            'read',
            'write',
            'fill',
            'sample'
        ]
    });

    function getDirectionalFieldDescriptor() {
        return cloneValue(DIRECTIONAL_FIELD_DESCRIPTOR);
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('directionalField', {
            entry: 'createDirectionalField',
            file: 'js/worldgen/macro/directional-field.js',
            description: 'Basic DirectionalField abstraction for Phase 1 vector direction storage and sampling.',
            stub: false
        });
    }

    Object.assign(macro, {
        createDirectionalField,
        getDirectionalFieldDescriptor
    });
})();
