import sanitizePub from './pubSanitize';

export default (initialData, overviewData) => {
	const isCommunityAdmin = initialData.scopeData.activePermissions.canAdminCommunity;
	const sanitizedPubs = overviewData.pubs
		.map((pub) => {
			return sanitizePub(pub, initialData);
		})
		.filter((pub) => {
			return !!pub;
		});
	const sanitizedCollections = overviewData.collections.filter((item) => {
		return isCommunityAdmin || item.isPublic;
	});

	return {
		...overviewData,
		pubs: sanitizedPubs,
		collections: sanitizedCollections,
	};
};
