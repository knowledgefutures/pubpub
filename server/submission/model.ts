import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const Submission = sequelize.define(
	'Submission',
	{
		id: sequelize.idType,
		status: {
			type: dataTypes.TEXT,
			allowNull: false,
		},
		submittedAt: { type: dataTypes.DATE },
		submissionWorkflowId: { type: dataTypes.UUID, allowNull: false },
		pubId: { type: dataTypes.UUID, allowNull: false },
		abstract: { type: dataTypes.JSONB, allowNull: true },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const { Pub, Submission: SubmissionModel, SubmissionWorkflow } = models;
				SubmissionModel.belongsTo(Pub, {
					onDelete: 'CASCADE',
					as: 'pub',
					foreignKey: 'pubId',
				});
				SubmissionModel.belongsTo(SubmissionWorkflow, {
					onDelete: 'CASCADE',
					as: 'submissionWorkflow',
					foreignKey: 'submissionWorkflowId',
				});
			},
		},
	},
) as any;
