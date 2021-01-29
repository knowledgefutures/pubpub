export const up = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Exports', 'branchId');
	await sequelize.queryInterface.removeColumn('Releases', 'branchId');
	await sequelize.queryInterface.removeColumn('Releases', 'sourceBranchId');
	await sequelize.queryInterface.removeColumn('Releases', 'sourceBranchKey');
	await sequelize.queryInterface.removeColumn('ReviewNews', 'branchId');
};

export const down = async ({ sequelize, Sequelize }) => {
	await sequelize.queryInterface.addColumn('Exports', 'branchId', {
		type: Sequelize.UUID,
	});
	await sequelize.queryInterface.addColumn('Releases', 'branchId', {
		type: Sequelize.UUID,
	});
	await sequelize.queryInterface.addColumn('Releases', 'sourceBranchId', {
		type: Sequelize.UUID,
	});
	await sequelize.queryInterface.addColumn('Releases', 'sourceBranchKey', {
		type: Sequelize.INTEGER,
	});
	await sequelize.queryInterface.addColumn('ReviewNews', 'branchId', {
		type: Sequelize.UUID,
	});
};
