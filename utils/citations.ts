export type CitationStyleKind =
	| 'acm-siggraph'
	| 'american-anthro'
	| 'apa'
	| 'apa-7'
	| 'arcadia-science'
	| 'cell'
	| 'chicago'
	| 'harvard'
	| 'elife'
	| 'frontiers'
	| 'mla'
	| 'vancouver'
	| 'ama';

type CitationStyle = {
	name: string;
	key: CitationStyleKind;
	path: string;
};

export type CitationInlineStyleKind = 'count' | 'authorYear' | 'author' | 'label';

type CitationInlineStyle = {
	key: CitationInlineStyleKind;
	title: string;
	example?: string;
};

export const citationStyles: CitationStyle[] = [
	{ key: 'acm-siggraph', name: 'ACM SIGGRAPH', path: './citeStyles/acm-siggraph.csl' },
	{
		key: 'american-anthro',
		name: 'American Anthropological Association',
		path: './citeStyles/american-anthropological-association.csl',
	},
	{ key: 'apa', name: 'APA 6th Edition', path: './citeStyles/apa-6th-edition.csl' },
	{
		key: 'apa-7',
		name: 'APA 7th Edition',
		path: './citeStyles/apa-7th-edition.csl',
	},
	{ key: 'arcadia-science', name: 'Arcadia Science', path: './citeStyles/arcadia-science.csl' },
	{ key: 'cell', name: 'Cell', path: './citeStyles/cell.csl' },
	{ key: 'chicago', name: 'Chicago', path: './citeStyles/chicago-author-date.csl' },
	{ key: 'harvard', name: 'Harvard', path: './citeStyles/harvard-cite-them-right.csl' },
	{ key: 'elife', name: 'ELife', path: './citeStyles/elife.csl' },
	{ key: 'frontiers', name: 'Frontiers', path: './citeStyles/frontiers.csl' },
	{ key: 'mla', name: 'MLA', path: './citeStyles/modern-language-association.csl' },
	{ key: 'ama', name: 'AMA', path: './citeStyles/american-medical-association.csl' },
	{ key: 'vancouver', name: 'Vancouver', path: './citeStyles/vancouver.csl' },
];

export const citationInlineStyles: CitationInlineStyle[] = [
	{ key: 'count', title: 'Count', example: '[1]' },
	{ key: 'authorYear', title: 'Author-Year', example: '(Goodall, 1995)' },
	{ key: 'author', title: 'Author', example: '(Goodall)' },
	{ key: 'label', title: 'Label', example: '(bibtexKey)' },
];

export const renderJournalCitation = (kind, citation, communityTitle) => {
	if (kind === 'issue') {
		return citation || communityTitle;
	}
	return communityTitle;
};

export const renderJournalCitationForCitations = (kind, citation, communityTitle) => {
	return { 'container-title': renderJournalCitation(kind, citation, communityTitle) };
};
