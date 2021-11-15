export default (sequelize, dataTypes) => {
	return sequelize.define(
		'SubmissionWorkflow',
		{
			id: sequelize.idType,
			collectionId: { type: dataTypes.UUID, allowNull: false },
			enabled: { type: dataTypes.BOOLEAN, allowNull: false },
			instructionsText: { type: dataTypes.JSONB, allowNull: false },
			emailText: { type: dataTypes.JSONB, allowNull: false },
			layoutBlockContent: { type: dataTypes.JSONB, allowNull: false },
			targetEmailAddress: { type: dataTypes.STRING, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Collection, SubmissionWorkflow } = models;
					SubmissionWorkflow.belongsTo(Collection, {
						as: 'collection',
						foreignKey: 'collectionId',
					});
				},
			},
		},
	);
};
