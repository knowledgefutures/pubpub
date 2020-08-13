module.exports = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.changeColumn('CollectionPubs', 'rank', {
		type: Sequelize.TEXT,
		allowNull: false,
	});
};
