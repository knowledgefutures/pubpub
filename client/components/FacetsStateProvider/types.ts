import {
	FacetCascadeResult,
	FacetDefinition,
	FacetInstance,
	FacetSourceScope,
	Facets,
} from 'facets';

import { bindActionsToStore } from './actions';

export type FacetState<Def extends FacetDefinition = FacetDefinition> = {
	facetDefinition: Def;
	persistedCascadeResult: FacetCascadeResult<Def>;
	cascadeResult: FacetCascadeResult<Def>;
	latestAndPossiblyInvalidCascadeResult: FacetCascadeResult<Def>;
	persistableChanges: Partial<FacetInstance<Def>>;
	invalidProps: Partial<Record<keyof FacetInstance<Def>, true>>;
	hasInvalidChanges: boolean;
	hasPersistableChanges: boolean;
	isPersisting: boolean;
};

export type FacetsState = {
	currentScope: FacetSourceScope;
	facets: { [K in keyof Facets]: FacetState<Facets[K]> };
	isPersisting: boolean;
	hasPersistableChanges: boolean;
};

export type FacetsStore = FacetsState & ReturnType<typeof bindActionsToStore>;
