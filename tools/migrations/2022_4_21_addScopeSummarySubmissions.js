export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('ScopeSummaries', 'submissions', {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 0,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('ScopeSummaries', 'submissions');
};
