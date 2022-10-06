import { Op } from 'sequelize';

import * as types from 'types';
import { FacetBinding } from 'server/models';
import { flattenOnce, pruneFalsyValues } from 'utils/arrays';
import {
	ALL_FACET_NAMES,
	cascade,
	createByScopeKind,
	FacetCascadeResult,
	FacetDefinition,
	FacetInstanceStack,
	FacetName,
	FacetSourceScope,
	getBindingKeyForScopeKind,
	getSourceScope,
	mapByScopeKind,
	mapFacetDefinitions,
	mapFacetDefinitionsToCascadedInstances,
	ScopeKind,
	SingleScopeId,
} from 'facets';
import {
	CascadedFacetsByKind,
	FacetBindings,
	FacetInstancesByBindingId,
	CascadedFacetsForScopes,
	FacetInstancesByKind,
} from 'facets/types/fetch';
import { mapObject } from 'utils/objects';

import { ResolvedScopeIds, resolveScopeIds, ScopeIdsByKind, ScopeStack } from './resolveScopeIds';
import { loadFacetInstancesForBindingIds } from './load';

const cascadeSingleFacetForScopeStack = <Def extends FacetDefinition>(
	scopeStack: ScopeStack,
	def: Def,
	bindings: FacetBindings,
	instances: FacetInstancesByBindingId<Def>,
): FacetCascadeResult<Def> => {
	const instanceStack: FacetInstanceStack<Def> = flattenOnce(
		scopeStack.map((scope) => {
			const bindingsForScope = bindings[scope.kind][scope.id];
			return pruneFalsyValues(
				bindingsForScope.map((binding) => {
					const boundInstance = instances[binding.id];
					if (boundInstance) {
						return {
							scope,
							value: boundInstance,
							facetBindingId: binding.id,
						};
					}
					return null;
				}),
			);
		}),
	);
	return cascade(def, instanceStack);
};

const cascadeFacetsForScopeStack = (
	stack: ScopeStack,
	bindings: FacetBindings,
	instances: FacetInstancesByKind,
): CascadedFacetsByKind => {
	return mapFacetDefinitionsToCascadedInstances((def, skip) => {
		const instancesForFacetDefinition = instances[def.name as keyof FacetName];
		if (instancesForFacetDefinition) {
			return cascadeSingleFacetForScopeStack(
				stack,
				def,
				bindings,
				instancesForFacetDefinition,
			);
		}
		return skip;
	});
};

const getFacetBindingsForResolvedScopeIds = async (
	resolvedScopeIds: ResolvedScopeIds,
): Promise<{ facetBindings: FacetBindings; facetBindingIds: string[] }> => {
	const { scopeIdsIncludingDependencies } = resolvedScopeIds;
	const {
		pub: pubIds = [],
		collection: collectionIds = [],
		community: communityIds = [],
	} = scopeIdsIncludingDependencies;
	const facetBindingInstances: types.FacetBinding[] = await FacetBinding.findAll({
		where: {
			[Op.or]: [
				{ pubId: pubIds },
				{ collectionId: collectionIds },
				{ communityId: communityIds },
			],
		},
	});
	const facetBindingIds = facetBindingInstances.map((binding) => binding.id);
	const facetBindings = mapByScopeKind(
		scopeIdsIncludingDependencies,
		(scopeIds: string[], scopeKind: ScopeKind) => {
			const bindingKey = getBindingKeyForScopeKind(scopeKind);
			const bindingsByScopeId: Record<string, types.FacetBinding[]> = {};
			scopeIds.forEach((scopeId) => {
				bindingsByScopeId[scopeId] = facetBindingInstances.filter(
					(instance) => instance[bindingKey] === scopeId,
				);
			});
			return bindingsByScopeId;
		},
	);
	return { facetBindings, facetBindingIds };
};

const getFacetInstancesForBindingIds = async <FacetNames extends FacetName>(
	facetBindingIds: string[],
	facetNames: FacetNames[],
): Promise<types.DefinitelyHas<FacetInstancesByKind, FacetNames>> => {
	const facetInstances: FacetInstancesByKind = {};
	await Promise.all(
		Object.values(
			mapFacetDefinitions(async (definition) => {
				const { name } = definition;
				if (facetNames.includes(name as any)) {
					facetInstances[name] = await loadFacetInstancesForBindingIds(
						definition,
						facetBindingIds,
					);
				}
			}),
		),
	);
	return facetInstances as types.DefinitelyHas<FacetInstancesByKind, FacetNames>;
};

const fetchFacetsForResolvedScopeIds = async <FacetNames extends FacetName>(
	resolvedScopeIds: ResolvedScopeIds,
	facetNames: FacetNames[],
): Promise<CascadedFacetsForScopes<FacetNames>> => {
	const { scopeStacks } = resolvedScopeIds;
	const { facetBindings, facetBindingIds } = await getFacetBindingsForResolvedScopeIds(
		resolvedScopeIds,
	);
	const facetInstances = await getFacetInstancesForBindingIds(facetBindingIds, facetNames);
	const cascadedFacets = mapByScopeKind(
		scopeStacks,
		(scopeStacksByScopeId: Record<string, ScopeStack>) => {
			return mapObject(scopeStacksByScopeId, (stack: ScopeStack) => {
				return cascadeFacetsForScopeStack(stack, facetBindings, facetInstances);
			});
		},
	);
	return cascadedFacets as CascadedFacetsForScopes<FacetNames>;
};

export const fetchFacetsForScopeIds = async <FacetNames extends FacetName>(
	requestedScopes: Partial<ScopeIdsByKind>,
	facetNames?: FacetNames[],
): Promise<CascadedFacetsForScopes<FacetNames>> => {
	const resolvedScopeIds = await resolveScopeIds(requestedScopes);
	return fetchFacetsForResolvedScopeIds(resolvedScopeIds, facetNames ?? ALL_FACET_NAMES);
};

const resolveFacetSourceScope = (scope: SingleScopeId | FacetSourceScope): FacetSourceScope => {
	if ('kind' in scope) {
		return scope;
	}
	return getSourceScope(scope);
};

export const fetchFacetsForScope = async <FacetNames extends FacetName>(
	scope: SingleScopeId | FacetSourceScope,
	facetNames?: FacetNames[],
): Promise<types.DefinitelyHas<CascadedFacetsByKind, FacetNames>> => {
	const { kind, id } = resolveFacetSourceScope(scope);
	const scopeIds = createByScopeKind<string[]>(() => []);
	scopeIds[kind].push(id);
	const fetchResult = await fetchFacetsForScopeIds(scopeIds, facetNames);
	return fetchResult[kind][id];
};
