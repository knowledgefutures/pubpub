export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Pubs', 'htmlDescription', {
		type: Sequelize.TEXT,
		allowNull: true,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Pubs', 'htmlDescription');
};
