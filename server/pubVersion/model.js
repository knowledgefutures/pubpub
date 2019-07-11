export default (sequelize) => {
	const { Sequelize } = sequelize;
	return sequelize.define(
		'PubVersion',
		{
			id: sequelize.idType,
			historyKey: { type: Sequelize.INTEGER },
			branchId: { type: Sequelize.UUID },
			pubId: { type: Sequelize.UUID },
		},
		{
			classMethods: {
				associate: (models) => {
					const { PubVersion, Branch, Pub } = models;
					PubVersion.belongsTo(Branch, {
						onDelete: 'CASCADE',
						as: 'branch',
						foreignKey: 'branchId',
					});
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
