export default (sequelize, dataTypes) =>
	sequelize.define(
		'zoteroIntegration',
		{
			id: sequelize.idType,
			zoteroUsername: dataTypes.TEXT,
			zoteroUserId: dataTypes.TEXT,
		},
		{
			tableName: 'ZoteroIntegrations',
			classMethods: {
				associate: (models) => {
					const { User, zoteroIntegration, integrationDataOAuth1 } = models;
					zoteroIntegration.belongsTo(User, {
						as: 'user',
						foreignKey: { allowNull: false },
					});
					zoteroIntegration.belongsTo(integrationDataOAuth1, {
						foreignKey: { allowNull: false },
						onDelete: 'CASCADE',
					});
				},
			},
		},
	);
