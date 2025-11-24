import type { FacetDefinition, FacetInstance } from './facet';

import { mapFacet } from './map';

export function createEmptyFacetInstance<Definition extends FacetDefinition>(
	definition: Definition,
): FacetInstance<Definition> {
	return mapFacet(definition, () => null);
}

export function createFacetInstance<Definition extends FacetDefinition>(
	definition: Definition,
	values: Partial<FacetInstance<Definition>> = {},
): FacetInstance<Definition> {
	return {
		...createEmptyFacetInstance(definition),
		...values,
	};
}
