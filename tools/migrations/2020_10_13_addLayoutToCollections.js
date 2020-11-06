module.exports = async ({ Sequelize, sequelize }) => {
	await sequelize.sync();
	await sequelize.queryInterface.addColumn('Collections', 'layout', {
		type: Sequelize.JSONB,
		allowNull: false,
		defaultValue: {},
	});
};
