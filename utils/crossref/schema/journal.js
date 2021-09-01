import { renderJournalCitation } from 'utils/citations';
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
	kind,
}) => ({
	journal: {
		journal_metadata: {
			'@language': language,
			full_title: renderJournalCitation(kind, citeAs, title),
			...(issn ? { '@media_type': 'electronic', '#text': issn } : {}),
			...doiData(doi, timestamp, url, contentVersion),
		},
		...children,
	},
});
