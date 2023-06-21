import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const PubEdge = sequelize.define(
	'PubEdge',
	{
		id: sequelize.idType,
		pubId: { type: dataTypes.UUID, allowNull: false },
		externalPublicationId: { type: dataTypes.UUID, allowNull: true },
		targetPubId: { type: dataTypes.UUID, allowNull: true },
		relationType: { type: dataTypes.STRING, allowNull: false },
		rank: { type: dataTypes.TEXT, allowNull: false },
		pubIsParent: { type: dataTypes.BOOLEAN, allowNull: false },
		approvedByTarget: { type: dataTypes.BOOLEAN, allowNull: false },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: ({ PubEdge: PubEdgeModel, Pub, ExternalPublication }) => {
				PubEdgeModel.belongsTo(Pub, {
					onDelete: 'CASCADE',
					as: 'pub',
					foreignKey: 'pubId',
				});
				PubEdgeModel.belongsTo(Pub, {
					onDelete: 'CASCADE',
					as: 'targetPub',
					foreignKey: 'targetPubId',
				});
				PubEdgeModel.belongsTo(ExternalPublication, {
					onDelete: 'CASCADE',
					as: 'externalPublication',
					foreignKey: 'externalPublicationId',
				});
			},
		},
	},
) as any;
