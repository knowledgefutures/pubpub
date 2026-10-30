/**
 * Renders a submission for a journal article within a journal, possibly including journal issue
 * data derived from an optional collection.
 */
import journal from '../schema/journal';
import journalArticle from '../schema/journalArticle';
import journalIssue from '../schema/journalIssue';

import normalizeIssn from '../transform/issn';
import transformCommunity from '../transform/community';
import transformCollection from '../transform/collection';
import transformPub from '../transform/pub';

/**
 * A community can publish more than one journal, so an issue's own ISSNs and journal title win
 * over the community's. The issue's ISSNs are taken as a pair, never mixed with the community's,
 * since they may belong to a different journal. The server checks each ISSN against Crossref
 * before sending (server/doi/issnGate.ts).
 */
const getIssueJournal = (collectionProps) => {
	if (!collectionProps) return {};
	const electronicIssn = normalizeIssn(collectionProps.electronicIssn);
	const printIssn = normalizeIssn(collectionProps.printIssn);
	const journalTitle = collectionProps.journalTitle?.trim();
	return {
		...((electronicIssn || printIssn) && { electronicIssn, printIssn }),
		...(journalTitle && { journalTitle }),
	};
};

export default ({ globals, community, collection, pub }) => {
	const communityProps = transformCommunity({ globals })(community, collection);
	const pubProps = pub && transformPub({ globals, community })(pub);
	const collectionProps = collection && transformCollection({ globals, community })(collection);
	return journal({
		...communityProps,
		...getIssueJournal(collectionProps),
		timestamp: globals.timestamp,
		children: {
			...(collectionProps && journalIssue(collectionProps)),
			...(pubProps && journalArticle(pubProps)),
		},
	});
};
