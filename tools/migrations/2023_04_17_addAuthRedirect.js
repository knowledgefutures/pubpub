export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Users', 'authRedirectHost', {
		type: Sequelize.TEXT,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Users', 'authRedirectHost');
};
