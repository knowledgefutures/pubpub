export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Member',
		{
			id: sequelize.idType,
			permissions: {
				type: dataTypes.ENUM,
				values: ['view', 'edit', 'manage', 'admin'],
				defaultValue: 'view',
			},
			isOwner: { type: dataTypes.BOOLEAN },

			/* Set by Associations */
			userId: { type: dataTypes.UUID, allowNull: false },
			pubId: { type: dataTypes.UUID },
			collectionId: { type: dataTypes.UUID },
			communityId: { type: dataTypes.UUID },
			organizationId: { type: dataTypes.UUID },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Member, User, Collection, Community, Pub } = models;
					Member.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'user',
						foreignKey: 'userId',
					});
					Member.belongsTo(Community, {
						onDelete: 'CASCADE',
						as: 'community',
						foreignKey: 'communityId',
					});
					Member.belongsTo(Pub, {
						onDelete: 'CASCADE',
						as: 'pub',
						foreignKey: 'pubId',
					});
					Member.belongsTo(Collection, {
						onDelete: 'CASCADE',
						as: 'collection',
						foreignKey: 'collectionId',
					});
				},
			},
		},
	);
};
