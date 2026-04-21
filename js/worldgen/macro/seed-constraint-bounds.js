(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const DEFAULT_CONSTRAINT_MIDPOINT = 0.5;
    const PHASE1_SEED_CONSTRAINT_BOUNDS = deepFreeze({
        conflictPressure: {
            min: 0,
            max: 1,
            defaultValue: DEFAULT_CONSTRAINT_MIDPOINT,
            normalization: 'clamp',
            affectsLayers: Object.freeze(['physical', 'macro'])
        },
        maritimeDependence: {
            min: 0,
            max: 1,
            defaultValue: DEFAULT_CONSTRAINT_MIDPOINT,
            normalization: 'clamp',
            affectsLayers: Object.freeze(['physical', 'macro'])
        },
        environmentalVolatility: {
            min: 0,
            max: 1,
            defaultValue: DEFAULT_CONSTRAINT_MIDPOINT,
            normalization: 'clamp',
            affectsLayers: Object.freeze(['physical', 'macro'])
        },
        coastJaggedness: {
            min: 0,
            max: 1,
            defaultValue: DEFAULT_CONSTRAINT_MIDPOINT,
            normalization: 'clamp',
            affectsLayers: Object.freeze(['physical', 'macro'])
        },
        collapseIntensity: {
            min: 0,
            max: 1,
            defaultValue: DEFAULT_CONSTRAINT_MIDPOINT,
            normalization: 'clamp',
            affectsLayers: Object.freeze(['physical', 'macro'])
        }
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

    function getPhase1SeedConstraintFieldIds() {
        return Object.keys(PHASE1_SEED_CONSTRAINT_BOUNDS);
    }

    function getPhase1SeedConstraintDescriptor(fieldId) {
        if (!hasOwn(PHASE1_SEED_CONSTRAINT_BOUNDS, fieldId)) {
            throw new Error(`[worldgen/macro] Unknown Phase 1 seed constraint field "${fieldId}".`);
        }

        return cloneValue(PHASE1_SEED_CONSTRAINT_BOUNDS[fieldId]);
    }

    function getPhase1SeedConstraintBounds() {
        return cloneValue(PHASE1_SEED_CONSTRAINT_BOUNDS);
    }

    function normalizePhase1SeedConstraintValue(fieldId, value, boundsOverride = {}) {
        const baseDescriptor = getPhase1SeedConstraintDescriptor(fieldId);
        const normalizedBoundsOverride = isPlainObject(boundsOverride) ? boundsOverride : {};
        const min = Number.isFinite(normalizedBoundsOverride.min)
            ? normalizedBoundsOverride.min
            : baseDescriptor.min;
        const max = Number.isFinite(normalizedBoundsOverride.max)
            ? normalizedBoundsOverride.max
            : baseDescriptor.max;
        const defaultValue = Number.isFinite(normalizedBoundsOverride.defaultValue)
            ? normalizedBoundsOverride.defaultValue
            : baseDescriptor.defaultValue;
        const numericValue = Number(value);

        if (!Number.isFinite(numericValue)) {
            return Math.max(min, Math.min(max, defaultValue));
        }

        return Math.max(min, Math.min(max, numericValue));
    }

    function createDefaultPhase1SeedConstraints(overrides = {}) {
        const normalizedOverrides = isPlainObject(overrides) ? overrides : {};

        return getPhase1SeedConstraintFieldIds().reduce((constraints, fieldId) => {
            constraints[fieldId] = normalizePhase1SeedConstraintValue(
                fieldId,
                normalizedOverrides[fieldId]
            );
            return constraints;
        }, {});
    }

    function normalizePhase1SeedConstraints(input = {}, options = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const normalizedOptions = isPlainObject(options) ? options : {};
        const boundsOverrides = isPlainObject(normalizedOptions.bounds)
            ? normalizedOptions.bounds
            : {};

        return getPhase1SeedConstraintFieldIds().reduce((constraints, fieldId) => {
            constraints[fieldId] = normalizePhase1SeedConstraintValue(
                fieldId,
                normalizedInput[fieldId],
                boundsOverrides[fieldId]
            );
            return constraints;
        }, {});
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('seedConstraintBounds', {
            entry: 'getPhase1SeedConstraintBounds',
            file: 'js/worldgen/macro/seed-constraint-bounds.js',
            description: 'Default bounds and normalization helpers for Phase 1 physical+macro seed constraints.',
            stub: false
        });
    }

    Object.assign(macro, {
        getPhase1SeedConstraintFieldIds,
        getPhase1SeedConstraintDescriptor,
        getPhase1SeedConstraintBounds,
        createDefaultPhase1SeedConstraints,
        normalizePhase1SeedConstraintValue,
        normalizePhase1SeedConstraints
    });
})();
