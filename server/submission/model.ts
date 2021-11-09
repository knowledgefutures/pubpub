export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Submission',
		{
			id: sequelize.idType,
			status: {
				type: dataTypes.TEXT,
				allowNull: false,
			},
			/* Set by Associations */
			pubId: { type: dataTypes.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Submission, Pub } = models;
					Submission.belongsTo(Pub, {
						onDelete: 'CASCADE',
						as: 'submission',
						foreignKey: 'pubId',
					});
				},
			},
		},
	);
};
