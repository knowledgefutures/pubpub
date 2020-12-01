export default (communityData, locationData, loginData, scopeData) => {
	const cleanedData = { ...communityData };
	const { canManageCommunity } = scopeData.activePermissions;
	const availablePages = {};

	cleanedData.collections = cleanedData.collections
		.filter((item) => {
			/* Collection access is granted when */
			/* 1. it is public collection, or */
			/* 2. the user is a community manager, or */
			/* 3. the user has explicit permissions on the collection */
			const hasCollectionMemberAccess = item.members.find((member) => {
				return member.userId === loginData.id;
			});
			return canManageCommunity || item.isPublic || hasCollectionMemberAccess;
		})
		.map((collection) => {
			if (!collection.pageId) {
				return collection;
			}
			return {
				...collection,
				page: availablePages[collection.pageId],
			};
		});

	cleanedData.pages = cleanedData.pages.filter((item) => {
		const pageCollection = cleanedData.collections.find(
			({ pageId }) => typeof pageId === 'string' && pageId === item.id,
		);

		// If the page has a collection, check if the user has explicit permission
		// to that collection. If so, include the page.
		const hasPageCollectionManageAccess = pageCollection
			? pageCollection.members.some((member) => member.userId === loginData.id)
			: false;

		if (
			!canManageCommunity &&
			!hasPageCollectionManageAccess &&
			!item.isPublic &&
			locationData.query.access !== item.viewHash
		) {
			return false;
		}

		availablePages[item.id] = {
			id: item.id,
			title: item.title,
			slug: item.slug,
		};
		return true;
	});

	return cleanedData;
};
