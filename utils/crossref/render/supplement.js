/**
 * Renders a preprint for a journal article.
 */
import componentList from '../schema/componentList';

import transformCommunity from '../transform/community';
import transformPub from '../transform/pub';

export default ({ globals, community, pub, parentDoi }) => {
	const communityProps = transformCommunity({ globals: globals })(community);
	const pubProps = pub && transformPub({ globals: globals, community: community })(pub);
	return {
		sa_component: {
			'@parent_doi': parentDoi,
			...componentList({
				...communityProps,
				timestamp: globals.timestamp,
				...pubProps,
			}),
		},
	};
};
