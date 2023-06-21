import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Visibility = sequelize.define(
	'Visibility',
	{
		id: sequelize.idType,
		access: {
			type: dataTypes.ENUM,
			values: ['private', 'members', 'public'],
			defaultValue: 'private',
		},
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { Visibility: VisibilityModel, User } = models;
				VisibilityModel.belongsToMany(User, {
					as: 'users',
					through: 'VisibilityUser',
					foreignKey: 'visibilityId',
				});
			},
		},
	},
) as any;
