export default (sequelize, dataTypes) => {
	/* can be deleted once dashboard goes live */
	/* We need a migration plan for ReviewEvents. Does it make sense */
	/* to generalize that to ThreadEvents? */
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
		},
		{
			classMethods: {
				associate: (models) => {
					const { Review, ReviewEvent } = models;
					Review.hasMany(ReviewEvent, {
						onDelete: 'CASCADE',
						as: 'reviewEvents',
						foreignKey: 'reviewId',
					});
				},
			},
		},
	);
};
