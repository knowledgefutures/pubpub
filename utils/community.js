export const defaultFooterLinks = [
	{ id: 'rss', title: 'RSS', href: '/rss.xml' },
	{ id: 'legal', title: 'Legal', href: '/legal' },
];

export const populateSocialItems = (communityData) => {
	return [
		{
			id: 'si-0',
			icon: 'globe',
			title: 'Website',
			value: communityData.website,
			url: communityData.website,
		},
		{
			id: 'si-1',
			icon: 'twitter',
			title: 'Twitter',
			value: communityData.twitter,
			url: `https://twitter.com/${communityData.twitter}`,
		},
		{
			id: 'si-2',
			icon: 'facebook',
			title: 'Facebook',
			value: communityData.facebook,
			url: `https://facebook.com/${communityData.facebook}`,
		},
		{
			id: 'si-3',
			icon: 'envelope',
			title: 'Contact',
			value: communityData.email,
			url: `mailto:${communityData.email}`,
		},
	].filter((item) => {
		return item.value;
	});
};

export const populateNavigationIds = function(collections, navigation) {
	const collectionsObject = {};
	collections.forEach((item) => {
		collectionsObject[item.id] = item;
	});
	return navigation
		.map((item) => {
			if (item.children) {
				return {
					...item,
					children: item.children
						.map((child) => {
							return typeof child === 'string' ? collectionsObject[child] : child;
						})
						.filter((child) => {
							return !!child;
						}),
				};
			}
			if (typeof item.href === 'string') {
				return item;
			}
			return collectionsObject[item];
		})
		.filter((item) => {
			if (!item) {
				return false;
			}
			if (item.children && !item.children.length) {
				return false;
			}
			return true;
		});
};
