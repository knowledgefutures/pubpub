export default (sequelize, dataTypes) => {
	return sequelize.define(
		'UserNotificationPreferences',
		{
			id: sequelize.idType,
			userId: { type: dataTypes.UUID, allowNull: false },
			receiveNotifications: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: true },
			subscribeToThreadsAsCommenter: {
				type: dataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			subscribeToPubsAsMember: {
				type: dataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			subscribeToPubsAsContributor: {
				type: dataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			notificationCadence: {
				type: dataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			markReadTrigger: {
				type: dataTypes.STRING,
				allowNull: false,
				defaultValue: 'clicked-through',
			},
		},
		{
			indexes: [{ fields: ['userId'], method: 'BTREE' }],
		},
	);
};
