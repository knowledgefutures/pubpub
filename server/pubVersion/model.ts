import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const PubVersion = sequelize.define(
	'PubVersion',
	{
		id: sequelize.idType,
		historyKey: { type: dataTypes.INTEGER },
		pubId: { type: dataTypes.UUID },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { PubVersion: PubVersionModel, Pub } = models;
				PubVersionModel.belongsTo(Pub, {
					onDelete: 'CASCADE',
					as: 'pub',
					foreignKey: 'pubId',
				});
			},
		},
	},
) as any;
