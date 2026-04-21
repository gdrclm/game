(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const DEFAULT_FIELD_RANGE = Object.freeze([0, 1]);
    const DEFAULT_FIELD_SAMPLE_MODE = 'nearest';
    const DEFAULT_FIELD_EDGE_MODE = 'clamp';
    const SUPPORTED_FIELD_SAMPLE_MODES = Object.freeze([
        'nearest',
        'bilinear'
    ]);
    const SUPPORTED_FIELD_EDGE_MODES = Object.freeze([
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

    function normalizeString(value, fallback) {
        return typeof value === 'string' && value.trim()
            ? value.trim()
            : fallback;
    }

    function normalizeFieldRange(range = DEFAULT_FIELD_RANGE, fallback = DEFAULT_FIELD_RANGE) {
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

    function clampFieldValue(value, range = DEFAULT_FIELD_RANGE, fallback = range[0]) {
        const normalizedRange = normalizeFieldRange(range, DEFAULT_FIELD_RANGE);
        const numericValue = Number(value);
        const safeValue = Number.isFinite(numericValue)
            ? numericValue
            : fallback;

        return Math.max(normalizedRange[0], Math.min(normalizedRange[1], safeValue));
    }

    function normalizeFieldSampleMode(value, fallback = DEFAULT_FIELD_SAMPLE_MODE) {
        const normalizedValue = normalizeString(value, fallback);
        return SUPPORTED_FIELD_SAMPLE_MODES.includes(normalizedValue)
            ? normalizedValue
            : fallback;
    }

    function normalizeFieldEdgeMode(value, fallback = DEFAULT_FIELD_EDGE_MODE) {
        const normalizedValue = normalizeString(value, fallback);
        return SUPPORTED_FIELD_EDGE_MODES.includes(normalizedValue)
            ? normalizedValue
            : fallback;
    }

    function lerpFieldValue(startValue, endValue, t, fallback = startValue) {
        const safeStartValue = Number(startValue);
        const safeEndValue = Number(endValue);
        const safeT = Number(t);

        if (!Number.isFinite(safeStartValue) || !Number.isFinite(safeEndValue) || !Number.isFinite(safeT)) {
            return Number.isFinite(fallback)
                ? fallback
                : 0;
        }

        return safeStartValue + ((safeEndValue - safeStartValue) * safeT);
    }

    function inverseLerpFieldValue(value, startValue, endValue, fallback = 0) {
        const safeValue = Number(value);
        const safeStartValue = Number(startValue);
        const safeEndValue = Number(endValue);

        if (!Number.isFinite(safeValue) || !Number.isFinite(safeStartValue) || !Number.isFinite(safeEndValue)) {
            return Number.isFinite(fallback)
                ? fallback
                : 0;
        }

        const span = safeEndValue - safeStartValue;
        if (span === 0) {
            return Number.isFinite(fallback)
                ? fallback
                : 0;
        }

        return (safeValue - safeStartValue) / span;
    }

    function bilinearInterpolateFieldValue(topLeft, topRight, bottomLeft, bottomRight, tx, ty, fallback = 0) {
        const safeTopLeft = Number(topLeft);
        const safeTopRight = Number(topRight);
        const safeBottomLeft = Number(bottomLeft);
        const safeBottomRight = Number(bottomRight);
        const safeTx = Number(tx);
        const safeTy = Number(ty);

        if (
            !Number.isFinite(safeTopLeft)
            || !Number.isFinite(safeTopRight)
            || !Number.isFinite(safeBottomLeft)
            || !Number.isFinite(safeBottomRight)
            || !Number.isFinite(safeTx)
            || !Number.isFinite(safeTy)
        ) {
            return Number.isFinite(fallback)
                ? fallback
                : 0;
        }

        const top = lerpFieldValue(safeTopLeft, safeTopRight, safeTx, safeTopLeft);
        const bottom = lerpFieldValue(safeBottomLeft, safeBottomRight, safeTx, safeBottomLeft);
        return lerpFieldValue(top, bottom, safeTy, top);
    }

    const FIELD_HELPER_DESCRIPTOR = deepFreeze({
        type: 'FieldHelpers',
        deterministic: true,
        intendedLayers: [
            'physical',
            'macro'
        ],
        defaultRange: DEFAULT_FIELD_RANGE.slice(),
        defaultSampleMode: DEFAULT_FIELD_SAMPLE_MODE,
        defaultEdgeMode: DEFAULT_FIELD_EDGE_MODE,
        supportedSampleModes: SUPPORTED_FIELD_SAMPLE_MODES.slice(),
        supportedEdgeModes: SUPPORTED_FIELD_EDGE_MODES.slice(),
        api: [
            'normalizeFieldRange',
            'clampFieldValue',
            'normalizeFieldSampleMode',
            'normalizeFieldEdgeMode',
            'lerpFieldValue',
            'inverseLerpFieldValue',
            'bilinearInterpolateFieldValue'
        ]
    });

    function getFieldHelperDescriptor() {
        return cloneValue(FIELD_HELPER_DESCRIPTOR);
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('fieldHelpers', {
            entry: 'getFieldHelperDescriptor',
            file: 'js/worldgen/macro/field-helpers.js',
            description: 'Reusable deterministic field helpers for sampling, clamping, and interpolation.',
            stub: false
        });
    }

    Object.assign(macro, {
        getFieldHelperDescriptor,
        normalizeFieldRange,
        clampFieldValue,
        normalizeFieldSampleMode,
        normalizeFieldEdgeMode,
        lerpFieldValue,
        inverseLerpFieldValue,
        bilinearInterpolateFieldValue
    });
})();
