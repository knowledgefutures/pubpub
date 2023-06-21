import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const LandingPageFeature = sequelize.define(
	'LandingPageFeature',
	{
		id: sequelize.idType,
		communityId: { type: dataTypes.UUID, allowNull: true },
		pubId: { type: dataTypes.UUID, allowNull: true },
		rank: { type: dataTypes.TEXT, allowNull: false },
		payload: { type: dataTypes.JSONB, allowNull: true },
	},
	{
		indexes: [
			{
				fields: ['communityId'],
				unique: true,
			},
			{
				fields: ['pubId'],
				unique: true,
			},
		],
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { Pub, Community, LandingPageFeature: LandingPageFeatureModel } = models;
				LandingPageFeatureModel.belongsTo(Pub, {
					onDelete: 'CASCADE',
					as: 'pub',
					foreignKey: 'pubId',
				});
				LandingPageFeatureModel.belongsTo(Community, {
					onDelete: 'CASCADE',
					as: 'community',
					foreignKey: 'communityId',
				});
			},
		},
	},
) as any;
