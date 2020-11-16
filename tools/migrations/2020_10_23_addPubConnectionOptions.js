module.exports = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Pubs', 'pubEdgeListingDefaultsToCarousel', {
		type: Sequelize.BOOLEAN,
	});
	await sequelize.queryInterface.addColumn('Pubs', 'pubEdgeDescriptionVisible', {
		type: Sequelize.BOOLEAN,
		defaultValue: false,
		allowNull: false,
	});
};
