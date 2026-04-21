(() => {
    const game = window.Game;
    const macro = game.systems.worldgenMacro = game.systems.worldgenMacro || {};
    const REGISTRY_ID = 'fieldDebugRegistry';
    const DEFAULT_LAYER_ID = 'scalarHeatmap';
    const FIELD_DEBUG_LAYERS = deepFreeze({
        scalarHeatmap: {
            layerId: 'scalarHeatmap',
            fieldType: 'ScalarField',
            artifactKind: 'fieldSnapshot',
            snapshotType: 'scalarHeatmap',
            builder: 'buildScalarFieldHeatmapArtifact',
            validator: 'validateScalarFieldHeatmapArtifact',
            assertion: 'assertScalarFieldHeatmapArtifact',
            contractGetter: 'getScalarFieldHeatmapArtifactContract'
        },
        directionalVectors: {
            layerId: 'directionalVectors',
            fieldType: 'DirectionalField',
            artifactKind: 'fieldSnapshot',
            snapshotType: 'directionalVectors',
            builder: 'buildDirectionalFieldVectorArtifact',
            validator: 'validateDirectionalFieldVectorArtifact',
            assertion: 'assertDirectionalFieldVectorArtifact',
            contractGetter: 'getDirectionalFieldVectorArtifactContract'
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

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function normalizeString(value, fallback = '') {
        return typeof value === 'string' && value.trim()
            ? value.trim()
            : fallback;
    }

    function readFieldType(field) {
        if (field && typeof field.describe === 'function') {
            const descriptor = field.describe();
            if (isPlainObject(descriptor) && typeof descriptor.type === 'string') {
                return descriptor.type;
            }
        }

        return normalizeString(field && field.type, '');
    }

    function getFieldDebugLayerIds() {
        return Object.keys(FIELD_DEBUG_LAYERS);
    }

    function getFieldDebugLayerRegistry() {
        return cloneValue(FIELD_DEBUG_LAYERS);
    }

    function getFieldDebugLayerEntry(layerId) {
        const normalizedLayerId = normalizeString(layerId, DEFAULT_LAYER_ID);
        return FIELD_DEBUG_LAYERS[normalizedLayerId]
            ? cloneValue(FIELD_DEBUG_LAYERS[normalizedLayerId])
            : null;
    }

    function resolveLayerIdFromField(field) {
        const fieldType = readFieldType(field);
        const matchingLayerId = getFieldDebugLayerIds().find((layerId) => (
            FIELD_DEBUG_LAYERS[layerId].fieldType === fieldType
        ));

        return matchingLayerId || DEFAULT_LAYER_ID;
    }

    function resolveLayerIdFromArtifact(artifact) {
        const snapshotType = artifact && isPlainObject(artifact.payload)
            ? normalizeString(artifact.payload.snapshotType, '')
            : '';
        const matchingLayerId = getFieldDebugLayerIds().find((layerId) => (
            FIELD_DEBUG_LAYERS[layerId].snapshotType === snapshotType
        ));

        return matchingLayerId || DEFAULT_LAYER_ID;
    }

    function resolveFieldDebugLayerId(input = {}, fallbackField = null) {
        const normalizedInput = isPlainObject(input) ? input : {};
        const explicitLayerId = normalizeString(
            normalizedInput.layerId,
            normalizeString(normalizedInput.debugLayerId, '')
        );

        if (explicitLayerId && FIELD_DEBUG_LAYERS[explicitLayerId]) {
            return explicitLayerId;
        }

        const snapshotType = normalizeString(normalizedInput.snapshotType, '');
        if (snapshotType) {
            const snapshotLayerId = getFieldDebugLayerIds().find((layerId) => (
                FIELD_DEBUG_LAYERS[layerId].snapshotType === snapshotType
            ));
            if (snapshotLayerId) {
                return snapshotLayerId;
            }
        }

        return resolveLayerIdFromField(fallbackField);
    }

    function hasLayerHint(input = {}) {
        const normalizedInput = isPlainObject(input) ? input : {};
        return Boolean(
            normalizeString(normalizedInput.layerId, '')
            || normalizeString(normalizedInput.debugLayerId, '')
            || normalizeString(normalizedInput.snapshotType, '')
        );
    }

    function requireLayerFunction(layerEntry, functionKey) {
        const functionName = layerEntry && layerEntry[functionKey];
        if (typeof macro[functionName] === 'function') {
            return macro[functionName];
        }

        throw typeof macro.createTodoContractedError === 'function'
            ? macro.createTodoContractedError(`fieldDebugRegistry.${functionKey}.${functionName}`)
            : new Error(`[worldgen/macro] Missing field debug registry function "${functionName}".`);
    }

    function buildFieldDebugArtifact(field, options = {}) {
        const layerId = resolveFieldDebugLayerId(options, field);
        const layerEntry = FIELD_DEBUG_LAYERS[layerId];
        const builder = requireLayerFunction(layerEntry, 'builder');

        return builder(field, options);
    }

    function validateFieldDebugArtifact(artifact, options = {}) {
        const layerId = hasLayerHint(options)
            ? resolveFieldDebugLayerId(options)
            : resolveLayerIdFromArtifact(artifact);
        const layerEntry = FIELD_DEBUG_LAYERS[layerId];
        const validator = requireLayerFunction(layerEntry, 'validator');

        return validator(artifact);
    }

    function assertFieldDebugArtifact(artifact, options = {}) {
        const layerId = hasLayerHint(options)
            ? resolveFieldDebugLayerId(options)
            : resolveLayerIdFromArtifact(artifact);
        const layerEntry = FIELD_DEBUG_LAYERS[layerId];
        const assertion = requireLayerFunction(layerEntry, 'assertion');

        return assertion(artifact);
    }

    const FIELD_DEBUG_REGISTRY_DESCRIPTOR = deepFreeze({
        registryId: REGISTRY_ID,
        deterministic: true,
        artifactKind: 'fieldSnapshot',
        layerIds: getFieldDebugLayerIds(),
        defaultLayerId: DEFAULT_LAYER_ID,
        layers: cloneValue(FIELD_DEBUG_LAYERS),
        api: [
            'getFieldDebugLayerIds',
            'getFieldDebugLayerRegistry',
            'getFieldDebugLayerEntry',
            'buildFieldDebugArtifact',
            'validateFieldDebugArtifact',
            'assertFieldDebugArtifact'
        ]
    });

    function getFieldDebugRegistryDescriptor() {
        return cloneValue(FIELD_DEBUG_REGISTRY_DESCRIPTOR);
    }

    if (typeof macro.registerModule === 'function') {
        macro.registerModule('fieldDebugRegistry', {
            entry: 'getFieldDebugLayerRegistry',
            file: 'js/worldgen/macro/field-debug-registry.js',
            description: 'Unified UI-free registry for Phase 1 field debug exports.',
            stub: false
        });
    }

    Object.assign(macro, {
        getFieldDebugRegistryDescriptor,
        getFieldDebugLayerIds,
        getFieldDebugLayerRegistry,
        getFieldDebugLayerEntry,
        buildFieldDebugArtifact,
        validateFieldDebugArtifact,
        assertFieldDebugArtifact
    });
})();
