export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define(
		'DiscussionChannel',
		{
			id: sequelize.idType,
			title: { type: Sequelize.TEXT },
			permissions: {
				type: Sequelize.ENUM,
				values: ['private', 'restricted', 'public'],
				defaultValue: 'private',
			},
			isCommunityAdminModerated: { type: Sequelize.BOOLEAN },
			viewHash: { type: Sequelize.STRING },
			writeHash: { type: Sequelize.STRING },
			isArchived: { type: Sequelize.BOOLEAN },

			/* Set by Associations */
			pubId: { type: Sequelize.UUID, allowNull: false },
			communityId: { type: Sequelize.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { DiscussionChannel, DiscussionChannelParticipant } = models;
					DiscussionChannel.hasMany(DiscussionChannelParticipant, {
						onDelete: 'CASCADE',
						as: 'participants',
						foreignKey: 'discussionChannelId',
					});
				},
			},
		},
	);
};
