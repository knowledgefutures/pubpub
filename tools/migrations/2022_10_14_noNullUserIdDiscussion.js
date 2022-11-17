export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.changeColumn('Discussions', 'userId', {
		type: Sequelize.UUID,
		allowNull: true,
	});
};

export const down = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.changeColumn('Discussions', 'userId', {
		type: Sequelize.UUID,
		allowNull: false,
	});
};
