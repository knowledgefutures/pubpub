module.exports = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('FtpTargets', 'name', {
		type: Sequelize.STRING,
		allowNull: true,
		defaultValue: '',
	});
};
