/**
 * Renders a submission for a journal article within a journal, possibly including journal issue
 * data derived from an optional collection.
 */
import journal from '../schema/journal';
import journalArticle from '../schema/journalArticle';
import journalIssue from '../schema/journalIssue';

import transformCommunity from '../transform/community';
import transformCollection from '../transform/collection';
import transformPub from '../transform/pub';

export default ({ globals, community, collection, pub }) => {
	const communityProps = transformCommunity({ globals })(community, collection);
	const pubProps = pub && transformPub({ globals, community })(pub);
	const collectionProps = collection && transformCollection({ globals, community })(collection);
	return journal({
		...communityProps,
		issn: collectionProps && collectionProps.issn,
		timestamp: globals.timestamp,
		children: {
			...(collectionProps && journalIssue(collectionProps)),
			...(pubProps && journalArticle(pubProps)),
		},
	});
};
