export default (sequelize, dataTypes) => {
	return sequelize.define(
		'SubmissionWorkflow',
		{
			id: sequelize.idType,
			collectionId: { type: dataTypes.UUID, allowNull: false },
			enabled: { type: dataTypes.BOOLEAN },
			instructionsText: { type: dataTypes.JSONB },
			emailText: { type: dataTypes.JSONB },
			layoutBlockContent: {
				type: dataTypes.JSONB,
			},
			targetEmailAddress: { type: dataTypes.STRING },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Collection, SubmissionWorkflow } = models;
					SubmissionWorkflow.belongsTo(Collection, {
						as: 'Collection',
						foreignKey: 'collectionId',
					});
				},
			},
		},
	);
};
