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
