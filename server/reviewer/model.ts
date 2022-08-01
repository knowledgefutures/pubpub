export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Reviewer',
		{
			id: sequelize.idType,
			name: { type: dataTypes.TEXT },
			reviewId: { type: dataTypes.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Reviewer, ReviewNew } = models;
					Reviewer.belongsTo(ReviewNew, {
						onDelete: 'CASCADE',
						as: 'review',
						foreignKey: 'reviewId',
					});
				},
			},
		},
	);
};
