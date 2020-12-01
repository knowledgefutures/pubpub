export default (sequelize) => {
	const Sequelize = sequelize.Sequelize;

	return sequelize.define(
		'BranchPermission',
		{
			id: sequelize.idType,
			permissions: {
				type: Sequelize.ENUM,
				values: ['view', 'discuss', 'edit', 'manage'],
				defaultValue: 'view',
			},

			/* Set by Associations */
			userId: { type: Sequelize.UUID, allowNull: false },
			pubId: { type: Sequelize.UUID, allowNull: false },
			branchId: { type: Sequelize.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { BranchPermission, User, Branch } = models;
					BranchPermission.belongsTo(User, {
						onDelete: 'CASCADE',
						as: 'user',
						foreignKey: 'userId',
					});
					BranchPermission.belongsTo(Branch, {
						onDelete: 'CASCADE',
						as: 'branch',
						foreignKey: 'branchId',
					});
				},
			},
		},
	);
};
