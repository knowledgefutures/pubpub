export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Pubs', 'commentHash', {
		type: Sequelize.STRING,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Pubs', 'commentHash');
};
