import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Reviewer = sequelize.define(
	'Reviewer',
	{
		id: sequelize.idType,
		name: { type: dataTypes.TEXT },
		reviewId: { type: dataTypes.UUID, allowNull: false },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { Reviewer: ReviewerModel, ReviewNew } = models;
				ReviewerModel.belongsTo(ReviewNew, {
					onDelete: 'CASCADE',
					as: 'review',
					foreignKey: 'reviewId',
				});
			},
		},
	},
) as any;
