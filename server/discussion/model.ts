export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Discussion',
		{
			id: sequelize.idType,
			title: { type: dataTypes.TEXT },
			threadNumber: { type: dataTypes.INTEGER, allowNull: false },
			text: { type: dataTypes.TEXT },
			content: { type: dataTypes.JSONB },
			attachments: { type: dataTypes.JSONB },
			suggestions: { type: dataTypes.JSONB },
			highlights: { type: dataTypes.JSONB },
			isArchived: { type: dataTypes.BOOLEAN },
			labels: { type: dataTypes.JSONB },
			initAnchorText: { type: dataTypes.JSONB },
			isPublic: { type: dataTypes.BOOLEAN },
			initBranchId: { type: dataTypes.UUID },

			/* Set by Associations */
			userId: { type: dataTypes.UUID, allowNull: false },
			pubId: { type: dataTypes.UUID },
			collectionId: { type: dataTypes.UUID },
			communityId: { type: dataTypes.UUID },
			organizationId: { type: dataTypes.UUID },
			branchId: { type: dataTypes.UUID }, // Should be allowNull: false after migration
		},
		{
			indexes: [
				{ fields: ['userId'], method: 'BTREE' },
				{ fields: ['pubId'], method: 'BTREE' },
				{ fields: ['communityId'], method: 'BTREE' },
			],
			classMethods: {
				associate: (models) => {
					const { Discussion, Community, Pub, User, Branch } = models;
					Discussion.belongsTo(Community, {
						onDelete: 'CASCADE',
						as: 'community',
						foreignKey: 'communityId',
					});
					Discussion.belongsTo(Pub, {
						onDelete: 'CASCADE',
						as: 'pub',
						foreignKey: 'pubId',
					});
					Discussion.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'author',
						foreignKey: 'userId',
					});
					Discussion.belongsTo(Branch, {
						onDelete: 'CASCADE',
						as: 'branch',
						foreignKey: 'branchId',
					});
				},
			},
		},
	);
};
