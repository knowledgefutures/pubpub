import { mapFacet } from './map';
import { FacetDefinition, FacetInstance } from './facet';

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
