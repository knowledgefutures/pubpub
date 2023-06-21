import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Organization = sequelize.define(
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
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { Organization: OrganizationModel, Community } = models;
				OrganizationModel.hasMany(Community, {
					onDelete: 'CASCADE',
					as: 'communities',
					foreignKey: 'organizationId',
				});
			},
		},
	},
) as any;
