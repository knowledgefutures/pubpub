export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define(
		'Page',
		{
			id: sequelize.idType,
			title: { type: Sequelize.TEXT, allowNull: false },
			slug: { type: Sequelize.TEXT, allowNull: false },
			description: { type: Sequelize.TEXT },
			avatar: { type: Sequelize.TEXT },
			isPublic: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
			isNarrowWidth: { type: Sequelize.BOOLEAN },
			viewHash: { type: Sequelize.TEXT },
			layout: { type: Sequelize.JSONB },

			/* Set by Associations */
			communityId: { type: Sequelize.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Page, Community } = models;
					Page.belongsTo(Community, {
						onDelete: 'CASCADE',
						as: 'community',
						foreignKey: 'communityId',
					});
				},
			},
		},
	);
};
