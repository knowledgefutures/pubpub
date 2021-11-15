import { DocJson } from 'types';
import { LayoutBlockSubmissionBanner } from 'utils/layout';

export const managerStatuses = ['submitted', 'accepted', 'declined'] as const;
export const submitterStatuses = ['submitted'] as const;
export const initialStatuses = ['incomplete'] as const;

export const submissionStatuses = [
	...initialStatuses,
	...managerStatuses,
	...submitterStatuses,
] as const;

export type SubmissionStatus = typeof submissionStatuses[number];

export type Submission = {
	id: string;
	status: SubmissionStatus;
};

export type SubmissionWorkflow = {
	id: string;
	createdAt: string;
	updatedAt: string;
	enabled: boolean;
	instructionsText: DocJson;
	emailText: DocJson;
	targetEmailAddress: string;
	bannerContent: LayoutBlockSubmissionBanner['content'];
};
