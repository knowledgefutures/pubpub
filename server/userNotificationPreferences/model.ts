import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const UserNotificationPreferences = sequelize.define(
	'UserNotificationPreferences',
	{
		id: sequelize.idType,
		userId: { type: dataTypes.UUID, allowNull: false },
		receiveNotifications: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: true },
		lastReceivedNotificationsAt: { type: dataTypes.DATE, allowNull: true },
		subscribeToThreadsAsCommenter: {
			type: dataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		subscribeToPubsAsMember: {
			type: dataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		subscribeToPubsAsContributor: {
			type: dataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
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
		indexes: [{ fields: ['userId'], using: 'BTREE' }],
	},
) as any;
