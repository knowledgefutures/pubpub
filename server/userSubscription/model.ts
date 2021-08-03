export default (sequelize, dataTypes) => {
	return sequelize.define(
		'UserSubscription',
		{
			id: sequelize.idType,
			createdAutomatically: { type: dataTypes.BOOLEAN, allowNull: false },
			muted: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
			userId: { type: dataTypes.UUID, allowNull: false },
			pubId: { type: dataTypes.UUID },
			threadId: { type: dataTypes.UUID },
		},
		{
			indexes: [
				{ fields: ['userId'], method: 'BTREE' },
				{ fields: ['pubId'], method: 'BTREE' },
				{ fields: ['threadId'], method: 'BTREE' },
			],
			classMethods: {
				associate: (models) => {
					const { Pub, Thread, User, UserSubscription } = models;
					UserSubscription.belongsTo(Pub, {
						onDelete: 'CASCADE',
						as: 'pub',
						foreignKey: 'pubId',
					});
					UserSubscription.belongsTo(Thread, {
						onDelete: 'CASCADE',
						as: 'thread',
						foreignKey: 'threadId',
					});
					UserSubscription.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'user',
						foreignKey: 'userId',
					});
				},
			},
		},
	);
};
