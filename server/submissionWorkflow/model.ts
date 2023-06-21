import { DataTypes as dataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export const SubmissionWorkflow = sequelize.define(
	'SubmissionWorkflow',
	{
		id: sequelize.idType,
		title: { type: dataTypes.TEXT, allowNull: false },
		collectionId: { type: dataTypes.UUID },
		enabled: { type: dataTypes.BOOLEAN, allowNull: false },
		instructionsText: { type: dataTypes.JSONB, allowNull: false },
		acceptedText: { type: dataTypes.JSONB, allowNull: false },
		declinedText: { type: dataTypes.JSONB, allowNull: false },
		receivedEmailText: { type: dataTypes.JSONB, allowNull: false },
		introText: { type: dataTypes.JSONB, allowNull: false },
		targetEmailAddresses: { type: dataTypes.JSONB, allowNull: false, defaultValue: [] },
		requireAbstract: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
		requireDescription: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
	},
	{
		// @ts-expect-error ts(2345): Argument of type '{ classMethods: { associate: (models: any) => void; }; }' is not assignable to parameter of type 'ModelOptions<Model<any, any>>'. Object literal may only specify known properties, and 'classMethods' does not exist in type 'ModelOptions<Model<any, any>>'.
		classMethods: {
			associate: (models) => {
				const {
					Collection,
					SubmissionWorkflow: SubmissionWorkflowModel,
					Submission,
				} = models;
				SubmissionWorkflowModel.hasMany(Submission, {
					as: 'submissions',
					foreignKey: 'submissionWorkflowId',
				});
				SubmissionWorkflowModel.belongsTo(Collection, {
					as: 'collection',
					foreignKey: 'collectionId',
				});
			},
		},
	},
) as any;
