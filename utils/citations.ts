type CitationStyle = {
	name: string;
	key: string;
	path?: string;
};

export const citationStyles: CitationStyle[] = [
	{ key: 'acm-siggraph', name: 'ACM SIGGRAPH', path: './citeStyles/acm-siggraph.csl' },
	{
		key: 'american-anthro',
		name: 'American Anthropological Association',
		path: './citeStyles/american-anthropological-association.csl',
	},
	{ key: 'apa', name: 'APA 6th Edition' },
	{
		key: 'apa-7',
		name: 'APA 7th Edition',
		path: './citeStyles/apa-7.csl',
	},
	{ key: 'cell', name: 'Cell', path: './citeStyles/cell.csl' },
	{ key: 'chicago', name: 'Chicago', path: './citeStyles/chicago-author-date.csl' },
	{ key: 'harvard', name: 'Harvard' },
	{ key: 'elife', name: 'ELife', path: './citeStyles/elife.csl' },
	{ key: 'frontiers', name: 'Frontiers', path: './citeStyles/frontiers.csl' },
	{ key: 'mla', name: 'MLA', path: './citeStyles/modern-language-association.csl' },
	{ key: 'vancouver', name: 'Vancouver' },
];
