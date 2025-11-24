import type { JSON } from 'types';

import type { FacetDefinition } from './facet';
import type { FacetPropType } from './propType';

import zodToJsonSchema from 'zod-to-json-schema';

type CanonicalizedProp = JSON & {
	postgresType: string;
	schema: JSON;
};

export type CanonicalizedFacet = JSON & {
	name: string;
	props: Record<string, CanonicalizedProp>;
};

export function canonicalizeFacetPropType<P extends FacetPropType>(propType: P): CanonicalizedProp {
	const { postgresType, schema, name } = propType;
	return {
		postgresType,
		schema: zodToJsonSchema(schema, name) as JSON,
	};
}

export function canonicalizeFacet<D extends FacetDefinition>(definition: D): CanonicalizedFacet {
	const { name, props } = definition;
	const canonicalizedProps: Record<string, CanonicalizedProp> = {};
	Object.entries(props).forEach(([key, prop]) => {
		canonicalizedProps[key] = canonicalizeFacetPropType(prop.propType);
	});
	return { name, props: canonicalizedProps };
}
