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
					const { User, ReviewEvent } = models;
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
