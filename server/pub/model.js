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
				values: ['white-blocks', 'black-blocks'],
				defaultValue: null,
			},
			headerBackgroundType: {
				type: dataTypes.ENUM,
				values: ['color', 'image'],
				defaultValue: 'color',
			},
			headerBackgroundColor: { type: dataTypes.STRING },
			headerBackgroundImage: { type: dataTypes.TEXT },
			firstPublishedAt: { type: dataTypes.DATE },
			lastPublishedAt: { type: dataTypes.DATE },
			doi: { type: dataTypes.TEXT },
			labels: { type: dataTypes.JSONB },
			isCommunityAdminManaged: { type: dataTypes.BOOLEAN },
			downloads: { type: dataTypes.JSONB },

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
						PubManager,
						CollectionPub,
						Community,
						Discussion,
						Branch,
						Merge,
						PubVersion,
						Review,
					} = models;
					Pub.hasMany(PubAttribution, {
						onDelete: 'CASCADE',
						as: 'attributions',
						foreignKey: 'pubId',
					});
					Pub.hasMany(PubManager, {
						onDelete: 'CASCADE',
						as: 'managers',
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
					Pub.hasMany(Discussion, {
						onDelete: 'CASCADE',
						as: 'discussions',
						foreignKey: 'pubId',
					});
					Pub.hasMany(Branch, {
						onDelete: 'CASCADE',
						as: 'branches',
						foreignKey: 'pubId',
					});
					Pub.hasMany(Merge, {
						onDelete: 'CASCADE',
						as: 'merges',
						foreignKey: 'pubId',
					});
					Pub.hasMany(PubVersion, {
						onDelete: 'CASCADE',
						as: 'pubVersions',
						foreignKey: 'pubId',
					});
					Pub.hasMany(Review, {
						onDelete: 'CASCADE',
						as: 'reviews',
						foreignKey: 'pubId',
					});
				},
			},
		},
	);
};
