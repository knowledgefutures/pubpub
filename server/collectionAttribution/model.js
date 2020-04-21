export default (sequelize, dataTypes) => {
	return sequelize.define(
		'CollectionAttribution',
		{
			id: sequelize.idType,
			name: { type: dataTypes.TEXT } /* Used for non-account attribution */,
			avatar: { type: dataTypes.TEXT } /* Used for non-account attribution */,
			title: { type: dataTypes.TEXT } /* Used for non-account attribution */,
			order: { type: dataTypes.DOUBLE },
			isAuthor: { type: dataTypes.BOOLEAN },
			roles: { type: dataTypes.JSONB },
			affiliation: { type: dataTypes.TEXT },
			orcid: { type: dataTypes.STRING },
			/* Set by Associations */
			userId: { type: dataTypes.UUID },
			collectionId: { type: dataTypes.UUID, allowNull: false },
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
