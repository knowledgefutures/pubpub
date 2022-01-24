import { DocJson, Pub, SubmissionWorkflow } from 'types';

export const managerStatuses = ['pending', 'accepted', 'declined'] as const;
export const submitterStatuses = ['pending'] as const;
export const initialStatuses = ['incomplete'] as const;

export const submissionStatuses = [
	...new Set([...initialStatuses, ...managerStatuses, ...submitterStatuses]),
] as const;

export type SubmissionStatus = typeof submissionStatuses[number];

export type Submission = {
	id: string;
	pubId: string;
	pub?: Pub;
	submissionWorkflowId: string;
	submissionWorkflow?: SubmissionWorkflow;
	status: SubmissionStatus;
	submittedAt: null | string;
	abstract: null | DocJson;
};

export type SubmissionEmailKind = 'received' | 'accepted' | 'declined';
