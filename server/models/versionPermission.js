export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define(
		'VersionPermission',
		{
			id: sequelize.idType,
			permissions: {
				type: Sequelize.ENUM,
				values: ['view', 'edit'],
				defaultValue: 'view',
			},

			/* Set by Associations */
			userId: { type: Sequelize.UUID, allowNull: false },
			pubId: { type: Sequelize.UUID, allowNull: false },
			versionId: { type: Sequelize.UUID },
		},
		{
			classMethods: {
				associate: (models) => {
					const { VersionPermission, User } = models;
					VersionPermission.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'user',
						foreignKey: 'userId',
					});
				},
			},
		},
	);
};
