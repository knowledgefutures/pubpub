export const up = async ({ sequelize, Sequelize }) => {
	await sequelize.queryInterface.changeColumn('Pages', 'layout', {
		type: Sequelize.JSONB,
		allowNull: false,
	});
};

export const down = async ({ sequelize, Sequelize }) => {
	await sequelize.queryInterface.changeColumn('Pages', 'layout', {
		type: Sequelize.JSONB,
		allowNull: true,
	});
};
