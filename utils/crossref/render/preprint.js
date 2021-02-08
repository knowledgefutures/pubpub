/**
 * Renders a preprint for a journal article.
 */
import postedContent from '../schema/postedContent';

import transformCommunity from '../transform/community';
import transformPub from '../transform/pub';

export default ({ globals, community, pub }) => {
	const communityProps = transformCommunity({ globals })(community);
	const pubProps = pub && transformPub({ globals, community })(pub);
	return postedContent({
		...communityProps,
		timestamp: globals.timestamp,
		...pubProps,
	});
};
