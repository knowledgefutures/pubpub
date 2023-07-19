export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('NodeLabels', 'iframe', {
		type: Sequelize.JSONB,
		allowNull: true,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('NodeLabels', 'iframe');
};
