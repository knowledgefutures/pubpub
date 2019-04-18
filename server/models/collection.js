export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define(
		'Collection',
		{
			id: sequelize.idType,
			title: { type: Sequelize.TEXT },
			isRestricted: {
				type: Sequelize.BOOLEAN,
			} /* Restricted collections can only be set by Community Admins */,
			isPublic: { type: Sequelize.BOOLEAN } /* Only visible to community admins */,

			/* Set by Associations */
			pageId: { type: Sequelize.UUID } /* Used to link a collection to a specific page */,
			communityId: { type: Sequelize.UUID },

			metadata: { type: Sequelize.JSONB },
			kind: { type: Sequelize.TEXT },
			doi: { type: Sequelize.TEXT },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Collection, CollectionAttribution, Page } = models;
					Collection.hasMany(CollectionAttribution, {
						onDelete: 'CASCADE',
						as: 'attributions',
						foreignKey: 'collectionId',
					});
					Collection.belongsTo(Page, { as: 'page', foreignKey: 'pageId' });
				},
			},
		},
	);
};
