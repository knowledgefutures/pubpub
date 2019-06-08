export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define(
		'Discussion',
		{
			id: sequelize.idType,
			title: { type: Sequelize.TEXT },
			threadNumber: { type: Sequelize.INTEGER, allowNull: false },
			text: { type: Sequelize.TEXT },
			content: { type: Sequelize.JSONB },
			attachments: { type: Sequelize.JSONB },
			suggestions: { type: Sequelize.JSONB },
			highlights: { type: Sequelize.JSONB },
			submitHash: { type: Sequelize.TEXT }, // Deprecated since v5
			submitApprovedAt: { type: Sequelize.DATE }, // Deprecated since v5
			isArchived: { type: Sequelize.BOOLEAN },
			labels: { type: Sequelize.JSONB },

			/* Set by Associations */
			userId: { type: Sequelize.UUID, allowNull: false },
			pubId: { type: Sequelize.UUID, allowNull: false },
			communityId: { type: Sequelize.UUID, allowNull: false },
			branchId: { type: Sequelize.UUID }, // Should be allowNull: false after migration
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
