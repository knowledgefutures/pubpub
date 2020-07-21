module.exports = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('WorkerTasks', 'priority', {
		type: Sequelize.INTEGER,
	});
};
