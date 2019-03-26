import metadataSchemas, { getSchemaForKind } from './schemas';

export const getAllSchemaKinds = () => metadataSchemas.map((s) => s.kind);

export const normalizeMetadataToKind = (metadata, kind, context) => {
	const schema = getSchemaForKind(kind);
	const res = {};
	schema.metadata.forEach((field) => {
		const { name, derivedFrom, defaultDerivedFrom } = field;
		if (derivedFrom) {
			res[name] = derivedFrom(context);
		} else {
			const existingValue = metadata[name];
			if (typeof existingValue !== 'undefined') {
				res[name] = existingValue;
			} else if (defaultDerivedFrom) {
				res[name] = defaultDerivedFrom(context);
			}
		}
	});
	return res;
};

export const enumerateMetadataFields = (metadata, kind) => {
	const { metadata: shape } = getSchemaForKind(kind);
	return shape.map((field) => {
		const { name } = field;
		return {
			...field,
			value: metadata[name],
		};
	});
};
