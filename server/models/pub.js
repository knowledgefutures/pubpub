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
			useHeaderImage: { type: Sequelize.BOOLEAN },
			firstPublishedAt: { type: Sequelize.DATE },
			lastPublishedAt: { type: Sequelize.DATE },
			draftEditHash: { type: Sequelize.STRING }, // TODO: This is used for draft
			draftViewHash: { type: Sequelize.STRING }, // TODO: This is used for draft
			doi: { type: Sequelize.TEXT },
			labels: { type: Sequelize.JSONB },

			isCommunityAdminManaged: { type: Sequelize.BOOLEAN },
			// communityAdminDraftPermissions: {
			// 	type: Sequelize.ENUM,
			// 	values: ['none', 'view', 'edit'],
			// 	defaultValue: 'none',
			// },
			// draftPermissions: {
			// 	type: Sequelize.ENUM,
			// 	values: ['private', 'publicView', 'publicEdit'],
			// 	defaultValue: 'private',
			// },
			review: { type: Sequelize.JSONB },
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
						VersionPermission,
						BranchPermission,
						PubManager,
						CollectionPub,
						Community,
						Discussion,
						Version,
						Branch,
						DiscussionChannel,
					} = models;
					Pub.hasMany(PubAttribution, {
						onDelete: 'CASCADE',
						as: 'attributions',
						foreignKey: 'pubId',
					});
					Pub.hasMany(VersionPermission, {
						onDelete: 'CASCADE',
						as: 'versionPermissions',
						foreignKey: 'pubId',
					});
					Pub.hasMany(BranchPermission, {
						onDelete: 'CASCADE',
						as: 'branchPermissions',
						foreignKey: 'pubId',
					});
					Pub.hasMany(PubManager, {
						onDelete: 'CASCADE',
						as: 'managers',
						foreignKey: 'pubId',
					});
					Pub.hasMany(DiscussionChannel, {
						onDelete: 'CASCADE',
						as: 'discussionChannels',
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
					Pub.hasMany(Version, {
						onDelete: 'CASCADE',
						as: 'versions',
						foreignKey: 'pubId',
					});
					Pub.hasMany(Version, {
						onDelete: 'CASCADE',
						as: 'activeVersion',
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
