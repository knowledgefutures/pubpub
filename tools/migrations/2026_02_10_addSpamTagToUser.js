export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Users', 'spamTagId', {
		type: Sequelize.UUID,
		allowNull: true,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Users', 'spamTagId');
};
