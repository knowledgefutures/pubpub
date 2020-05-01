export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Collection',
		{
			id: sequelize.idType,
			title: { type: dataTypes.TEXT },
			slug: {
				type: dataTypes.TEXT,
				allowNull: false,
				validate: {
					isLowercase: true,
					len: [1, 280],
					is: /^[a-zA-Z0-9-]+$/, // Must contain at least one letter, alphanumeric and underscores and hyphens
				},
			},
			avatar: { type: dataTypes.TEXT },
			isRestricted: {
				type: dataTypes.BOOLEAN,
			} /* Restricted collections can only be set by Community Admins */,
			isPublic: { type: dataTypes.BOOLEAN } /* Only visible to community admins */,
			viewHash: { type: dataTypes.STRING },
			editHash: { type: dataTypes.STRING },
			metadata: { type: dataTypes.JSONB },
			kind: { type: dataTypes.TEXT },
			doi: { type: dataTypes.TEXT },
			readNextPreviewSize: {
				type: dataTypes.ENUM('none', 'minimal', 'medium', 'choose-best'),
				defaultValue: 'choose-best',
			},

			/* Set by Associations */
			pageId: { type: dataTypes.UUID } /* Used to link a collection to a specific page */,
			communityId: { type: dataTypes.UUID },
		},
		{
			classMethods: {
				associate: (models) => {
					const {
						Collection,
						CollectionAttribution,
						Page,
						CollectionPub,
						Member,
					} = models;
					Collection.hasMany(CollectionAttribution, {
						onDelete: 'CASCADE',
						as: 'attributions',
						foreignKey: 'collectionId',
					});
					Collection.hasMany(CollectionPub, {
						as: 'collectionPubs',
						foreignKey: 'collectionId',
					});
					Collection.hasMany(Member, {
						as: 'members',
						foreignKey: 'collectionId',
					});
					Collection.belongsTo(Page, { as: 'page', foreignKey: 'pageId' });
				},
			},
		},
	);
};
