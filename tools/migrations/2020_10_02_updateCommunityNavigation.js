import Bluebird from 'bluebird';

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
	return Bluebird.map(
		communities,
		(community) => {
			// eslint-disable-next-line no-param-reassign
			community.navigation = updateCommunityNavigation(community.navigation);
			return community.save();
		},
		{ concurrency: 100 },
	);
};
