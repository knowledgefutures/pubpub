import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Draft = sequelize.define(
	'Draft',
	{
		id: sequelize.idType,
		latestKeyAt: { type: dataTypes.DATE },
		firebasePath: { type: dataTypes.STRING, allowNull: false },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { Pub, Draft: DraftModel } = models;
				Pub.belongsTo(DraftModel, {
					as: 'draft',
					foreignKey: 'draftId',
				});
			},
		},
	},
) as any;
