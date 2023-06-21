import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const FeatureFlagCommunity = sequelize.define(
	'FeatureFlagCommunity',
	{
		id: sequelize.idType,
		featureFlagId: { type: dataTypes.UUID },
		communityId: { type: dataTypes.UUID },
		enabled: { type: dataTypes.BOOLEAN },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const {
					FeatureFlag,
					FeatureFlagCommunity: FeatureFlagCommunityModel,
					Community,
				} = models;
				FeatureFlagCommunityModel.belongsTo(Community, {
					onDelete: 'CASCADE',
					as: 'community',
					foreignKey: 'communityId',
				});
				FeatureFlagCommunityModel.belongsTo(FeatureFlag, {
					onDelete: 'CASCADE',
					as: 'featureFlag',
					foreignKey: 'featureFlagId',
				});
			},
		},
	},
) as any;
