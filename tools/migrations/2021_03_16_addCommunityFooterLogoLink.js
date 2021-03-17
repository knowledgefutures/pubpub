export const up = async ({ sequelize, Sequelize }) => {
	await sequelize.queryInterface.addColumn('Communities', 'footerLogoLink', {
		type: Sequelize.TEXT,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Communities', 'footerLogoLink');
};
