export default (sequelize, dataTypes) => {
	return sequelize.define(
		'Organization',
		{
			id: sequelize.idType,
			subdomain: {
				type: dataTypes.TEXT,
				unique: true,
				allowNull: false,
				validate: {
					isLowercase: true,
					len: [1, 280],
					is: /^[a-zA-Z0-9-]+$/, // Must contain at least one letter, alphanumeric and hyphens
				},
			},
			domain: {
				type: dataTypes.TEXT,
				unique: true,
			},
			title: { type: dataTypes.TEXT, allowNull: false },
			description: {
				type: dataTypes.TEXT,
				validate: {
					len: [0, 280],
				},
			},
			avatar: { type: dataTypes.TEXT },
			favicon: { type: dataTypes.TEXT },
		},
		{
			classMethods: {
				associate: (models) => {
					const { Organization, Community } = models;
					Organization.hasMany(Community, {
						onDelete: 'CASCADE',
						as: 'communities',
						foreignKey: 'organizationId',
					});
				},
			},
		},
	);
};
