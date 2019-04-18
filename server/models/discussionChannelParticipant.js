export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define(
		'DiscussionChannelParticipant',
		{
			/* Theoretically, we could allow participants to have either view or write permissions */
			/* This seems like a bit of an unnecessary verboseness. The viewHash URL seems like it would */
			/* solve most cases where you want view, but not write permissions. */
			/* We might revisit and decide otherwise later. */
			id: sequelize.idType,
			isModerator: { type: Sequelize.BOOLEAN },
			userId: { type: Sequelize.UUID, allowNull: false },
			discussionChannelId: { type: Sequelize.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { DiscussionChannelParticipant, User } = models;
					DiscussionChannelParticipant.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'user',
						foreignKey: 'userId',
					});
				},
			},
		},
	);
};
