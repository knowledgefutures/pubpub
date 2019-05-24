export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define(
		'PubAttribution',
		{
			id: sequelize.idType,
			name: { type: Sequelize.TEXT } /* Used for non-account attribution */,
			avatar: { type: Sequelize.TEXT } /* Used for non-account attribution */,
			title: { type: Sequelize.TEXT } /* Used for non-account attribution */,
			order: { type: Sequelize.DOUBLE },
			isAuthor: { type: Sequelize.BOOLEAN },
			roles: { type: Sequelize.JSONB },
			affiliation: { type: Sequelize.TEXT },

			/* Set by Associations */
			userId: { type: Sequelize.UUID },
			pubId: { type: Sequelize.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { User, PubAttribution, Pub } = models;
					PubAttribution.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'user',
						foreignKey: 'userId',
					});
					PubAttribution.belongsTo(Pub, {
						onDelete: 'CASCADE',
						as: 'pub',
						foreignKey: 'pubId',
					});
				},
			},
		},
	);
};
