export default (sequelize) => {
	const { Sequelize } = sequelize;
	return sequelize.define(
		'PubVersion',
		{
			id: sequelize.idType,
			historyKey: { type: Sequelize.INTEGER },
			pubId: { type: Sequelize.UUID },
		},
		{
			classMethods: {
				associate: (models) => {
					const { PubVersion, Pub } = models;
					PubVersion.belongsTo(Pub, {
						onDelete: 'CASCADE',
						as: 'pub',
						foreignKey: 'pubId',
					});
				},
			},
		},
	);
};
