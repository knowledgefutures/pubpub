import { CitationStyle } from './citationStyle';
import { License } from './license';
import { NodeLabels } from './nodeLabels';
import { PubEdgeDisplay } from './pubEdgeDisplay';
import { PubHeaderTheme } from './pubHeaderTheme';

export const ALL_FACET_DEFINITIONS = {
	CitationStyle,
	License,
	NodeLabels,
	PubEdgeDisplay,
	PubHeaderTheme,
} as const;

export const ALL_FACET_NAMES = Object.keys(ALL_FACET_DEFINITIONS) as FacetName[];

export type Facets = typeof ALL_FACET_DEFINITIONS;
export type FacetName = keyof Facets;
export type Facet<Name extends FacetName = FacetName> = Facets[Name];

export * from './citationStyle';
export * from './license';
export * from './nodeLabels';
export * from './pubEdgeDisplay';
export * from './pubHeaderTheme';
