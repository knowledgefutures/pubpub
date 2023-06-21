import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Discussion = sequelize.define(
	'Discussion',
	{
		id: sequelize.idType,
		title: { type: dataTypes.TEXT },
		number: { type: dataTypes.INTEGER, allowNull: false },
		isClosed: { type: dataTypes.BOOLEAN },
		labels: { type: dataTypes.JSONB },
		/* Set by Associations */
		threadId: { type: dataTypes.UUID, allowNull: false },
		visibilityId: { type: dataTypes.UUID, allowNull: false },
		userId: { type: dataTypes.UUID, allowNull: true },
		anchorId: { type: dataTypes.UUID },
		pubId: { type: dataTypes.UUID },
		commenterId: { type: dataTypes.UUID, allowNull: true },
	},
	{
		indexes: [
			{ fields: ['userId'], using: 'BTREE' },
			{ fields: ['pubId'], using: 'BTREE' },
		],
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const {
					Discussion: DiscussionModel,
					DiscussionAnchor,
					Visibility,
					Pub,
					User,
					Thread,
					Commenter,
				} = models;
				DiscussionModel.belongsTo(Thread, {
					onDelete: 'CASCADE',
					as: 'thread',
					foreignKey: 'threadId',
				});
				DiscussionModel.belongsTo(Visibility, {
					onDelete: 'CASCADE',
					as: 'visibility',
					foreignKey: 'visibilityId',
				});
				DiscussionModel.belongsTo(User, {
					onDelete: 'CASCADE',
					as: 'author',
					foreignKey: 'userId',
				});
				DiscussionModel.belongsTo(Commenter, {
					onDelete: 'CASCADE',
					as: 'commenter',
					foreignKey: 'commenterId',
				});
				DiscussionModel.belongsTo(Pub, {
					onDelete: 'CASCADE',
					as: 'pub',
					foreignKey: 'pubId',
				});
				DiscussionModel.hasMany(DiscussionAnchor, {
					onDelete: 'CASCADE',
					as: 'anchors',
					foreignKey: 'discussionId',
				});
			},
		},
	},
) as any;
