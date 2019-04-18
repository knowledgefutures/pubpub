export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define(
		'PubManager',
		{
			id: sequelize.idType,

			/* Set by Associations */
			userId: { type: Sequelize.UUID, allowNull: false },
			pubId: { type: Sequelize.UUID, allowNull: false },
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
