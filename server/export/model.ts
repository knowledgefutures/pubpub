import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Export = sequelize.define(
	'Export',
	{
		id: sequelize.idType,
		format: { type: dataTypes.STRING, allowNull: false },
		url: { type: dataTypes.STRING, allowNull: true },
		historyKey: { type: dataTypes.INTEGER, allowNull: false },
		pubId: { type: dataTypes.UUID, allowNull: false },
		workerTaskId: { type: dataTypes.UUID, allowNull: true },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { Export: ExportModel, WorkerTask } = models;
				ExportModel.belongsTo(WorkerTask, {
					onDelete: 'SET NULL',
					as: 'workerTask',
					foreignKey: 'workerTaskId',
				});
			},
		},
	},
) as any;
