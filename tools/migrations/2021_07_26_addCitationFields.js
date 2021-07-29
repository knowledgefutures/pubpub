export const up = async ({ sequelize, Sequelize }) => {
	await sequelize.queryInterface.addColumn('Communities', 'citeAs', {
		type: Sequelize.TEXT,
	});
	await sequelize.queryInterface.addColumn('Communities', 'publishAs', {
		type: Sequelize.TEXT,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Communities', 'citeAs');
	await sequelize.queryInterface.removeColumn('Communities', 'publishAs');
};
