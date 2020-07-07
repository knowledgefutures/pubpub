export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Pub',
		{
			id: sequelize.idType,
			slug: {
				type: dataTypes.TEXT,
				unique: true,
				allowNull: false,
				validate: {
					isLowercase: true,
					len: [1, 280],
					is: /^[a-zA-Z0-9-]+$/, // Must contain at least one letter, alphanumeric and underscores and hyphens
				},
			},
			title: { type: dataTypes.TEXT, allowNull: false },
			description: {
				type: dataTypes.TEXT,
				validate: {
					len: [0, 280],
				},
			},
			avatar: { type: dataTypes.TEXT },
			headerStyle: {
				type: dataTypes.ENUM,
				values: ['white-blocks', 'black-blocks', 'dark', 'light'],
				defaultValue: null,
			},
			headerBackgroundColor: { type: dataTypes.STRING },
			headerBackgroundImage: { type: dataTypes.TEXT },
			firstPublishedAt: { type: dataTypes.DATE },
			lastPublishedAt: { type: dataTypes.DATE },
			customPublishedAt: { type: dataTypes.DATE },
			doi: { type: dataTypes.TEXT },
			labels: { type: dataTypes.JSONB },
			downloads: { type: dataTypes.JSONB },
			metadata: { type: dataTypes.JSONB },
			licenseSlug: { type: dataTypes.TEXT, defaultValue: 'cc-by' },
			citationStyle: { type: dataTypes.TEXT, defaultValue: 'apa' },
			citationInlineStyle: { type: dataTypes.TEXT, defaultValue: 'count' },
			// isPublicBranches: { type: dataTypes.BOOLEAN },
			// isPublicDiscussions: { type: dataTypes.BOOLEAN },
			// isPublicReviews: { type: dataTypes.BOOLEAN },
			viewHash: { type: dataTypes.STRING },
			editHash: { type: dataTypes.STRING },

			/* Set by Associations */
			communityId: { type: dataTypes.UUID, allowNull: false },
		},
		{
			indexes: [{ fields: ['communityId'], method: 'BTREE' }],
			classMethods: {
				associate: (models) => {
					const {
						Pub,
						PubAttribution,
						PubEdge,
						CollectionPub,
						Community,
						Branch,
						PubVersion,
						Release,
						DiscussionNew,
						Fork,
						ReviewNew,
						Member,
					} = models;
					Pub.hasMany(PubAttribution, {
						onDelete: 'CASCADE',
						as: 'attributions',
						foreignKey: 'pubId',
					});
					Pub.hasMany(CollectionPub, {
						onDelete: 'CASCADE',
						as: 'collectionPubs',
						foreignKey: 'pubId',
					});
					Pub.belongsTo(Community, {
						onDelete: 'CASCADE',
						as: 'community',
						foreignKey: 'communityId',
					});
					Pub.hasMany(DiscussionNew, {
						onDelete: 'CASCADE',
						as: 'discussions',
						foreignKey: 'pubId',
					});
					Pub.hasMany(Fork, {
						onDelete: 'CASCADE',
						as: 'forks',
						foreignKey: 'pubId',
					});
					Pub.hasMany(ReviewNew, {
						onDelete: 'CASCADE',
						as: 'reviews',
						foreignKey: 'pubId',
					});
					Pub.hasMany(Member, {
						onDelete: 'CASCADE',
						as: 'members',
						foreignKey: 'pubId',
					});
					Pub.hasMany(Branch, {
						onDelete: 'CASCADE',
						as: 'branches',
						foreignKey: 'pubId',
					});
					Pub.hasMany(Release, {
						onDelete: 'CASCADE',
						as: 'releases',
						foreignKey: 'pubId',
					});
					Pub.hasMany(PubVersion, {
						onDelete: 'CASCADE',
						as: 'pubVersions',
						foreignKey: 'pubId',
					});
					Pub.hasMany(PubEdge, {
						onDelete: 'CASCADE',
						as: 'outboundEdges',
						foreignKey: 'pubId',
					});
					Pub.hasMany(PubEdge, {
						onDelete: 'CASCADE',
						as: 'inboundEdges',
						foreignKey: 'targetPubId',
					});
				},
			},
		},
	);
};
