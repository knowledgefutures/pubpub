import { renderJournalCitation } from 'utils/citations';
import doiData from './doiData';

const issnElements = (electronicIssn, printIssn) => {
	const issn = [
		printIssn && printIssn !== electronicIssn && { '@media_type': 'print', '#text': printIssn },
		electronicIssn && { '@media_type': 'electronic', '#text': electronicIssn },
	].filter(Boolean);
	return issn.length ? { issn } : {};
};

export default ({
	title,
	citeAs,
	journalTitle,
	electronicIssn,
	printIssn,
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
			full_title: journalTitle || renderJournalCitation(kind, citeAs, title),
			...issnElements(electronicIssn, printIssn),
			...doiData(doi, timestamp, url, contentVersion),
		},
		...children,
	},
});
