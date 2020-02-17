export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Thread',
		{
			id: sequelize.idType,
			title: { type: dataTypes.TEXT },
			number: { type: dataTypes.INTEGER, allowNull: false },
			isClosed: { type: dataTypes.BOOLEAN },
			isLocked: { type: dataTypes.BOOLEAN },
			labels: { type: dataTypes.JSONB },
			visibility: {
				type: dataTypes.ENUM,
				values: ['private', 'members', 'public'],
				defaultValue: 'private',
			},
			initBranchId: { type: dataTypes.UUID },
			initBranchKey: { type: dataTypes.INTEGER },
			highlightAnchor: { type: dataTypes.INTEGER },
			highlightHead: { type: dataTypes.INTEGER },

			/* Set by Associations */
			userId: { type: dataTypes.UUID, allowNull: false },
			forkId: { type: dataTypes.UUID },
			reviewId: { type: dataTypes.UUID },
			pubId: { type: dataTypes.UUID },
			collectionId: { type: dataTypes.UUID },
			communityId: { type: dataTypes.UUID },
			organizationId: { type: dataTypes.UUID },
		},
		{
			indexes: [
				{ fields: ['userId'], method: 'BTREE' },
				{ fields: ['pubId'], method: 'BTREE' },
				{ fields: ['collectionId'], method: 'BTREE' },
				{ fields: ['communityId'], method: 'BTREE' },
			],
			classMethods: {
				associate: (models) => {
					const {
						ThreadComment,
						Thread,
						ThreadUser,
						Community,
						Collection,
						Pub,
						User,
					} = models;
					Thread.belongsTo(Community, {
						onDelete: 'CASCADE',
						as: 'community',
						foreignKey: 'communityId',
					});
					Thread.belongsTo(Collection, {
						onDelete: 'CASCADE',
						as: 'collection',
						foreignKey: 'collectionId',
					});
					Thread.belongsTo(Pub, {
						onDelete: 'CASCADE',
						as: 'pub',
						foreignKey: 'pubId',
					});
					Thread.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'author',
						foreignKey: 'userId',
					});
					Thread.hasMany(ThreadUser, {
						onDelete: 'CASCADE',
						as: 'threadUsers',
						foreignKey: 'threadId',
					});
					Thread.hasMany(ThreadComment, {
						onDelete: 'CASCADE',
						as: 'comments',
						foreignKey: 'threadId',
					});
				},
			},
		},
	);
};
