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
					const { ReviewNew, Visibility, Pub, User, Thread } = models;
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
