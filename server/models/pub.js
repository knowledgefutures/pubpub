export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define(
		'Pub',
		{
			id: sequelize.idType,
			slug: {
				type: Sequelize.TEXT,
				unique: true,
				allowNull: false,
				validate: {
					isLowercase: true,
					len: [1, 280],
					is: /^[a-zA-Z0-9-]+$/, // Must contain at least one letter, alphanumeric and underscores and hyphens
				},
			},
			title: { type: Sequelize.TEXT, allowNull: false },
			description: {
				type: Sequelize.TEXT,
				validate: {
					len: [0, 280],
				},
			},
			avatar: { type: Sequelize.TEXT },
			headerStyle: {
				type: Sequelize.ENUM,
				values: ['white-blocks', 'black-blocks'],
				defaultValue: null,
			},
			headerBackgroundType: {
				type: Sequelize.ENUM,
				values: ['color', 'image'],
				defaultValue: 'color',
			},
			headerBackgroundColor: { type: Sequelize.STRING },
			headerBackgroundImage: { type: Sequelize.TEXT },
			firstPublishedAt: { type: Sequelize.DATE },
			lastPublishedAt: { type: Sequelize.DATE },
			doi: { type: Sequelize.TEXT },
			labels: { type: Sequelize.JSONB },
			isCommunityAdminManaged: { type: Sequelize.BOOLEAN },
			downloads: { type: Sequelize.JSONB },

			/* Set by Associations */
			communityId: { type: Sequelize.UUID, allowNull: false },
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
				},
			},
		},
	);
};
