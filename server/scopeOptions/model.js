export default (sequelize, dataTypes) => {
	return sequelize.define('ScopeOptions', {
		id: sequelize.idType,
		isPublicBranches: { type: dataTypes.BOOLEAN },
		isPublicDiscussions: { type: dataTypes.BOOLEAN },
		isPublicReviews: { type: dataTypes.BOOLEAN },

		/* Set by Associations */
		pubId: { type: dataTypes.UUID },
		collectionId: { type: dataTypes.UUID },
		communityId: { type: dataTypes.UUID },
		organizationId: { type: dataTypes.UUID },
	});
};
