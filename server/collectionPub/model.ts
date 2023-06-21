import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const CollectionPub = sequelize.define(
	'CollectionPub',
	{
		id: sequelize.idType,
		pubId: { type: dataTypes.UUID, allowNull: false },
		collectionId: { type: dataTypes.UUID, allowNull: false },
		contextHint: { type: dataTypes.TEXT },
		rank: { type: dataTypes.TEXT, allowNull: false },
		pubRank: { type: dataTypes.TEXT, allowNull: false },
	},
	{
		indexes: [
			// Index to enforce that there is one CollectionPub per (collection, pub) pair
			{
				fields: ['collectionId', 'pubId'],
				unique: true,
			},
		],
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { CollectionPub: CollectionPubModel, Collection, Pub } = models;
				CollectionPubModel.belongsTo(Collection, {
					onDelete: 'CASCADE',
					as: 'collection',
					foreignKey: 'collectionId',
				});
				CollectionPubModel.belongsTo(Pub, {
					onDelete: 'CASCADE',
					as: 'pub',
					foreignKey: 'pubId',
				});
			},
		},
	},
) as any;
