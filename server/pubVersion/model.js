export default (sequelize) => {
	const { Sequelize } = sequelize;
	return sequelize.define(
		'PubVersion',
		{
			id: sequelize.idType,
			historyKey: { type: Sequelize.INTEGER },
			branchId: { type: Sequelize.UUID },
		},
		{
			classMethods: {
				associate: (models) => {
					const { PubVersion, Branch } = models;
					PubVersion.belongsTo(Branch, {
						as: 'branch',
						foreignKey: 'branchId',
					});
				},
			},
		},
	);
};
