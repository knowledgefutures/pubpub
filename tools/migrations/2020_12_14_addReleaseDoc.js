export const up = async ({ sequelize, Sequelize }) => {
	await sequelize.queryInterface.addColumn('Releases', 'docId', {
		type: Sequelize.UUID,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Releases', 'docId');
};
