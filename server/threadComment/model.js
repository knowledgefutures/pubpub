export default (sequelize, dataTypes) => {
	return sequelize.define(
		'ThreadComment',
		{
			id: sequelize.idType,
			// title: { type: dataTypes.TEXT },
			// threadNumber: { type: dataTypes.INTEGER, allowNull: false },
			text: { type: dataTypes.TEXT },
			content: { type: dataTypes.JSONB },
			// attachments: { type: dataTypes.JSONB },
			// suggestions: { type: dataTypes.JSONB },
			// highlights: { type: dataTypes.JSONB },
			// isArchived: { type: dataTypes.BOOLEAN },
			// labels: { type: dataTypes.JSONB },
			// initAnchorText: { type: dataTypes.JSONB },
			// isPublic: { type: dataTypes.BOOLEAN },
			// initBranchId: { type: dataTypes.UUID },

			/* Set by Associations */
			userId: { type: dataTypes.UUID, allowNull: false },
			threadId: { type: dataTypes.UUID, allowNull: false },
			// collectionId: { type: dataTypes.UUID },
			// communityId: { type: dataTypes.UUID },
			// organizationId: { type: dataTypes.UUID },
			// branchId: { type: dataTypes.UUID }, // Should be allowNull: false after migration
		},
		{
			classMethods: {
				associate: (models) => {
					const { ThreadComment, User } = models;
					ThreadComment.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'author',
						foreignKey: 'userId',
					});
				},
			},
		},
	);
};
