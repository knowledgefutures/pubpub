module.exports = async ({ Sequelize, sequelize }) => {
	await sequelize.sync();
	await sequelize.queryInterface.addColumn('Branches', 'maintenanceDocId', {
		type: Sequelize.UUID,
	});
};
