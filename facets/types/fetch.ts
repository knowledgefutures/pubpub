import { Writeable, FacetBinding, DefinitelyHas } from 'types';

import { FacetCascadeResult, FacetDefinition, FacetInstanceType } from '../core';
import { FacetName, Facets, Facet } from '../definitions';
import { ByScopeKind } from './scopes';

export type CascadedFacetsByKind = Writeable<{
	[K in keyof Facets]?: FacetCascadeResult<Facets[K]>;
}>;

export type FacetBindings = ByScopeKind<Record<string, FacetBinding[]>>;

export type CascadedFacetsByScopeId<FacetNames extends FacetName> = Record<
	string,
	DefinitelyHas<CascadedFacetsByKind, FacetNames>
>;

export type CascadedFacetsForScopes<FacetNames extends FacetName> = ByScopeKind<
	CascadedFacetsByScopeId<FacetNames>
>;

export type ByFacetKind<T> = Writeable<{ [K in keyof Facets]?: T }>;

export type FacetInstancesByBindingId<Def extends FacetDefinition> = Record<
	string,
	FacetInstanceType<Def>
>;

export type FacetInstancesByKind = ByFacetKind<FacetInstancesByBindingId<Facet>>;
