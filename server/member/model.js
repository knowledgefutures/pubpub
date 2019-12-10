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
					const { Member, User } = models;
					Member.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'user',
						foreignKey: 'userId',
					});
				},
			},
		},
	);
};
