import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../../sequelize';

export const FacetDefinition = sequelize.define(
	'FacetDefinition',
	{
		id: sequelize.idType,
		name: { type: dataTypes.TEXT, allowNull: false },
		structure: { type: dataTypes.JSONB, allowNull: false },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ indexes: { fields: string[]; using: string; }[]; classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { FacetDefinition: FacetDefinitionModel, FacetInstance } = models;
				FacetDefinitionModel.hasMany(FacetInstance, {
					onDelete: 'CASCADE',
					as: 'instances',
					foreignKey: 'facetDefinitionId',
				});
			},
		},
	},
) as any;
