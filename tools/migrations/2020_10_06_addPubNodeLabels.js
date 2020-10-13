module.exports = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Pubs', 'nodeLabels', {
		type: Sequelize.JSONB,
	});
};
