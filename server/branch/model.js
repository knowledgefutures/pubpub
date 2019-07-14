export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Branch',
		{
			id: sequelize.idType,
			shortId: { type: dataTypes.INTEGER, allowNull: false },
			title: { type: dataTypes.TEXT },
			description: { type: dataTypes.TEXT },
			submissionAlias: { type: dataTypes.TEXT },
			order: { type: dataTypes.DOUBLE },
			publicPermissions: {
				type: dataTypes.ENUM,
				values: ['none', 'view', 'discuss', 'edit'],
				defaultValue: 'none',
			},
			pubManagerPermissions: {
				type: dataTypes.ENUM,
				values: ['none', 'view', 'discuss', 'edit', 'manage'],
				defaultValue: 'none',
			},
			communityAdminPermissions: {
				type: dataTypes.ENUM,
				values: ['none', 'view', 'discuss', 'edit', 'manage'],
				defaultValue: 'none',
			},
			viewHash: { type: dataTypes.STRING },
			discussHash: { type: dataTypes.STRING },
			editHash: { type: dataTypes.STRING },
			/* TODO: We still do not have a way to handle setting */
			/* firstKeyAt and latestKeyAt outside of Merge workflows. */
			/* Perhaps if we have a tool that is validating the doc */
			/* in the background for stability, it can also set these. */
			firstKeyAt: { type: dataTypes.DATE },
			latestKeyAt: { type: dataTypes.DATE },
			/* Set by Associations */
			pubId: { type: dataTypes.UUID, allowNull: false },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Branch, BranchPermission } = models;
					Branch.hasMany(BranchPermission, {
						onDelete: 'CASCADE',
						as: 'permissions',
						foreignKey: 'branchId',
					});
				},
			},
		},
	);
};
