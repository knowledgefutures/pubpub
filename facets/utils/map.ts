import type { Writeable } from 'types';

import { ALL_FACET_DEFINITIONS, Facets } from '../definitions';
import type { FacetDefinition, FacetCascadeResult } from '../core';

const skipIterationSymbol = Symbol('skip');
type SkipIterationSymbol = typeof skipIterationSymbol;

type FacetDefinitionMapper<ToType> = (
	def: FacetDefinition,
	skip: SkipIterationSymbol,
) => ToType | SkipIterationSymbol;

export function mapFacetDefinitions<ToType>(mapper: FacetDefinitionMapper<ToType>) {
	type ReturnType = Partial<Writeable<{ [K in keyof Facets]: ToType }>>;
	const result: ReturnType = {};
	Object.values(ALL_FACET_DEFINITIONS).forEach((facet) => {
		const mapResult = mapper(facet, skipIterationSymbol);
		if (mapResult !== skipIterationSymbol) {
			result[facet.name as keyof Facets] = mapResult;
		}
	});
	return result as ReturnType;
}

type FacetDefinitionToCascadedInstanceMapper = (
	def: FacetDefinition,
	skip: SkipIterationSymbol,
) => FacetCascadeResult<any> | SkipIterationSymbol;

export function mapFacetDefinitionsToCascadedInstances(
	mapper: FacetDefinitionToCascadedInstanceMapper,
) {
	return mapFacetDefinitions(mapper) as Partial<{
		[K in keyof Facets]: FacetCascadeResult<Facets[K]>;
	}>;
}
