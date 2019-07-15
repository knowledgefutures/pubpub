export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Review',
		{
			id: sequelize.idType,
			shortId: { type: dataTypes.INTEGER, allowNull: false },
			isClosed: { type: dataTypes.BOOLEAN },
			isCompleted: { type: dataTypes.BOOLEAN },
			/* Set by Associations */
			mergeId: { type: dataTypes.UUID },
			pubId: { type: dataTypes.UUID, allowNull: false },
			sourceBranchId: { type: dataTypes.UUID, allowNull: false },
			destinationBranchId: { type: dataTypes.UUID },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Pub, Review, Branch, Merge } = models;
					Review.belongsTo(Merge, {
						onDelete: 'CASCADE',
						as: 'merge',
						foreignKey: 'mergeId',
					});
					Pub.hasMany(Review, {
						onDelete: 'CASCADE',
						as: 'reviews',
						foreignKey: 'pubId',
					});
					Review.belongsTo(Branch, {
						onDelete: 'CASCADE',
						as: 'sourceBranch',
						foreignKey: 'sourceBranchId',
					});
					Review.belongsTo(Branch, {
						onDelete: 'CASCADE',
						as: 'destinationBranch',
						foreignKey: 'destinationBranchId',
					});
				},
			},
		},
	);
};
