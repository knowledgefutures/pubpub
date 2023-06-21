import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const ReviewNew = sequelize.define(
	'ReviewNew',
	{
		id: sequelize.idType,
		title: { type: dataTypes.TEXT },
		number: { type: dataTypes.INTEGER, allowNull: false },
		status: {
			type: dataTypes.ENUM,
			values: ['open', 'closed', 'completed'],
			defaultValue: 'open',
		},
		releaseRequested: { type: dataTypes.BOOLEAN },
		labels: { type: dataTypes.JSONB },
		/* Set by Associations */
		threadId: { type: dataTypes.UUID, allowNull: false },
		visibilityId: { type: dataTypes.UUID, allowNull: false },
		userId: { type: dataTypes.UUID },
		pubId: { type: dataTypes.UUID },
		reviewContent: { type: dataTypes.JSONB, allowNull: true },
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
					ReviewNew: ReviewNewModel,
					Reviewer,
					Visibility,
					Pub,
					User,
					Thread,
				} = models;
				ReviewNewModel.belongsTo(Thread, {
					onDelete: 'CASCADE',
					as: 'thread',
					foreignKey: 'threadId',
				});
				ReviewNewModel.belongsTo(Visibility, {
					onDelete: 'CASCADE',
					as: 'visibility',
					foreignKey: 'visibilityId',
				});
				ReviewNewModel.belongsTo(User, {
					onDelete: 'CASCADE',
					as: 'author',
					foreignKey: 'userId',
					constraints: false,
				});
				ReviewNewModel.belongsTo(Pub, {
					onDelete: 'CASCADE',
					as: 'pub',
					foreignKey: 'pubId',
				});
				ReviewNewModel.hasMany(Reviewer, {
					onDelete: 'CASCADE',
					as: 'reviewers',
					foreignKey: 'reviewId',
				});
			},
		},
	},
) as any;
