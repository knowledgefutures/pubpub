import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const ThreadUser = sequelize.define(
	'ThreadUser',
	{
		id: sequelize.idType,
		type: {
			type: dataTypes.ENUM,
			values: ['viewer', 'reviewer'],
			defaultValue: 'viewer',
		},
		email: {
			type: dataTypes.TEXT,
			validate: {
				isEmail: true,
				isLowercase: true,
			},
		},
		hash: { type: dataTypes.TEXT },

		/* Set by Associations */
		userId: { type: dataTypes.UUID },
		threadId: { type: dataTypes.UUID, allowNull: false },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { ThreadUser: ThreadUserModel, User } = models;
				ThreadUserModel.belongsTo(User, {
					onDelete: 'CASCADE',
					as: 'user',
					foreignKey: 'userId',
				});
			},
		},
	},
) as any;
