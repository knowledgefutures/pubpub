import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const ThreadComment = sequelize.define(
	'ThreadComment',
	{
		id: sequelize.idType,
		text: { type: dataTypes.TEXT },
		content: { type: dataTypes.JSONB },
		/* Set by Associations */
		userId: { type: dataTypes.UUID },
		threadId: { type: dataTypes.UUID, allowNull: false },
		commenterId: { type: dataTypes.UUID },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { Commenter, ThreadComment: ThreadCommentModel, User } = models;
				ThreadCommentModel.belongsTo(User, {
					onDelete: 'CASCADE',
					as: 'author',
					foreignKey: 'userId',
				});
				ThreadCommentModel.belongsTo(Commenter, {
					onDelete: 'CASCADE',
					as: 'commenter',
					foreignKey: 'commenterId',
				});
			},
		},
	},
) as any;
