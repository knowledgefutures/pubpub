export default (sequelize, dataTypes) => {
	return sequelize.define('ScopeOptions', {
		id: sequelize.idType,
		isPublicBranches: { type: dataTypes.BOOLEAN }, // can the public see all branches
		isPublicDiscussions: { type: dataTypes.BOOLEAN }, // can the public create new discussions
		isPublicReviews: { type: dataTypes.BOOLEAN }, // can the public create new reviews

		/* Set by Associations */
		pubId: { type: dataTypes.UUID },
		collectionId: { type: dataTypes.UUID },
		communityId: { type: dataTypes.UUID },
		organizationId: { type: dataTypes.UUID },
	});
};
