import doiData from './doiData';

export default ({
	title,
	citeAs,
	issn,
	language,
	children,
	doi,
	timestamp,
	url,
	contentVersion,
}) => ({
	journal: {
		journal_metadata: {
			'@language': language,
			full_title: citeAs || title,
			...(issn ? { '@media_type': 'electronic', '#text': issn } : {}),
			...doiData(doi, timestamp, url, contentVersion),
		},
		...children,
	},
});
