import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Merge = sequelize.define(
	'Merge',
	{
		id: sequelize.idType,
		noteContent: { type: dataTypes.JSONB },
		noteText: { type: dataTypes.TEXT },
		/* Set by Associations */
		userId: { type: dataTypes.UUID, allowNull: false },
		pubId: { type: dataTypes.UUID, allowNull: false },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { User, Merge: MergeModel } = models;
				MergeModel.belongsTo(User, {
					onDelete: 'CASCADE',
					as: 'user',
					foreignKey: 'userId',
				});
			},
		},
	},
) as any;
