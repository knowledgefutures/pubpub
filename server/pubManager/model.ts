export default (sequelize, dataTypes) => {
	return sequelize.define(
		'PubManager',
		{
			id: sequelize.idType,

			/* Set by Associations */
			userId: { type: dataTypes.UUID, allowNull: false },
			pubId: { type: dataTypes.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { PubManager, User } = models;
					PubManager.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'user',
						foreignKey: 'userId',
					});
				},
			},
		},
	);
};
