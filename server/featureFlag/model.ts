import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const FeatureFlag = sequelize.define(
	'FeatureFlag',
	{
		id: sequelize.idType,
		name: { type: dataTypes.STRING },
		enabledUsersFraction: { type: dataTypes.DOUBLE, defaultValue: 0 },
		enabledCommunitiesFraction: { type: dataTypes.DOUBLE, defaultValue: 0 },
	},
	{
		indexes: [{ unique: true, fields: ['name'] }],
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const {
					FeatureFlag: FeatureFlagModel,
					FeatureFlagUser,
					FeatureFlagCommunity,
				} = models;
				FeatureFlagModel.hasMany(FeatureFlagUser, {
					onDelete: 'CASCADE',
					as: 'users',
					foreignKey: 'featureFlagId',
				});
				FeatureFlagModel.hasMany(FeatureFlagCommunity, {
					onDelete: 'CASCADE',
					as: 'communities',
					foreignKey: 'featureFlagId',
				});
			},
		},
	},
) as any;
