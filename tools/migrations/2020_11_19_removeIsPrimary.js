export const up = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('CollectionPubs', 'isPrimary');
};

export const down = async ({ sequelize, Sequelize }) => {
	await sequelize.queryInterface.addColumn('CollectionPubs', 'isPrimary', {
		type: Sequelize.BOOLEAN,
		defaultValue: false,
		allowNull: false,
	});
};
