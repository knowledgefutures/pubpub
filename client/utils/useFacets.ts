import { useCallback, useContext, useMemo, useRef } from 'react';

import { FacetsContext, FacetsState, FacetState } from 'components';
import { CascadedFacetType, FacetName, Facets } from 'facets';

const throwFacetsStateError = (): never => {
	throw new Error(`Must call useFacets beneath FacetsStateProvider`);
};

export const useFacetsState = () => {
	const actuallyUseFacets = useContext(FacetsContext);
	if (!actuallyUseFacets) {
		throwFacetsStateError();
	}
	return actuallyUseFacets!();
};

type FacetsQueryLevel =
	// The state of the facet that the server has
	| 'persisted'
	// The latest _validated_ client-side version of the facet
	| 'current'
	// The latest client-side version of the facet, possibly including invalid props
	| 'latest';

type FacetsQueryable = { [K in keyof Facets]: CascadedFacetType<Facets[K]> };

type UseFacetsQueryOptions<T> = {
	// Return a value if the FacetsStateProvider is not available.
	fallback?: () => T;
	// Which version of the facet we want to look at
	// Most consumers will want 'current' unless they deal with editing facet state.
	level?: FacetsQueryLevel;
};

const getQueryableObjectForLevel = (state: FacetState, level: FacetsQueryLevel) => {
	const { persistedCascadeResult, cascadeResult, latestAndPossiblyInvalidCascadeResult } = state;
	if (level === 'current') {
		return cascadeResult;
	}
	if (level === 'persisted') {
		return persistedCascadeResult;
	}
	return latestAndPossiblyInvalidCascadeResult;
};

export const useFacetsQuery = <T>(
	query: (f: FacetsQueryable) => T,
	options: UseFacetsQueryOptions<T> = {},
): T => {
	const { fallback, level = 'current' } = options;
	const actuallyUseFacets = useContext(FacetsContext);

	// This is a kind of silly escape hatch to plumb values from pickFromStore() to queryProxy.
	// It lets us cache the queryProxy Proxy object instead of frequently creating new ones.
	const latestState = useRef<null | FacetsState>(null);

	if (!actuallyUseFacets) {
		if (fallback) {
			return fallback();
		}
		throwFacetsStateError();
	}

	// This appears to violate the Rules of Hooks by calling useMemo conditionally, but for the
	// lifetime of the hook, actuallyUseFacets will never change, so we'll either always call
	// this hook, or never call it.
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const queryProxy = useMemo(
		() =>
			new Proxy({} as FacetsQueryable, {
				get: (_, facetName: FacetName) => {
					const facetState = latestState.current!.facets[facetName];
					return getQueryableObjectForLevel(facetState, level).value;
				},
			}),
		[level],
	);

	// (Same as above)
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const pickFromStore = useCallback(
		(state: FacetsState) => {
			latestState.current = state;
			const queriedState = query(queryProxy);
			return queriedState;
		},
		[queryProxy, query],
	);

	return actuallyUseFacets!(pickFromStore);
};
