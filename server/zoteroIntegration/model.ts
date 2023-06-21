import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const ZoteroIntegration = sequelize.define(
	'zoteroIntegration',
	{
		id: sequelize.idType,
		zoteroUsername: dataTypes.TEXT,
		zoteroUserId: dataTypes.TEXT,
	},
	{
		tableName: 'ZoteroIntegrations',
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
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
) as any;
