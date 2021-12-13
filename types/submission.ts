export const managerStatuses = ['pending', 'accepted', 'declined'] as const;
export const submitterStatuses = ['pending'] as const;
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
	submittedAt: null | string;
};
