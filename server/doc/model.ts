export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Doc',
		{
			id: sequelize.idType,
			content: { type: dataTypes.JSONB, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Branch, Doc } = models;
					Branch.belongsTo(Doc, {
						as: 'maintenanceDoc',
						foreignKey: 'maintenanceDocId',
					});
				},
			},
		},
	);
};
