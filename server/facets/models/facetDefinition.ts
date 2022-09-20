export default (sequelize, dataTypes) => {
	return sequelize.define(
		'FacetDefinition',
		{
			id: sequelize.idType,
			name: { type: dataTypes.TEXT, allowNull: false },
			structure: { typ: dataTypes.JSONB, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { FacetDefinition, FacetInstance } = models;
					FacetDefinition.hasMany(FacetInstance, {
						onDelete: 'CASCADE',
						as: 'instances',
						foreignKey: 'facetDefinitionId',
					});
				},
			},
		},
	);
};
