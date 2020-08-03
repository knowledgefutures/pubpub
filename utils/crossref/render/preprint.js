/**
 * Renders a preprint for a journal article.
 */
import postedContent from '../schema/postedContent';

import transformCommunity from '../transform/community';
import transformPub from '../transform/pub';

export default ({ globals, community, pub }) => {
	const communityProps = transformCommunity({ globals: globals })(community);
	const pubProps = pub && transformPub({ globals: globals, community: community })(pub);
	return postedContent({
		...communityProps,
		timestamp: globals.timestamp,
		...pubProps,
	});
};
