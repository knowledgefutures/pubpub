export const up = async ({ sequelize, Sequelize }) => {
	await sequelize.queryInterface.addColumn('CollectionPubs', 'pubRank', {
		type: Sequelize.TEXT,
		allowNull: false,
		defaultValue: '',
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('CollectionPubs', 'pubRank');
};
