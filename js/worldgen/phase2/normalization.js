(() => {
    const game = window.Game;
    const phase2 = game.systems.worldgenPhase2 = game.systems.worldgenPhase2 || {};
    const macro = game.systems.worldgenMacro || {};
    const GROUP_ID = 'normalization';
    const FIELD_NORMALIZATION_LAYER_ID = 'FieldNormalizationLayer';
    const FIELD_NORMALIZATION_LAYER_VERSION = 'phase2-field-normalization-layer-v1';
    const DEFAULT_NORMALIZER_ID = 'phase2ScalarNormalizer';
    const DEFAULT_SOURCE_RANGE = Object.freeze([0, 1]);
    const DEFAULT_TARGET_RANGE = Object.freeze([0, 1]);
    const DEFAULT_MODE = 'remapClamp';
    const SUPPORTED_MODES = Object.freeze([
        'clamp',
        'remap',
        'remapClamp'
    ]);
    const DEFAULT_CONTRAST_POLICY = Object.freeze({
        policyId: 'preserveContrast',
        midpointPivot: 0.5,
        contrastExponent: 1,
        preserveOrdering: true,
        preserveExtrema: true,
        smoothingApplied: false
    });
    const DEFAULT_PROVENANCE_TAGS = Object.freeze([
        'phase2',
        'normalization'
    ]);
    const STUB = Object.freeze({
        groupId: GROUP_ID,
        status: 'partial_implemented_contract_first',
        canonicalPath: 'js/worldgen/phase2/normalization.js',
        uiCoupling: false,
        implementsFieldLogic: false,
        purpose: 'FieldNormalizationLayer scaffold for reusable scalar normalization, provenance metadata, and contrast-preserving hooks.'
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
            ? Math.trunc(numericValue)
            : fallback;
    }

    function normalizeBoolean(value, fallback = false) {
        return typeof value === 'boolean'
            ? value
            : fallback;
    }

    function normalizeRange(range = DEFAULT_SOURCE_RANGE, fallback = DEFAULT_SOURCE_RANGE) {
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

    function clampToRange(value, range = DEFAULT_TARGET_RANGE, fallback = range[0]) {
        const normalizedRange = normalizeRange(range, DEFAULT_TARGET_RANGE);

        if (typeof macro.clampFieldValue === 'function') {
            return macro.clampFieldValue(value, normalizedRange, fallback);
        }

        const numericValue = Number(value);
        const safeValue = Number.isFinite(numericValue)
            ? numericValue
            : fallback;

        return Math.max(normalizedRange[0], Math.min(normalizedRange[1], safeValue));
    }

    function normalizeMode(value, fallback = DEFAULT_MODE) {
        const normalizedMode = normalizeString(value, fallback);
        return SUPPORTED_MODES.includes(normalizedMode)
            ? normalizedMode
            : fallback;
    }

    function normalizeTagList(value, fallback = DEFAULT_PROVENANCE_TAGS) {
        const tags = Array.isArray(value)
            ? value.map((tag) => normalizeString(tag, '')).filter(Boolean)
            : fallback.slice();

        return Array.from(new Set(tags));
    }

    function normalizePositiveNumber(value, fallback = 1) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) && numericValue > 0
            ? numericValue
            : fallback;
    }

    function roundValue(value, precision = 6) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        const safePrecision = Math.max(0, normalizeInteger(precision, 6));
        const multiplier = 10 ** safePrecision;
        return Math.round(numericValue * multiplier) / multiplier;
    }

    function inverseLerp(value, startValue, endValue, fallback = 0) {
        if (typeof macro.inverseLerpFieldValue === 'function') {
            return macro.inverseLerpFieldValue(value, startValue, endValue, fallback);
        }

        const safeValue = Number(value);
        const safeStartValue = Number(startValue);
        const safeEndValue = Number(endValue);
        const span = safeEndValue - safeStartValue;

        if (
            !Number.isFinite(safeValue)
            || !Number.isFinite(safeStartValue)
            || !Number.isFinite(safeEndValue)
            || span === 0
        ) {
            return fallback;
        }

        return (safeValue - safeStartValue) / span;
    }

    function lerp(startValue, endValue, t, fallback = startValue) {
        if (typeof macro.lerpFieldValue === 'function') {
            return macro.lerpFieldValue(startValue, endValue, t, fallback);
        }

        const safeStartValue = Number(startValue);
        const safeEndValue = Number(endValue);
        const safeT = Number(t);

        if (
            !Number.isFinite(safeStartValue)
            || !Number.isFinite(safeEndValue)
            || !Number.isFinite(safeT)
        ) {
            return Number.isFinite(fallback)
                ? fallback
                : 0;
        }

        return safeStartValue + ((safeEndValue - safeStartValue) * safeT);
    }

    function remapValue(value, sourceRange, targetRange, fallback = targetRange[0]) {
        const normalizedSourceRange = normalizeRange(sourceRange, DEFAULT_SOURCE_RANGE);
        const normalizedTargetRange = normalizeRange(targetRange, DEFAULT_TARGET_RANGE);
        const safeValue = Number.isFinite(Number(value))
            ? Number(value)
            : fallback;
        const sourceSpan = normalizedSourceRange[1] - normalizedSourceRange[0];

        if (sourceSpan <= 0) {
            return normalizedTargetRange[0];
        }

        const normalizedRatio = inverseLerp(
            safeValue,
            normalizedSourceRange[0],
            normalizedSourceRange[1],
            0
        );

        return lerp(
            normalizedTargetRange[0],
            normalizedTargetRange[1],
            normalizedRatio,
            normalizedTargetRange[0]
        );
    }

    function normalizeContrastPolicy(policy = {}) {
        const normalizedPolicy = isPlainObject(policy) ? policy : {};
        return {
            policyId: normalizeString(normalizedPolicy.policyId, DEFAULT_CONTRAST_POLICY.policyId),
            midpointPivot: clampToRange(
                normalizedPolicy.midpointPivot,
                DEFAULT_TARGET_RANGE,
                DEFAULT_CONTRAST_POLICY.midpointPivot
            ),
            contrastExponent: normalizePositiveNumber(
                normalizedPolicy.contrastExponent,
                DEFAULT_CONTRAST_POLICY.contrastExponent
            ),
            preserveOrdering: normalizeBoolean(
                normalizedPolicy.preserveOrdering,
                DEFAULT_CONTRAST_POLICY.preserveOrdering
            ),
            preserveExtrema: normalizeBoolean(
                normalizedPolicy.preserveExtrema,
                DEFAULT_CONTRAST_POLICY.preserveExtrema
            ),
            smoothingApplied: false
        };
    }

    function normalizeProvenanceDescriptor(descriptor = {}) {
        const normalizedDescriptor = isPlainObject(descriptor) ? descriptor : {};
        return deepFreeze({
            sourceId: normalizeString(normalizedDescriptor.sourceId, null),
            sourcePath: normalizeString(normalizedDescriptor.sourcePath, null),
            sourceLayerId: normalizeString(normalizedDescriptor.sourceLayerId, null),
            sourceRecordType: normalizeString(normalizedDescriptor.sourceRecordType, null),
            sourceRecordId: normalizeString(normalizedDescriptor.sourceRecordId, null),
            sourceFieldId: normalizeString(normalizedDescriptor.sourceFieldId, null),
            domainId: normalizeString(normalizedDescriptor.domainId, null),
            signalFamily: normalizeString(normalizedDescriptor.signalFamily, null),
            notes: normalizeString(normalizedDescriptor.notes, ''),
            tags: normalizeTagList(normalizedDescriptor.tags)
        });
    }

    function collectFiniteNumbers(values = []) {
        if (!Array.isArray(values)) {
            return [];
        }

        return values
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value));
    }

    function computeObservedRange(values = [], fallback = DEFAULT_SOURCE_RANGE) {
        const finiteNumbers = collectFiniteNumbers(values);
        if (!finiteNumbers.length) {
            return normalizeRange(fallback, DEFAULT_SOURCE_RANGE);
        }

        const min = finiteNumbers.reduce((currentMin, value) => Math.min(currentMin, value), Number.POSITIVE_INFINITY);
        const max = finiteNumbers.reduce((currentMax, value) => Math.max(currentMax, value), Number.NEGATIVE_INFINITY);
        return normalizeRange([min, max], fallback);
    }

    function computeSeriesStats(values = [], sourceRange) {
        const finiteNumbers = collectFiniteNumbers(values);
        const normalizedSourceRange = normalizeRange(sourceRange, DEFAULT_SOURCE_RANGE);
        const count = finiteNumbers.length;
        const observedRange = computeObservedRange(finiteNumbers, normalizedSourceRange);
        const sum = finiteNumbers.reduce((runningTotal, value) => runningTotal + value, 0);

        return deepFreeze({
            count,
            min: count ? observedRange[0] : normalizedSourceRange[0],
            max: count ? observedRange[1] : normalizedSourceRange[1],
            span: count ? roundValue(observedRange[1] - observedRange[0]) : roundValue(normalizedSourceRange[1] - normalizedSourceRange[0]),
            mean: count ? roundValue(sum / count) : roundValue(normalizedSourceRange[0]),
            sourceRange: normalizedSourceRange.slice(),
            derivedFromSeries: count > 0
        });
    }

    function resolveSourceRange(value, options = {}) {
        if (Array.isArray(options.sourceRange)) {
            return normalizeRange(options.sourceRange, DEFAULT_SOURCE_RANGE);
        }

        if (Array.isArray(value)) {
            return computeObservedRange(value, DEFAULT_SOURCE_RANGE);
        }

        return DEFAULT_SOURCE_RANGE.slice();
    }

    function toUnitInterval(value, targetRange = DEFAULT_TARGET_RANGE) {
        const normalizedTargetRange = normalizeRange(targetRange, DEFAULT_TARGET_RANGE);
        return clampToRange(
            inverseLerp(value, normalizedTargetRange[0], normalizedTargetRange[1], 0),
            DEFAULT_TARGET_RANGE,
            0
        );
    }

    function fromUnitInterval(value, targetRange = DEFAULT_TARGET_RANGE) {
        const normalizedTargetRange = normalizeRange(targetRange, DEFAULT_TARGET_RANGE);
        return lerp(
            normalizedTargetRange[0],
            normalizedTargetRange[1],
            clampToRange(value, DEFAULT_TARGET_RANGE, 0),
            normalizedTargetRange[0]
        );
    }

    // Contrast stays explicit and opt-in. This layer does not smooth or average values;
    // it preserves ordering and endpoints by default so later generators keep upstream variation.
    function applyContrastPolicy(value, targetRange = DEFAULT_TARGET_RANGE, policy = DEFAULT_CONTRAST_POLICY) {
        const normalizedTargetRange = normalizeRange(targetRange, DEFAULT_TARGET_RANGE);
        const normalizedPolicy = normalizeContrastPolicy(policy);

        if (normalizedPolicy.contrastExponent === 1) {
            return clampToRange(value, normalizedTargetRange, normalizedTargetRange[0]);
        }

        const unitValue = toUnitInterval(value, normalizedTargetRange);
        const pivot = clampToRange(normalizedPolicy.midpointPivot, DEFAULT_TARGET_RANGE, 0.5);

        if (unitValue === pivot) {
            return fromUnitInterval(unitValue, normalizedTargetRange);
        }

        if (unitValue < pivot) {
            const leftSpan = Math.max(pivot, Number.EPSILON);
            const distanceFromPivot = (pivot - unitValue) / leftSpan;
            const adjustedDistance = Math.pow(distanceFromPivot, normalizedPolicy.contrastExponent);
            return fromUnitInterval(pivot - (adjustedDistance * leftSpan), normalizedTargetRange);
        }

        const rightSpan = Math.max(1 - pivot, Number.EPSILON);
        const distanceFromPivot = (unitValue - pivot) / rightSpan;
        const adjustedDistance = Math.pow(distanceFromPivot, normalizedPolicy.contrastExponent);
        return fromUnitInterval(pivot + (adjustedDistance * rightSpan), normalizedTargetRange);
    }

    function normalizeScalarValue(value, options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const sourceRange = resolveSourceRange(value, normalizedOptions);
        const targetRange = normalizeRange(normalizedOptions.targetRange, DEFAULT_TARGET_RANGE);
        const mode = normalizeMode(normalizedOptions.mode, DEFAULT_MODE);
        const fallback = hasOwn(normalizedOptions, 'fallback')
            ? normalizedOptions.fallback
            : targetRange[0];

        if (mode === 'clamp') {
            return clampToRange(value, targetRange, fallback);
        }

        const remappedValue = remapValue(value, sourceRange, targetRange, fallback);
        const normalizedValue = mode === 'remap'
            ? remappedValue
            : clampToRange(remappedValue, targetRange, fallback);

        return applyContrastPolicy(
            normalizedValue,
            targetRange,
            normalizedOptions.contrastPolicy
        );
    }

    function buildNormalizationProvenance(value, normalizedValue, options = {}, sourceRange, targetRange) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const contrastPolicy = normalizeContrastPolicy(normalizedOptions.contrastPolicy);
        const provenanceDescriptor = normalizeProvenanceDescriptor(normalizedOptions.provenance);

        return deepFreeze({
            layerId: FIELD_NORMALIZATION_LAYER_ID,
            layerVersion: FIELD_NORMALIZATION_LAYER_VERSION,
            normalizerId: normalizeString(normalizedOptions.normalizerId, DEFAULT_NORMALIZER_ID),
            sourceValue: normalizeNumber(value, 0),
            normalizedValue: roundValue(normalizedValue),
            sourceRange: normalizeRange(sourceRange, DEFAULT_SOURCE_RANGE),
            targetRange: normalizeRange(targetRange, DEFAULT_TARGET_RANGE),
            mode: normalizeMode(normalizedOptions.mode, DEFAULT_MODE),
            contrastPolicy,
            preservesContrast: contrastPolicy.preserveOrdering === true,
            smoothingApplied: false,
            provenance: provenanceDescriptor
        });
    }

    // Provenance remains attached to normalized values so later binding, validation,
    // and debug passes can explain origin without turning normalization into gameplay truth.
    function normalizeScalarWithProvenance(value, options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const sourceRange = resolveSourceRange(value, normalizedOptions);
        const targetRange = normalizeRange(normalizedOptions.targetRange, DEFAULT_TARGET_RANGE);
        const normalizedValue = normalizeScalarValue(value, {
            ...normalizedOptions,
            sourceRange,
            targetRange
        });

        return deepFreeze({
            normalizedValue: roundValue(normalizedValue),
            provenance: buildNormalizationProvenance(
                value,
                normalizedValue,
                normalizedOptions,
                sourceRange,
                targetRange
            )
        });
    }

    function normalizeScalarSeries(values = [], options = {}) {
        const normalizedValues = Array.isArray(values) ? values.slice() : [];
        const normalizedOptions = isPlainObject(options) ? options : {};
        const sourceRange = resolveSourceRange(normalizedValues, normalizedOptions);
        const targetRange = normalizeRange(normalizedOptions.targetRange, DEFAULT_TARGET_RANGE);
        const seriesStats = computeSeriesStats(normalizedValues, sourceRange);
        const normalizedEntries = normalizedValues.map((value, index) => {
            const entryOptions = {
                ...normalizedOptions,
                sourceRange,
                targetRange,
                provenance: {
                    ...(isPlainObject(normalizedOptions.provenance) ? normalizedOptions.provenance : {}),
                    tags: normalizeTagList(
                        isPlainObject(normalizedOptions.provenance)
                            ? normalizedOptions.provenance.tags
                            : DEFAULT_PROVENANCE_TAGS
                    ),
                    notes: normalizeString(
                        isPlainObject(normalizedOptions.provenance)
                            ? normalizedOptions.provenance.notes
                            : '',
                        ''
                    )
                }
            };

            const entry = normalizeScalarWithProvenance(value, entryOptions);
            return deepFreeze({
                index,
                sourceValue: normalizeNumber(value, 0),
                normalizedValue: entry.normalizedValue,
                provenance: deepFreeze({
                    ...cloneValue(entry.provenance),
                    sourceIndex: index
                })
            });
        });

        return deepFreeze({
            layerId: FIELD_NORMALIZATION_LAYER_ID,
            layerVersion: FIELD_NORMALIZATION_LAYER_VERSION,
            normalizerId: normalizeString(normalizedOptions.normalizerId, DEFAULT_NORMALIZER_ID),
            sourceRange: sourceRange.slice(),
            targetRange: targetRange.slice(),
            mode: normalizeMode(normalizedOptions.mode, DEFAULT_MODE),
            contrastPolicy: normalizeContrastPolicy(normalizedOptions.contrastPolicy),
            preservesContrast: true,
            smoothingApplied: false,
            sourceStats: seriesStats,
            normalizedEntries,
            normalizedValues: normalizedEntries.map((entry) => entry.normalizedValue)
        });
    }

    function createPhase2ScalarNormalizer(options = {}) {
        const normalizedOptions = isPlainObject(options) ? options : {};
        const normalizerId = normalizeString(normalizedOptions.normalizerId, DEFAULT_NORMALIZER_ID);
        const sourceRange = resolveSourceRange([], normalizedOptions);
        const targetRange = normalizeRange(normalizedOptions.targetRange, DEFAULT_TARGET_RANGE);
        const mode = normalizeMode(normalizedOptions.mode, DEFAULT_MODE);
        const contrastPolicy = normalizeContrastPolicy(normalizedOptions.contrastPolicy);
        const provenanceDescriptor = normalizeProvenanceDescriptor(normalizedOptions.provenance);

        function normalizeValue(value, valueOptions = {}) {
            const normalizedValueOptions = isPlainObject(valueOptions) ? valueOptions : {};
            return normalizeScalarValue(value, {
                ...normalizedOptions,
                ...normalizedValueOptions,
                normalizerId,
                sourceRange: hasOwn(normalizedValueOptions, 'sourceRange')
                    ? normalizedValueOptions.sourceRange
                    : sourceRange,
                targetRange: hasOwn(normalizedValueOptions, 'targetRange')
                    ? normalizedValueOptions.targetRange
                    : targetRange,
                mode: hasOwn(normalizedValueOptions, 'mode')
                    ? normalizedValueOptions.mode
                    : mode,
                contrastPolicy: hasOwn(normalizedValueOptions, 'contrastPolicy')
                    ? normalizedValueOptions.contrastPolicy
                    : contrastPolicy,
                provenance: hasOwn(normalizedValueOptions, 'provenance')
                    ? normalizedValueOptions.provenance
                    : provenanceDescriptor
            });
        }

        function normalizeValueWithProvenance(value, valueOptions = {}) {
            const normalizedValueOptions = isPlainObject(valueOptions) ? valueOptions : {};
            return normalizeScalarWithProvenance(value, {
                ...normalizedOptions,
                ...normalizedValueOptions,
                normalizerId,
                sourceRange: hasOwn(normalizedValueOptions, 'sourceRange')
                    ? normalizedValueOptions.sourceRange
                    : sourceRange,
                targetRange: hasOwn(normalizedValueOptions, 'targetRange')
                    ? normalizedValueOptions.targetRange
                    : targetRange,
                mode: hasOwn(normalizedValueOptions, 'mode')
                    ? normalizedValueOptions.mode
                    : mode,
                contrastPolicy: hasOwn(normalizedValueOptions, 'contrastPolicy')
                    ? normalizedValueOptions.contrastPolicy
                    : contrastPolicy,
                provenance: hasOwn(normalizedValueOptions, 'provenance')
                    ? normalizedValueOptions.provenance
                    : provenanceDescriptor
            });
        }

        function normalizeSeries(values = [], seriesOptions = {}) {
            const normalizedSeriesOptions = isPlainObject(seriesOptions) ? seriesOptions : {};
            return normalizeScalarSeries(values, {
                ...normalizedOptions,
                ...normalizedSeriesOptions,
                normalizerId,
                sourceRange: hasOwn(normalizedSeriesOptions, 'sourceRange')
                    ? normalizedSeriesOptions.sourceRange
                    : sourceRange,
                targetRange: hasOwn(normalizedSeriesOptions, 'targetRange')
                    ? normalizedSeriesOptions.targetRange
                    : targetRange,
                mode: hasOwn(normalizedSeriesOptions, 'mode')
                    ? normalizedSeriesOptions.mode
                    : mode,
                contrastPolicy: hasOwn(normalizedSeriesOptions, 'contrastPolicy')
                    ? normalizedSeriesOptions.contrastPolicy
                    : contrastPolicy,
                provenance: hasOwn(normalizedSeriesOptions, 'provenance')
                    ? normalizedSeriesOptions.provenance
                    : provenanceDescriptor
            });
        }

        function describe() {
            return deepFreeze({
                layerId: FIELD_NORMALIZATION_LAYER_ID,
                layerVersion: FIELD_NORMALIZATION_LAYER_VERSION,
                normalizerId,
                sourceRange: sourceRange.slice(),
                targetRange: targetRange.slice(),
                mode,
                contrastPolicy: cloneValue(contrastPolicy),
                provenance: cloneValue(provenanceDescriptor),
                supportedModes: SUPPORTED_MODES.slice(),
                preservesContrast: true,
                smoothingApplied: false
            });
        }

        return deepFreeze({
            normalizeValue,
            normalizeValueWithProvenance,
            normalizeSeries,
            describe
        });
    }

    function getPhase2FieldNormalizationLayerDescriptor() {
        return deepFreeze({
            layerId: FIELD_NORMALIZATION_LAYER_ID,
            layerVersion: FIELD_NORMALIZATION_LAYER_VERSION,
            phaseId: 'PHASE_2',
            status: 'scaffold_ready',
            deterministic: true,
            uiCoupling: false,
            canonicalPath: STUB.canonicalPath,
            supportedModes: SUPPORTED_MODES.slice(),
            defaultSourceRange: DEFAULT_SOURCE_RANGE.slice(),
            defaultTargetRange: DEFAULT_TARGET_RANGE.slice(),
            defaultContrastPolicy: cloneValue(DEFAULT_CONTRAST_POLICY),
            defaultProvenanceTags: DEFAULT_PROVENANCE_TAGS.slice(),
            preservesContrastByDefault: true,
            smoothingApplied: false,
            contractFirst: true,
            api: [
                'createPhase2ScalarNormalizer',
                'normalizePhase2ScalarValue',
                'normalizePhase2ScalarWithProvenance',
                'normalizePhase2ScalarSeries'
            ]
        });
    }

    function getPhase2NormalizationModuleStub() {
        return STUB;
    }

    phase2.__contractFirstStubs = phase2.__contractFirstStubs || {};
    phase2.__contractFirstStubs[GROUP_ID] = STUB;
    phase2.normalization = deepFreeze({
        getPhase2NormalizationModuleStub,
        getPhase2FieldNormalizationLayerDescriptor,
        createPhase2ScalarNormalizer,
        normalizePhase2ScalarValue: normalizeScalarValue,
        normalizePhase2ScalarWithProvenance: normalizeScalarWithProvenance,
        normalizePhase2ScalarSeries: normalizeScalarSeries
    });

    Object.assign(phase2, {
        getPhase2NormalizationModuleStub,
        getPhase2FieldNormalizationLayerDescriptor,
        createPhase2ScalarNormalizer,
        normalizePhase2ScalarValue: normalizeScalarValue,
        normalizePhase2ScalarWithProvenance: normalizeScalarWithProvenance,
        normalizePhase2ScalarSeries: normalizeScalarSeries
    });
})();
