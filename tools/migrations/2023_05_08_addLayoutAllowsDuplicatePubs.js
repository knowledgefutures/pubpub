export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Pages', 'layoutAllowsDuplicatePubs', {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	});
	await sequelize.queryInterface.addColumn('Collections', 'layoutAllowsDuplicatePubs', {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Pages', 'layoutAllowsDuplicatePubs');
	await sequelize.queryInterface.removeColumn('Collections', 'layoutAllowsDuplicatePubs');
};
