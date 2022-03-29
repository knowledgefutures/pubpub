import { SubmissionWorkflow } from 'types';

export const submissionWorkflowConfigSteps = [
	'instructions-requirements',
	'response-emails',
	'layout-banner',
] as const;

export const submissionWorkflowConfigStepLabels: Record<SubmissionWorkflowConfigStep, string> = {
	'instructions-requirements': 'Instructions & Requirements',
	'response-emails': 'Email correspondence',
	'layout-banner': 'Layout banner',
};

export type SubmissionWorkflowConfigStep = typeof submissionWorkflowConfigSteps[number];

export type EditableSubmissionWorkflow = Omit<
	SubmissionWorkflow,
	'id' | 'createdAt' | 'updatedAt' | 'collectionId'
>;
