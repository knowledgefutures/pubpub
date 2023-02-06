import { FacetDefinition, FacetInstance } from 'facets/core';

export type FacetBinding = {
	communityId: null | string;
	collectionId: null | string;
	pubId: null | string;
	id: string;
};

export type FacetInstanceWithBinding<Def extends FacetDefinition> = FacetInstance<Def> & {
	facetBinding: FacetBinding;
};

export type PostgresDatatype = 'text' | 'boolean' | 'integer' | 'double' | 'varchar' | 'jsonb';
