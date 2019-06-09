export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Page',
		{
			id: sequelize.idType,
			title: { type: dataTypes.TEXT, allowNull: false },
			slug: { type: dataTypes.TEXT, allowNull: false },
			description: { type: dataTypes.TEXT },
			avatar: { type: dataTypes.TEXT },
			isPublic: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
			isNarrowWidth: { type: dataTypes.BOOLEAN },
			viewHash: { type: dataTypes.TEXT },
			layout: { type: dataTypes.JSONB },

			/* Set by Associations */
			communityId: { type: dataTypes.UUID, allowNull: false },
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
