export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Branch',
		{
			id: sequelize.idType,
			shortId: { type: dataTypes.INTEGER, allowNull: false },
			title: { type: dataTypes.TEXT },
			description: { type: dataTypes.TEXT },
			submissionAlias: { type: dataTypes.TEXT },
			order: { type: dataTypes.DOUBLE },
			viewHash: { type: dataTypes.STRING },
			discussHash: { type: dataTypes.STRING },
			editHash: { type: dataTypes.STRING },
			firstKeyAt: { type: dataTypes.DATE },
			latestKeyAt: { type: dataTypes.DATE },
			/* Set by Associations */
			pubId: { type: dataTypes.UUID, allowNull: false },
			maintenanceDocId: { type: dataTypes.UUID },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Branch, Export } = models;
					Branch.hasMany(Export, {
						onDelete: 'CASCADE',
						as: 'exports',
						foreignKey: 'branchId',
					});
				},
			},
		},
	);
};
