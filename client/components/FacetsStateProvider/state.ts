import {
	FacetCascadeResult,
	FacetDefinition,
	FacetSourceScope,
	CascadedFacetsByKind,
	mapFacetDefinitions,
} from 'facets';
import { ScopeId } from 'types';
import { FacetsState, FacetState } from './types';

export type CreateStateOptions = {
	currentScope: FacetSourceScope | ScopeId;
	cascadeResults: CascadedFacetsByKind;
};

function createInitialFacetState<Def extends FacetDefinition>(
	facetDefinition: Def,
	initialCascadeResult: FacetCascadeResult<Def>,
): FacetState<Def> {
	return {
		facetDefinition,
		persistedCascadeResult: initialCascadeResult,
		cascadeResult: initialCascadeResult,
		latestAndPossiblyInvalidCascadeResult: initialCascadeResult,
		persistableChanges: {},
		invalidProps: {},
		hasInvalidChanges: false,
		hasPersistableChanges: false,
		isPersisting: false,
	};
}

const getFacetSourceScope = (scope: ScopeId): FacetSourceScope => {
	if ('pubId' in scope) {
		return { kind: 'pub', id: scope.pubId };
	}
	if ('collectionId' in scope) {
		return { kind: 'collection', id: scope.collectionId };
	}
	return { kind: 'community', id: scope.communityId };
};

export function createInitialState(options: CreateStateOptions): FacetsState {
	const { currentScope, cascadeResults } = options;
	const facets = mapFacetDefinitions((facetDefinition): FacetState<typeof facetDefinition> => {
		const cascadeResult: FacetCascadeResult<typeof facetDefinition> =
			cascadeResults[facetDefinition.name];
		return createInitialFacetState(facetDefinition, cascadeResult);
	}) as FacetsState['facets'];
	return {
		facets,
		isPersisting: false,
		hasPersistableChanges: false,
		currentScope: 'kind' in currentScope ? currentScope : getFacetSourceScope(currentScope),
	};
}
