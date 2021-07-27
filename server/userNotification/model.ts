export default (sequelize, dataTypes) => {
	return sequelize.define(
		'UserNotification',
		{
			id: sequelize.idType,
			userId: { type: dataTypes.UUID, allowNull: false },
			userSubscriptionId: { type: dataTypes.UUID, allowNull: false },
			activityItemId: { type: dataTypes.UUID, allowNull: false },
			isRead: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
			manuallySetIsRead: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
		},
		{
			indexes: [{ fields: ['userId'], method: 'BTREE' }],
			classMethods: {
				associate: (models) => {
					const { ActivityItem, User, UserNotification, UserSubscription } = models;
					UserNotification.belongsTo(ActivityItem, {
						onDelete: 'CASCADE',
						as: 'activityItem',
						foreignKey: 'activityItemId',
					});
					UserNotification.belongsTo(UserSubscription, {
						onDelete: 'CASCADE',
						as: 'userSubscription',
						foreignKey: 'userSubscriptionId',
					});
					UserNotification.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'user',
						foreignKey: 'userId',
					});
				},
			},
		},
	);
};
