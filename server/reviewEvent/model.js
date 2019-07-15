export default (sequelize, dataTypes) => {
	return sequelize.define(
		'ReviewEvent',
		{
			id: sequelize.idType,
			type: { type: dataTypes.STRING },
			data: { type: dataTypes.JSONB },
			/* Set by Associations */
			userId: { type: dataTypes.UUID, allowNull: false },
			pubId: { type: dataTypes.UUID, allowNull: false },
			reviewId: { type: dataTypes.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Review, User, ReviewEvent } = models;
					Review.hasMany(ReviewEvent, {
						onDelete: 'CASCADE',
						as: 'reviewEvents',
						foreignKey: 'reviewId',
					});
					ReviewEvent.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'user',
						foreignKey: 'userId',
					});
				},
			},
		},
	);
};
