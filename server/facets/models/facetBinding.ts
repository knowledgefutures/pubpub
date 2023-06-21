import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../../sequelize';

export const FacetBinding = sequelize.define(
	'FacetBinding',
	{
		id: sequelize.idType,
		pubId: { type: dataTypes.UUID, allowNull: true },
		collectionId: { type: dataTypes.UUID, allowNull: true },
		communityId: { type: dataTypes.UUID, allowNull: true },
	},
	{
		indexes: [
			{ fields: ['communityId'], using: 'BTREE' },
			{ fields: ['collectionId'], using: 'BTREE' },
			{ fields: ['pubId'], using: 'BTREE' },
		],
		// @ts-expect-error ts(2345): Argument of type '{ indexes: { fields: string[]; using: string; }[]; classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { FacetBinding: FacetBindingModel, Community, Collection, Pub } = models;
				FacetBindingModel.belongsTo(Community, {
					onDelete: 'CASCADE',
					as: 'community',
					foreignKey: 'communityId',
				});
				FacetBindingModel.belongsTo(Collection, {
					onDelete: 'CASCADE',
					as: 'collection',
					foreignKey: 'collectionId',
				});
				FacetBindingModel.belongsTo(Pub, {
					onDelete: 'CASCADE',
					as: 'pub',
					foreignKey: 'pubId',
				});
			},
		},
	},
) as any;
