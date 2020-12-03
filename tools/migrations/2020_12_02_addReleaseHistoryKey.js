export const up = async ({ sequelize, Sequelize }) => {
	await sequelize.queryInterface.addColumn('Releases', 'historyKey', {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: -1,
	});
	await sequelize.queryInterface.changeColumn('Releases', 'historyKey', {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: undefined,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Releases', 'historyKey');
};
