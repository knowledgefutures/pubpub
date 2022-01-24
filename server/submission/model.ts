export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Submission',
		{
			id: sequelize.idType,
			status: {
				type: dataTypes.TEXT,
				allowNull: false,
			},
			submittedAt: { type: dataTypes.DATE },
			submissionWorkflowId: { type: dataTypes.UUID, allowNull: false },
			pubId: { type: dataTypes.UUID, allowNull: false },
			abstract: { type: dataTypes.JSONB, allowNull: true },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Pub, Submission, SubmissionWorkflow } = models;
					Submission.belongsTo(Pub, {
						onDelete: 'CASCADE',
						as: 'pub',
						foreignKey: 'pubId',
					});
					Submission.belongsTo(SubmissionWorkflow, {
						onDelete: 'CASCADE',
						as: 'submissionWorkflow',
						foreignKey: 'submissionWorkflowId',
					});
				},
			},
		},
	);
};
