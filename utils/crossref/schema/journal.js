import doiData from './doiData';

export default ({ title, issn, language, children, doi, timestamp, url, contentVersion }) => ({
	journal: {
		journal_metadata: {
			'@language': language,
			full_title: title,
			...(issn ? { '@media_type': 'electronic', '#text': issn } : {}),
			...doiData(doi, timestamp, url, contentVersion),
		},
		...children,
	},
});
