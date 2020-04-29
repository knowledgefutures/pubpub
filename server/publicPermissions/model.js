export default (sequelize, dataTypes) => {
	return sequelize.define(
		'PublicPermissions',
		{
			id: sequelize.idType,
			canCreateForks: { type: dataTypes.BOOLEAN },
			canCreateReviews: { type: dataTypes.BOOLEAN },
			canCreateDiscussions: { type: dataTypes.BOOLEAN },
			canViewDraft: { type: dataTypes.BOOLEAN },
			canEditDraft: { type: dataTypes.BOOLEAN },

			/* Set by Associations */
			pubId: { type: dataTypes.UUID },
			collectionId: { type: dataTypes.UUID },
			communityId: { type: dataTypes.UUID },
			organizationId: { type: dataTypes.UUID },
		},
		{
			classMethods: {
				associate: (models) => {
					const { PublicPermissions, Pub } = models;
					PublicPermissions.belongsTo(Pub, {
						onDelete: 'CASCADE',
						as: 'pub',
						foreignKey: 'pubId',
					});
				},
			},
		},
	);
};
