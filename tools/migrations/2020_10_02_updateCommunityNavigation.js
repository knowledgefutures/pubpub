import { asyncMap } from 'utils/async';

const updateCommunityNavigation = (navigation) => {
	return navigation.map((item) => {
		if (item.children) {
			return {
				...item,
				children: updateCommunityNavigation(item.children),
			};
		}
		if (typeof item === 'string') {
			return { type: 'page', id: item };
		}
		return item;
	});
};

module.exports = async ({ models }) => {
	const { Community } = models;
	const communities = await Community.findAll();
	return asyncMap(
		communities,
		(community) => {
			community.navigation = updateCommunityNavigation(community.navigation);
			if (community.footerLinks) {
				community.footerLinks = updateCommunityNavigation(community.footerLinks);
			}
			return community.save();
		},
		{ concurrency: 100 },
	);
};
