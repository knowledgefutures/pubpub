import { asyncMap } from 'utils/async';

export const up = async ({ Sequelize, sequelize, models }) => {
	const { SubmissionWorkflow } = models;

	await sequelize.queryInterface.addColumn('SubmissionWorkflows', 'targetEmailAddresses', {
		type: Sequelize.JSONB,
		allowNull: false,
		defaultValue: [],
	});

	await asyncMap(
		await SubmissionWorkflow.findAll(),
		(submissionWorkflow) => {
			submissionWorkflow.targetEmailAddresses = [submissionWorkflow.targetEmailAddress];
			return submissionWorkflow.save();
		},
		{ concurrency: 100 },
	);
};

export const down = async ({ sequelize }) => {
	await sequelize.queryInterface.removeColumn('SubmissionWorkflows', 'targetEmailAddresses');
};
