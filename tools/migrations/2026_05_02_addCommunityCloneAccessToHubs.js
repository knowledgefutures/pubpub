export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn('Hubs', 'communityCloneAccess', {
		type: Sequelize.ENUM('off', 'everyone', 'managers'),
		defaultValue: 'off',
		allowNull: false,
	});
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('Hubs', 'communityCloneAccess');
	await sequelize.queryInterface.sequelize.query(
		'DROP TYPE IF EXISTS "enum_Hubs_communityCloneAccess";',
	);
};
