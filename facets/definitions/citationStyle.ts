import { facet, prop, choice } from '../core';

export const citationStyleKind = choice([
	'acm-siggraph',
	'american-anthro',
	'apa',
	'apa-7',
	'arcadia-science',
	'cell',
	'chicago',
	'harvard',
	'elife',
	'frontiers',
	'mla',
	'vancouver',
	'ama',
]);

export const inlineCitationStyleKind = choice(['count', 'authorYear', 'author', 'label']);

export const CitationStyle = facet({
	name: 'CitationStyle',
	label: 'Citation styles',
	props: {
		citationStyle: prop(citationStyleKind, {
			rootValue: 'apa' as const,
			label: 'Citation style',
		}),
		inlineCitationStyle: prop(inlineCitationStyleKind, {
			rootValue: 'count' as const,
			label: 'Inline citation style',
		}),
	},
});
