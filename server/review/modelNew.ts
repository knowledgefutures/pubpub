export default (sequelize, dataTypes) => {
	return sequelize.define(
		'ReviewNew',
		{
			id: sequelize.idType,
			title: { type: dataTypes.TEXT },
			number: { type: dataTypes.INTEGER, allowNull: false },
			status: {
				type: dataTypes.ENUM,
				values: ['open', 'closed', 'completed'],
				defaultValue: 'open',
			},
			releaseRequested: { type: dataTypes.BOOLEAN },
			labels: { type: dataTypes.JSONB },
			/* Set by Associations */
			/* branchId should eventually be allowNull: false I think */
			/* branchId is the id of the review branch, not the source branch (which */
			/* must always be the draft of the associated pub) */
			branchId: { type: dataTypes.UUID },
			threadId: { type: dataTypes.UUID, allowNull: false },
			visibilityId: { type: dataTypes.UUID, allowNull: false },
			userId: { type: dataTypes.UUID, allowNull: false },
			pubId: { type: dataTypes.UUID },
		},
		{
			indexes: [
				{ fields: ['userId'], method: 'BTREE' },
				{ fields: ['pubId'], method: 'BTREE' },
			],
			classMethods: {
				associate: (models) => {
					const { ReviewNew, Branch, Visibility, Pub, User, Thread } = models;
					ReviewNew.belongsTo(Branch, {
						onDelete: 'CASCADE',
						as: 'branch',
						foreignKey: 'branchId',
					});
					ReviewNew.belongsTo(Thread, {
						onDelete: 'CASCADE',
						as: 'thread',
						foreignKey: 'threadId',
					});
					ReviewNew.belongsTo(Visibility, {
						onDelete: 'CASCADE',
						as: 'visibility',
						foreignKey: 'visibilityId',
					});
					ReviewNew.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'author',
						foreignKey: 'userId',
					});
					ReviewNew.belongsTo(Pub, {
						onDelete: 'CASCADE',
						as: 'pub',
						foreignKey: 'pubId',
					});
				},
			},
		},
	);
};
