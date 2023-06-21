import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const UserSubscription = sequelize.define(
	'UserSubscription',
	{
		id: sequelize.idType,
		setAutomatically: { type: dataTypes.BOOLEAN, allowNull: false },
		status: { type: dataTypes.STRING, allowNull: false },
		userId: { type: dataTypes.UUID, allowNull: false },
		pubId: { type: dataTypes.UUID },
		threadId: { type: dataTypes.UUID },
	},
	{
		indexes: [
			{ fields: ['userId'], using: 'BTREE' },
			{ fields: ['pubId'], using: 'BTREE' },
			{ fields: ['threadId'], using: 'BTREE' },
		],
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { Pub, Thread, User, UserSubscription: UserSubscriptionModel } = models;
				UserSubscriptionModel.belongsTo(Pub, {
					onDelete: 'CASCADE',
					as: 'pub',
					foreignKey: 'pubId',
				});
				UserSubscriptionModel.belongsTo(Thread, {
					onDelete: 'CASCADE',
					as: 'thread',
					foreignKey: 'threadId',
				});
				UserSubscriptionModel.belongsTo(User, {
					onDelete: 'CASCADE',
					as: 'user',
					foreignKey: 'userId',
				});
			},
		},
	},
) as any;
