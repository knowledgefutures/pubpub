export const up = async ({ Sequelize, sequelize }) => {
	await sequelize.queryInterface.addColumn(
		'UserNotificationPreferences',
		'receiveDiscussionThreadEmails',
		{
			type: Sequelize.BOOLEAN,
			defaultValue: false,
			allowNull: false,
		},
	);
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn(
		'UserNotificationPreferences',
		'receiveDiscussionThreadEmails',
	);
};
