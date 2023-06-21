import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const IntegrationDataOAuth1 = sequelize.define(
	'integrationDataOAuth1',
	{
		id: sequelize.idType,
		accessToken: dataTypes.TEXT,
	},
	{
		tableName: 'IntegrationDataOAuth1',
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { integrationDataOAuth1, zoteroIntegration } = models;
				integrationDataOAuth1.hasOne(zoteroIntegration, {
					foreignKey: { allowNull: false },
					onDelete: 'CASCADE',
				});
			},
		},
	},
) as any;
