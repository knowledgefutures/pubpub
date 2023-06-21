import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Thread = sequelize.define(
	'Thread',
	{
		id: sequelize.idType,
		isLocked: { type: dataTypes.BOOLEAN },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { Thread: ThreadModel, ThreadComment, ThreadEvent } = models;
				ThreadModel.hasMany(ThreadComment, {
					onDelete: 'CASCADE',
					as: 'comments',
					foreignKey: 'threadId',
				});
				ThreadModel.hasMany(ThreadEvent, {
					onDelete: 'CASCADE',
					as: 'events',
					foreignKey: 'threadId',
				});
			},
		},
	},
) as any;
