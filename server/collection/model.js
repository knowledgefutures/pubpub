export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Collection',
		{
			id: sequelize.idType,
			title: { type: dataTypes.TEXT },
			isRestricted: {
				type: dataTypes.BOOLEAN,
			} /* Restricted collections can only be set by Community Admins */,
			isPublic: { type: dataTypes.BOOLEAN } /* Only visible to community admins */,

			/* Set by Associations */
			pageId: { type: dataTypes.UUID } /* Used to link a collection to a specific page */,
			communityId: { type: dataTypes.UUID },

			metadata: { type: dataTypes.JSONB },
			kind: { type: dataTypes.TEXT },
			doi: { type: dataTypes.TEXT },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Collection, CollectionAttribution, Page, CollectionPub } = models;
					Collection.hasMany(CollectionAttribution, {
						onDelete: 'CASCADE',
						as: 'attributions',
						foreignKey: 'collectionId',
					});
					Collection.hasMany(CollectionPub, {
						as: 'collectionPubs',
						foreignKey: 'collectionId',
					});
					Collection.belongsTo(Page, { as: 'page', foreignKey: 'pageId' });
				},
			},
		},
	);
};
