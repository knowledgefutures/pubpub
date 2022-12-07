export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Communities', 'spamTagId', {
		type: Sequelize.UUID,
		allowNull: true,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Communities', 'spamTagId');
};
