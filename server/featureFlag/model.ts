export default (sequelize, dataTypes) => {
	return sequelize.define(
		'FeatureFlag',
		{
			id: sequelize.idType,
			name: { type: dataTypes.STRING },
			enabledUsersFraction: { type: dataTypes.DOUBLE, defaultValue: 0 },
			enabledCommunitiesFraction: { type: dataTypes.DOUBLE, defaultValue: 0 },
		},
		{
			indexes: [{ unique: true, fields: ['name'] }],
			classMethods: {
				associate: (models) => {
					const { FeatureFlag, FeatureFlagUser, FeatureFlagCommunity } = models;
					FeatureFlag.hasMany(FeatureFlagUser, {
						onDelete: 'CASCADE',
						as: 'users',
						foreignKey: 'featureFlagId',
					});
					FeatureFlag.hasMany(FeatureFlagCommunity, {
						onDelete: 'CASCADE',
						as: 'communities',
						foreignKey: 'featureFlagId',
					});
				},
			},
		},
	);
};
