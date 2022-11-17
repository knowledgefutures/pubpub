export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Discussions', 'commenterId', {
		type: Sequelize.UUID,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Discussions', 'commenterId');
};
