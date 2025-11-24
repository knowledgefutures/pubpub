import type { SubmissionWorkflow } from 'types';

import type { EditableSubmissionWorkflow } from './types';

import { apiFetch } from 'client/utils/apiFetch';

export const createSubmissionWorkflow = (
	workflow: Omit<EditableSubmissionWorkflow, 'enabled'>,
	collectionId: string,
) => {
	return apiFetch.post('/api/submissionWorkflows', {
		...workflow,
		collectionId,
		enabled: true,
	});
};

export const updateSubmissionWorkflow = (
	update: Partial<SubmissionWorkflow>,
	collectionId: string,
) => {
	return apiFetch.put('/api/submissionWorkflows', { ...update, collectionId });
};
