import zodToJsonSchema from 'zod-to-json-schema';

import { JSON } from 'types';

import { FacetDefinition } from './facet';
import { FacetPropType } from './propType';

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
