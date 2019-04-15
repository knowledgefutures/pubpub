import metadataSchemas, { getSchemaForKind } from './schemas';

const isNullOrUndefined = (val) => val === null || val === undefined;

export const mapMetadataFields = (kind, fn) => {
	const schema = getSchemaForKind(kind);
	const res = {};
	schema.metadata.forEach((field) => {
		const result = fn(field);
		if (typeof result !== 'undefined') {
			res[field.name] = result;
		}
	});
	return res;
};

export const getAllSchemaKinds = () => metadataSchemas.map((s) => s.kind);

export const normalizeMetadataToKind = (metadata, kind, context) =>
	mapMetadataFields(kind, (field) => {
		const { name, derivedFrom, defaultDerivedFrom } = field;
		if (derivedFrom) {
			const derived = derivedFrom(context);
			if (!isNullOrUndefined(derived)) {
				return derived;
			}
		}
		const existingValue = metadata[name];
		if (!isNullOrUndefined(existingValue)) {
			return existingValue;
		}
		if (defaultDerivedFrom) {
			return defaultDerivedFrom(context);
		}
		return undefined;
	});

export const deserializeMetadata = ({ metadata, kind, fallback }) =>
	mapMetadataFields(kind, (field) => {
		const { name, type } = field;
		if (metadata[name]) {
			if (type) {
				return type.deserialize(metadata[name]);
			}
			return metadata[name];
		}
		if (fallback) {
			return fallback(field);
		}
		return undefined;
	});

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
