export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Submission',
		{
			id: sequelize.idType,
			shortId: { type: dataTypes.INTEGER, allowNull: false },
			isClosed: { type: dataTypes.BOOLEAN },
			/* Set by Associations */
			pubId: { type: dataTypes.UUID, allowNull: false },
			sourceBranchId: { type: dataTypes.UUID, allowNull: false },
			destinationBranchId: { type: dataTypes.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Pub, Submission, Branch } = models;
					Pub.hasMany(Submission, {
						onDelete: 'CASCADE',
						as: 'submissions',
						foreignKey: 'pubId',
					});
					Submission.hasOne(Branch, {
						onDelete: 'CASCADE',
						as: 'sourceBranch',
						foreignKey: 'sourceBranchId',
					});
					Submission.hasOne(Branch, {
						onDelete: 'CASCADE',
						as: 'destinationBranch',
						foreignKey: 'destinationBranchId',
					});
				},
			},
		},
	);
};
