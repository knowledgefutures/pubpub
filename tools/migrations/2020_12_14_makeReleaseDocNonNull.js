export const up = async ({ sequelize }) => {
	await sequelize.queryInterface.changeColumn('Releases', 'docId', {
		allowNull: false,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.changeColumn('Releases', 'docId', {
		allowNull: true,
	});
};
