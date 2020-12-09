export const up = async ({ sequelize }) => {
	await sequelize.queryInterface.renameTable('Discussions', 'DiscussionsLegacy');
	await sequelize.queryInterface.renameTable('DiscussionNews', 'Discussions');
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.renameTable('Discussions', 'DiscussionNews');
	await sequelize.queryInterface.renameTable('DiscussionsLegacy', 'Discussions');
};
