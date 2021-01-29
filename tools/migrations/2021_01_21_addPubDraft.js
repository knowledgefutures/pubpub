export const up = async ({ sequelize, Sequelize }) => {
	await sequelize.queryInterface.addColumn('Pubs', 'draftId', {
		type: Sequelize.UUID,
	});
};

export const finalize = async ({ sequelize }) => {
	await sequelize.queryInterface.changeColumn('Pubs', 'draftId', {
		allowNull: false,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Pubs', 'draftId');
};
