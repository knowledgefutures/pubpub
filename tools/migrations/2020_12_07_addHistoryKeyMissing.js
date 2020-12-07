export const up = async ({ sequelize, Sequelize }) => {
	await sequelize.queryInterface.addColumn('Releases', 'historyKeyMissing', {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Releases', 'historyKeyMissing');
};
