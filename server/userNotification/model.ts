import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const UserNotification = sequelize.define(
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
		indexes: [{ fields: ['userId'], using: 'BTREE' }],
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const {
					ActivityItem,
					User,
					UserNotification: UserNotificationModel,
					UserSubscription,
				} = models;
				UserNotificationModel.belongsTo(ActivityItem, {
					onDelete: 'CASCADE',
					as: 'activityItem',
					foreignKey: 'activityItemId',
				});
				UserNotificationModel.belongsTo(UserSubscription, {
					onDelete: 'CASCADE',
					as: 'userSubscription',
					foreignKey: 'userSubscriptionId',
				});
				UserNotificationModel.belongsTo(User, {
					onDelete: 'CASCADE',
					as: 'user',
					foreignKey: 'userId',
				});
			},
		},
	},
) as any;
