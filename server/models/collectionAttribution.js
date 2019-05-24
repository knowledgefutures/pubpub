export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define(
		'CollectionAttribution',
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
			collectionId: { type: Sequelize.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Collection, CollectionAttribution, User } = models;
					CollectionAttribution.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'user',
						foreignKey: 'userId',
					});
					CollectionAttribution.belongsTo(Collection, {
						onDelete: 'CASCADE',
						as: 'collection',
						foreignKey: 'collectionId',
					});
				},
			},
		},
	);
};
