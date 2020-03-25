export default (collection, initialData) => {
	/* Collection access is granted when */
	/* 1. it is public collection, or */
	/* 2. the user is a communityAdmin, or */
	/* 3. the user has explicit permissions on the collection */

	const { activePermissions, memberData } = initialData.scopeData;
	const { canAdminCommunity } = activePermissions;
	const hasCollectionAccess = memberData.find((member) => {
		return member.collectionId === collection.id;
	});
	const hasAccess = canAdminCommunity || !!hasCollectionAccess || collection.isPublic;
	return hasAccess ? collection : null;
};
